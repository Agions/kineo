/**
 * 动态合成配置管理服务（Facade）
 *
 * 原 497 行 CompositionService 类混合了"类型定义 / 默认值 / 持久化 /
 * 订阅管理 / 工厂构造 / CRUD 编排"6 类职责。现拆为 5 个子模块，主类只做
 * CRUD 编排：
 *
 * - composition-types           interface + 默认值常量 + 工厂 + 类型守卫
 * - frame-defaults              createDefaultFrameAnimation（消除 3 处重复）
 * - composition-persistence     loadCompositionsFromStorage / saveCompositionsToStorage
 * - composition-subscriber      CompositionSubscriber（监听器集合）
 * - composition-factory         createComposition / importCompositionFromData
 *                               / exportCompositionToData / buildFramesFromStoryboard
 *
 * 公开 API 完全兼容（CompositionService 类 + getCompositionService +
 * resetCompositionService），857 行测试 1 行无需修改。
 */

import type {
  CompositionProject,
  FrameAnimation,
  StoryboardFrame,
  TransitionConfig,
} from '@/core/types';
import { logger } from '@/core/utils/logger';

import {
  buildFramesFromStoryboard,
  createComposition,
  exportCompositionToData,
  importCompositionFromData,
} from './composition-factory';
import { loadCompositionsFromStorage, saveCompositionsToStorage } from './composition-persistence';
import { CompositionSubscriber } from './composition-subscriber';
import {
  type AnimationKeyframeInput,
  type CompositionListener,
  type CompositionServiceOptions,
  type ExportCompositionData,
  normalizeAnimationProperty,
  normalizeEasing,
} from './composition-types';
import { createDefaultFrameAnimation } from './frame-defaults';

// 类型 + 监听器 re-export（保持旧 import 路径有效）
export type {
  AllowedEasing,
  AnimationKeyframeInput,
  CompositionListener,
  CompositionServiceOptions,
  ComposeFrameData,
  ExportCompositionData,
} from './composition-types';

export class CompositionService {
  private compositions: Map<string, CompositionProject> = new Map();
  private autoSave: boolean;
  private subscriber = new CompositionSubscriber();

  constructor(options: CompositionServiceOptions = {}) {
    this.autoSave = options.autoSave ?? true;
    this.hydrateFromStorage();
  }

  // ─────────── CRUD ───────────

  create(
    projectId: string,
    masterSettings?: Partial<CompositionProject['masterSettings']>
  ): CompositionProject {
    const composition = createComposition(projectId, masterSettings);
    this.compositions.set(composition.id, composition);
    this.afterChange(composition);
    return composition;
  }

  getByProjectId(projectId: string): CompositionProject | null {
    for (const comp of this.compositions.values()) {
      if (comp.projectId === projectId) {
        return comp;
      }
    }
    return null;
  }

  getById(compositionId: string): CompositionProject | undefined {
    return this.compositions.get(compositionId);
  }

  delete(compositionId: string): boolean {
    const removed = this.compositions.delete(compositionId);
    if (removed) {
      this.persist();
    }
    return removed;
  }

  listAll(): CompositionProject[] {
    return Array.from(this.compositions.values());
  }

  clear(): void {
    this.compositions.clear();
    this.subscriber.notify(null);
    this.persist();
  }

  // ─────────── 帧动画 ───────────

  setFrameAnimation(
    compositionId: string,
    frameId: string,
    animation: Partial<FrameAnimation>
  ): FrameAnimation | null {
    const comp = this.compositions.get(compositionId);
    if (!comp) return null;

    const existingIndex = comp.frames.findIndex((f) => f.frameId === frameId);

    if (existingIndex >= 0) {
      comp.frames[existingIndex] = {
        ...comp.frames[existingIndex],
        ...animation,
      };
    } else {
      comp.frames.push(createDefaultFrameAnimation(frameId, animation));
    }

    this.afterChange(comp);
    return comp.frames.find((f) => f.frameId === frameId) ?? null;
  }

  initializeFromStoryboard(compositionId: string, frames: StoryboardFrame[]): boolean {
    const comp = this.compositions.get(compositionId);
    if (!comp) return false;

    comp.frames = buildFramesFromStoryboard(frames);
    this.afterChange(comp);
    return true;
  }

