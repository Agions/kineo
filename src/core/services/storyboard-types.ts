/**
 * 分镜服务共享类型与常量
 * @module core/services/storyboard-types
 *
 * 提取自原 storyboard-service.ts 中散落的 interface / const。
 * 其它子模块（frame-factory / prompt-builder / persistence / scene-splitter / subscriber）
 * 共用这套类型，保持领域模型一致。
 */

/** 分镜服务构造选项 */
export interface StoryboardServiceOptions {
  projectId?: string;
  autoSave?: boolean;
}

/** generateFromScript 接收的剧本输入结构 */
export interface ScriptInput {
  title: string;
  content: string;
  segments?: Array<{ content: string; type: string }>;
}

/** generateFromScript 调用选项 */
export interface GenerateStoryboardOptions {
  provider?: string;
  model?: string;
  frameCount?: number;
}

/** 镜头类型 → 图像提示词中文标签的映射（与 StoryboardFrame.cameraType 对应） */
export const CAMERA_TYPE_PROMPT_MAP: Record<string, string> = {
  wide: '全景镜头',
  medium: '中景镜头',
  closeup: '特写镜头',
  pan: '横摇镜头',
  tilt: '竖摇镜头',
  dolly: '推拉镜头',
  tracking: '跟随镜头',
};

/** 默认分镜字段值（与原 StoryboardService.create / bulkCreate / generateFromScript 内部默认值完全一致） */
export const STORYBOARD_FRAME_DEFAULTS = {
  composition: '中心构图',
  cameraType: 'medium',
  dialogue: '',
  duration: 5,
} as const;

import { STORAGE_KEYS } from '@/core/constants/app-config';

/** localStorage 存储键前缀 */
export const STORYBOARD_STORAGE_KEY = STORAGE_KEYS.STORYBOARDS;

/** 项目级 key 构造（与原 StoryboardService.loadFromStorage / saveToStorage 逻辑一致） */
export function buildStoryboardStorageKey(projectId?: string): string {
  return projectId ? `${STORYBOARD_STORAGE_KEY}-${projectId}` : STORYBOARD_STORAGE_KEY;
}

/** 内部"未指定项目"哨兵 key —— 与原实现 `this.projectId ?? 'default'` 一致 */
export const DEFAULT_PROJECT_KEY = 'default';

/** 把项目 ID 规整为存储 / Map 使用的 key */
export function resolveProjectKey(projectId?: string): string {
  return projectId ?? DEFAULT_PROJECT_KEY;
}

/** 重导出 StoryboardFrame，避免外部导入散落 */
export type { StoryboardFrame } from '@/core/storyboard/types/storyboard';
