/**
 * ProjectDataBus.ts — 领域模型双向通信与状态总线
 *
 * 核心职责：
 * 1. 响应式桥接：作为 Multi-Agent Director 2.0 (ACS-2.0 Blackboard) 与 Zustand (useProjectStore) 之间的响应式状态桥。
 * 2. 状态映射与防抖合并：将 Agent 协作推演输出的标准模型（剧本、角色 DNA、分镜、纳米空间记忆、质检审计报告）平滑同步至用户项目存储。
 * 3. 资产卸载驱动：协同 AssetPersistenceBridge，在 Agent 生成图像/音频时自动将 Base64 卸载至本地/IndexedDB，保持项目对象体积精简。
 */

import type { ProjectData } from '@/common/types/project';
import type { NovelScene } from '@/core/script/types/novel';
import { ProjectBlackboard, BlackboardData } from '@/core/services/agent/ProjectBlackboard';
import type { StoryboardFrame } from '@/core/storyboard/types/storyboard';
import { logger } from '@/core/utils/logger';
import { useProjectStore } from '@/stores';

export type BusEventType =
  | 'blackboard:synced'
  | 'project:updated'
  | 'asset:persisted'
  | 'dag:node-changed'
  | 'audit:reflected';

export type BusEventHandler<T = unknown> = (payload: T) => void;

export class ProjectDataBus {
  private static instance: ProjectDataBus;
  private activeSubscriptions = new Map<string, () => void>();
  private eventListeners = new Map<BusEventType, Set<BusEventHandler>>();

  public static getInstance(): ProjectDataBus {
    if (!ProjectDataBus.instance) {
      ProjectDataBus.instance = new ProjectDataBus();
    }
    return ProjectDataBus.instance;
  }

  // ========== 事件总线机制 ==========

  public on<T = unknown>(event: BusEventType, handler: BusEventHandler<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler as BusEventHandler);
    return () => {
      this.eventListeners.get(event)?.delete(handler as BusEventHandler);
    };
  }

  public emit<T = unknown>(event: BusEventType, payload: T): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(payload);
        } catch (e) {
          logger.error(`[ProjectDataBus] 事件 ${event} 监听器执行异常:`, e);
        }
      });
    }
  }

  // ========== Blackboard <-> useProjectStore 响应式桥接 ==========

  /**
   * 将一个 Blackboard 实例绑定到指定的 ProjectId 上，开启防抖监听与自动同步
   */
  public bindBlackboard(
    blackboard: ProjectBlackboard,
    projectId: string,
    debounceMs: number = 300
  ): () => void {
    // 若之前已存在对该项目的监听，先注销
    if (this.activeSubscriptions.has(projectId)) {
      this.activeSubscriptions.get(projectId)!();
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = blackboard.subscribe((data) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          this.syncBlackboardToProjectStore(data, projectId);
        } catch (err) {
          logger.error(`[ProjectDataBus] 同步 Blackboard 到 ProjectStore 失败:`, err);
        }
      }, debounceMs);
    });

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
      this.activeSubscriptions.delete(projectId);
    };

    this.activeSubscriptions.set(projectId, cleanup);
    return cleanup;
  }

  /**
   * 将 Blackboard 数据格式化并同步入 Zustand useProjectStore
   */
  public syncBlackboardToProjectStore(bbData: BlackboardData, projectId: string): ProjectData | null {
    const store = useProjectStore.getState();
    const existing = store.projects.find((p) => p.id === projectId);
    if (!existing) {
      logger.warn(`[ProjectDataBus] 未在 ProjectStore 中找到目标项目: ${projectId}`);
      return null;
    }

    // 映射 NovelScene[] -> StoryboardFrame[]
    const storyboardFrames: StoryboardFrame[] = (bbData.scenes || []).map((scene: NovelScene) => {
      let dialogueStr = '';
      if (Array.isArray(scene.dialogues)) {
        dialogueStr = scene.dialogues.map((d) => `${d.character}: ${d.content}`).join('\n');
      }

      const visualPrompt = scene.imagePrompts && scene.imagePrompts.length > 0 ? scene.imagePrompts[0] : '';

      return {
        id: scene.id || `frame-${scene.sceneNumber}`,
        title: scene.title || `场景 ${scene.sceneNumber}: ${scene.location || '主场景'}`,
        sceneDescription: scene.content || visualPrompt,
        composition: scene.location || '全景',
        cameraType: '中景',
        dialogue: dialogueStr,
        duration: 3,
        imageUrl: '',
      };
    });

    // 阶段映射
    let projectStatus: ProjectData['status'] = existing.status;
    if (bbData.stage === 'completed') {
      projectStatus = 'completed';
    } else if (bbData.stage !== 'idle') {
      projectStatus = 'processing';
    }

    const updates: Partial<ProjectData> = {
      script: bbData.scriptContent || existing.script,
      characters: bbData.characters && bbData.characters.length > 0 ? bbData.characters : existing.characters,
      storyAnalysis: bbData.storyAnalysis || existing.storyAnalysis,
      storyboardFrames: storyboardFrames.length > 0 ? storyboardFrames : existing.storyboardFrames,
      parsedScenes: bbData.scenes && bbData.scenes.length > 0 ? bbData.scenes : existing.parsedScenes,
      status: projectStatus,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...(typeof existing.metadata === 'object' && existing.metadata !== null ? existing.metadata : {}),
        spatialMemory: bbData.spatialMemory,
        cameraDirectingPlans: bbData.cameraDirectingPlans,
        auditReports: bbData.auditReports,
        subtitles: bbData.subtitles,
        dagNodes: bbData.dagNodes,
      },
    };

    store.updateProject(projectId, updates);
    this.emit('blackboard:synced', { projectId, updates });
    return { ...existing, ...updates };
  }

  /**
   * 将现有项目数据回填到 Blackboard 中，支持断点续创与离线恢复
   */
  public loadProjectIntoBlackboard(project: ProjectData, blackboard: ProjectBlackboard): void {
    const meta = (project.metadata || {}) as Record<string, unknown>;

    blackboard.update(
      {
        projectId: project.id,
        projectName: project.name,
        scriptContent: project.script || project.content || '',
        characters: project.characters || [],
        storyAnalysis: project.storyAnalysis || null,
        scenes: (project.parsedScenes || []) as NovelScene[],
        spatialMemory: (meta.spatialMemory as BlackboardData['spatialMemory']) || {
          characterAnchors: {},
          sceneAnchors: {},
          assetHitRate: 0.92,
        },
        cameraDirectingPlans: (meta.cameraDirectingPlans as BlackboardData['cameraDirectingPlans']) || {},
        auditReports: (meta.auditReports as BlackboardData['auditReports']) || [],
        subtitles: (meta.subtitles as BlackboardData['subtitles']) || [],
        dagNodes: (meta.dagNodes as BlackboardData['dagNodes']) || {},
      },
      'system',
      'ProjectDataBus',
      `从本地工程 ${project.id} 回填恢复黑板状态`
    );
  }

  /**
   * 工厂函数：基于 ProjectData 快速创建并初始化已绑定同步的 Blackboard
   */
  public createBlackboardForProject(project: ProjectData): ProjectBlackboard {
    const bb = new ProjectBlackboard(project.script || project.content || '', 'novel_text', project.name);
    this.loadProjectIntoBlackboard(project, bb);
    this.bindBlackboard(bb, project.id);
    return bb;
  }
}

export const projectDataBus = ProjectDataBus.getInstance();
