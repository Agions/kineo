/**
 * ProjectBlackboardStoreBridge.ts — ProjectBlackboard 与 Zustand useProjectStore 双向响应式同步桥
 *
 * 核心职责：
 * 1. 消除状态孤岛：打通 Multi-Agent 运行态黑板 (ProjectBlackboard) 与前端全局持久化 Store (useProjectStore)；
 * 2. 状态双向同步：
 *    - Agent 演化推导数据（DAG 节点、角色 DNA、分镜机位、质检报告、审批断点）防抖反写 Store 保证落盘；
 *    - 用户在 UI 编辑台词/分镜/人设时，实时注入活跃黑板，确保智能体使用最新创作数据；
 * 3. 审批断点离线保活与恢复：支持从 ProjectData 无损还原待裁决的 ApprovalGate，防止刷新页面后丢失挂起任务。
 */

import type { ProjectData } from '@/core/project/types/project';
import { ProjectBlackboard, BlackboardData } from '../agent/ProjectBlackboard';
import { useProjectStore } from '@/stores';

export class ProjectBlackboardStoreBridge {
  /**
   * 从 ProjectData 构建并水合 ProjectBlackboard 实例
   */
  public static createBlackboardFromProject(project: ProjectData): ProjectBlackboard {
    const rawContent = project.script || project.novelText || project.content || '';
    const bb = new ProjectBlackboard(rawContent, 'novel_text', project.name || '漫剧工程');

    // 水合已有领域数据
    const patch: Partial<BlackboardData> = {
      projectId: project.id,
      projectName: project.name || '漫剧工程',
      scriptContent: rawContent,
      characters: project.characters || [],
      scenes: project.parsedScenes || (project.storyboardFrames as any) || [],
      spatialMemory: project.spatialMemory || {
        characterAnchors: {},
        sceneAnchors: {},
        assetHitRate: 0.92,
      },
      cameraDirectingPlans: project.cameraDirectingPlans || {},
      auditReports: project.auditReports || [],
      subtitles: project.subtitles || [],
      dagNodes: project.dagNodes || {},
      activeApprovalGates: project.activeApprovalGates || {},
      approvalHistory: project.approvalHistory || [],
      currentReflection: project.currentReflection ?? null,
      stage: (project.stage as any) || 'idle',
      updatedAt: project.updatedAt || new Date().toISOString(),
    };

    bb.update(patch, 'bridge', 'StoreBridge', '从 useProjectStore 水合并初始化黑板状态');
    return bb;
  }

  /**
   * 立即将 Blackboard 当前状态全量同步到 Store
   */
  public static syncBlackboardToStore(
    blackboard: ProjectBlackboard,
    projectId: string,
    store = useProjectStore
  ): void {
    const data = blackboard.getData();

    const patch: Partial<ProjectData> = {
      name: data.projectName,
      script: data.scriptContent,
      characters: data.characters,
      parsedScenes: data.scenes,
      storyboardFrames: data.scenes as any,
      spatialMemory: data.spatialMemory,
      cameraDirectingPlans: data.cameraDirectingPlans,
      auditReports: data.auditReports,
      subtitles: data.subtitles,
      dagNodes: data.dagNodes,
      activeApprovalGates: data.activeApprovalGates,
      approvalHistory: data.approvalHistory,
      currentReflection: data.currentReflection,
      stage: data.stage,
      updatedAt: new Date().toISOString(),
    };

    store.getState().updateProject(projectId, patch);
  }

  /**
   * 将 Store 中用户修改的场景与角色反向同步回 Blackboard
   */
  public static syncProjectToBlackboard(project: ProjectData, blackboard: ProjectBlackboard): void {
    const currentBbData = blackboard.getData();

    // 检查是否有实质变更，避免无效循环 update
    const needsUpdate =
      (project.characters && project.characters !== currentBbData.characters) ||
      (project.parsedScenes && project.parsedScenes !== currentBbData.scenes) ||
      (project.script && project.script !== currentBbData.scriptContent);

    if (needsUpdate) {
      blackboard.update(
        {
          characters: project.characters || currentBbData.characters,
          scenes: project.parsedScenes || currentBbData.scenes,
          scriptContent: project.script || currentBbData.scriptContent,
        },
        'user-editor',
        'UserEditor',
        '用户在前端编辑器更新了剧本或角色，同步至黑板'
      );
    }
  }

  /**
   * 建立 Blackboard 到 Store 的反应式同步桥
   * @param blackboard 要监听的黑板
   * @param projectId 绑定的项目 ID
   * @param store 目标 Zustand Store (默认 useProjectStore)
   * @param debounceMs 防抖延迟毫秒数 (默认 250ms)
   * @returns 取消绑定的清理函数
   */
  public static bind(
    blackboard: ProjectBlackboard,
    projectId: string,
    store = useProjectStore,
    debounceMs: number = 250
  ): () => void {
    let timer: any = null;
    let lastActiveGateCount = Object.keys(blackboard.getData().activeApprovalGates || {}).length;

    const unsubscribe = blackboard.subscribe((data) => {
      const currentActiveGateCount = Object.keys(data.activeApprovalGates || {}).length;
      const isCriticalEvent =
        currentActiveGateCount !== lastActiveGateCount ||
        data.stage === 'completed' ||
        data.stage === 'idle';

      lastActiveGateCount = currentActiveGateCount;

      // 关键事件（如审批门触发/裁决、执行完成）立即同步，不走防抖
      if (isCriticalEvent) {
        if (timer) clearTimeout(timer);
        this.syncBlackboardToStore(blackboard, projectId, store);
        return;
      }

      // 普通推导演化（如 Agent 日志追加）走防抖，避免高频写入 Store
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        this.syncBlackboardToStore(blackboard, projectId, store);
        timer = null;
      }, debounceMs);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }
}