  deleteFrameAnimation(compositionId: string, frameId: string): boolean {
    const comp = this.compositions.get(compositionId);
    if (!comp) return false;

    const index = comp.frames.findIndex((f) => f.frameId === frameId);
    if (index === -1) return false;

    comp.frames.splice(index, 1);
    this.afterChange(comp);
    return true;
  }

  getFrameAnimation(compositionId: string, frameId: string): FrameAnimation | undefined {
    const comp = this.compositions.get(compositionId);
    return comp?.frames.find((f) => f.frameId === frameId);
  }

  // ─────────── 转场 ───────────

  setTransition(compositionId: string, index: number, transition: TransitionConfig): boolean {
    const comp = this.compositions.get(compositionId);
    if (!comp) return false;

    if (index >= comp.transitions.length) {
      comp.transitions.push(transition);
    } else {
      comp.transitions[index] = transition;
    }

    this.afterChange(comp);
    return true;
  }

  setDefaultTransition(compositionId: string, transition: TransitionConfig): boolean {
    const comp = this.compositions.get(compositionId);
    if (!comp) return false;

    comp.masterSettings.defaultTransition = transition;
    this.afterChange(comp);
    return true;
  }

  updateMasterSettings(
    compositionId: string,
    settings: Partial<CompositionProject['masterSettings']>
  ): boolean {
    const comp = this.compositions.get(compositionId);
    if (!comp) return false;

    comp.masterSettings = {
      ...comp.masterSettings,
      ...settings,
    };
    this.afterChange(comp);
    return true;
  }

  // ─────────── 关键帧 ───────────

  addKeyframe(compositionId: string, frameId: string, keyframe: AnimationKeyframeInput): boolean {
    const comp = this.compositions.get(compositionId);
    if (!comp) return false;

    const frame = comp.frames.find((f) => f.frameId === frameId);
    if (!frame) return false;

    if (!frame.keyframes) {
      frame.keyframes = [];
    }

    frame.keyframes.push({
      time: keyframe.time,
      property: normalizeAnimationProperty(keyframe.property),
      value: keyframe.value,
      easing: normalizeEasing(keyframe.easing),
    });

    // 按时间排序（与原行为一致）
    frame.keyframes.sort((a, b) => a.time - b.time);

    this.afterChange(comp);
    return true;
  }

  deleteKeyframe(compositionId: string, frameId: string, keyframeIndex: number): boolean {
    const comp = this.compositions.get(compositionId);
    if (!comp) return false;

    const frame = comp.frames.find((f) => f.frameId === frameId);
    if (!frame?.keyframes || keyframeIndex >= frame.keyframes.length) {
      return false;
    }

    frame.keyframes.splice(keyframeIndex, 1);
    this.afterChange(comp);
    return true;
  }

  // ─────────── 导入导出 ───────────

  exportComposition(compositionId: string): ExportCompositionData | null {
    const comp = this.compositions.get(compositionId);
    if (!comp) return null;
    return exportCompositionToData(comp);
  }

  importComposition(data: ExportCompositionData): CompositionProject | null {
    try {
      const composition = importCompositionFromData(data);
      this.compositions.set(composition.id, composition);
      this.afterChange(composition);
      return composition;
    } catch (error) {
      logger.error('Failed to import composition:', error);
      return null;
    }
  }

  // ─────────── 订阅 ───────────

  subscribe(listener: CompositionListener): () => void {
    return this.subscriber.subscribe(listener);
  }

  // ─────────── 内部辅助 ───────────

  /** 统一"改完之后"流程：updatedAt + notify + persist */
  private afterChange(composition: CompositionProject): void {
    composition.updatedAt = new Date().toISOString();
    this.subscriber.notify(composition);
    this.persist();
  }

  /** 写入持久化（autoSave=false 时跳过） */
  private persist(): void {
    if (!this.autoSave) return;
    saveCompositionsToStorage(this.listAll());
  }

  /** 构造时从 localStorage 恢复 */
  private hydrateFromStorage(): void {
    const items = loadCompositionsFromStorage();
    this.compositions = new Map(items.map((comp) => [comp.id, comp]));
  }
}

// ─────────── 单例工厂（保留原行为） ───────────

let compositionServiceInstance: CompositionService | null = null;

export function getCompositionService(options?: CompositionServiceOptions): CompositionService {
  if (!compositionServiceInstance) {
    compositionServiceInstance = new CompositionService(options);
  }
  return compositionServiceInstance;
}

export function resetCompositionService(): void {
  compositionServiceInstance = null;
}
