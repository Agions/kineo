/**
 * Composition 模块类型与默认常量
 *
 * 把 composition-service.ts 中的 interface / 默认值常量集中到此处，
 * 多个子模块共享，避免循环依赖。
 */

import type {
  AnimationProperty,
  CameraMotion,
  CompositionProject,
  TransitionConfig,
} from '@/core/types';
import { STORAGE_KEYS } from '@/core/constants/app-config';

/** Composition 服务构造选项 */
export interface CompositionServiceOptions {
  projectId?: string;
  autoSave?: boolean;
}

/** 内部导出的单帧配置（与导出数据形状对齐） */
export interface ComposeFrameData {
  frameId: string;
  cameraMotion?: {
    type: CameraMotion;
    duration: number;
    intensity: number;
  } | null;
  zoom: number;
  pan: { x: number; y: number };
  rotation: number;
  opacity: number;
  filters: {
    blur: number;
    brightness: number;
    contrast: number;
    saturation: number;
  };
}

/** 导出给视频合成引擎的标准数据形状 */
export interface ExportCompositionData {
  version: string;
  projectId: string;
  frames: ComposeFrameData[];
  transitions: TransitionConfig[];
  masterSettings: {
    frameDuration: number;
    defaultTransition: TransitionConfig;
  };
  exportedAt: string;
}

/** 单个动画关键帧 */
export interface AnimationKeyframeInput {
  time: number;
  property: string;
  value: number;
  easing?: string;
}

/** localStorage 持久化键 */
export const COMPOSITION_STORAGE_KEY = STORAGE_KEYS.COMPOSITIONS;

/** 导出数据 schema 版本 */
export const EXPORT_SCHEMA_VERSION = '1.0';

/** 默认 masterSettings：每帧时长（秒） */
export const DEFAULT_FRAME_DURATION_SECONDS = 3;

/** 默认 masterSettings：默认转场 */
export const DEFAULT_TRANSITION: TransitionConfig = {
  effect: 'crossfade',
  duration: 0.5,
  easing: 'ease-in-out',
};

/** 默认 masterSettings 工厂 */
export function createDefaultMasterSettings(
  overrides?: Partial<CompositionProject['masterSettings']>
): CompositionProject['masterSettings'] {
  return {
    frameDuration: overrides?.frameDuration ?? DEFAULT_FRAME_DURATION_SECONDS,
    defaultTransition: overrides?.defaultTransition ?? DEFAULT_TRANSITION,
  };
}

/** 类型守卫：easing 取值范围 */
const ALLOWED_EASINGS = ['linear', 'ease-in', 'ease-out', 'ease-in-out'] as const;
export type AllowedEasing = (typeof ALLOWED_EASINGS)[number];

/** 规范化 easing 字符串（非法值回退到 ease-in-out） */
export function normalizeEasing(rawEasing?: string): AllowedEasing {
  if (rawEasing && (ALLOWED_EASINGS as readonly string[]).includes(rawEasing)) {
    return rawEasing as AllowedEasing;
  }
  return 'ease-in-out';
}

/** 规范化为 AnimationProperty */
export function normalizeAnimationProperty(rawProperty: string): AnimationProperty {
  return rawProperty as AnimationProperty;
}

/** 监听器签名 */
export type CompositionListener = (composition: CompositionProject | null) => void;

/** Composition 类型重导出（便于外部统一从此处 import） */
export type {
  AnimationProperty,
  CameraMotion,
  CompositionProject,
  FrameAnimation,
  TransitionConfig,
} from '@/core/types';
