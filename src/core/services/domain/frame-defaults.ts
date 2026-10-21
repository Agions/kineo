/**
 * FrameAnimation 默认值工厂
 *
 * 原 composition-service.ts 中 3 处重复出现的
 *   { cameraMotion: null, zoom: 1, pan: {x:0,y:0}, rotation:0,
 *     opacity:1, filters: {blur:0,brightness:100,contrast:100,saturation:100},
 *     keyframes: [] }
 * 抽到这里 + exportComposition 里的 fallback 默认值也走同一工厂。
 *
 * 单一职责：构造 FrameAnimation 默认值。
 */

import type { FrameAnimation } from '@/core/types';

/** 默认 zoom（无缩放） */
export const DEFAULT_ZOOM = 1;
/** 默认 opacity（不透明） */
export const DEFAULT_OPACITY = 1;
/** 默认 rotation */
export const DEFAULT_ROTATION = 0;
/** 默认 pan */
export const DEFAULT_PAN = { x: 0, y: 0 } as const;
/** 默认 filters（非 optional 强制断言，避免 TS 推断成 undefined） */
export const DEFAULT_FILTERS = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  saturation: 100,
} as const;

/**
 * 用作"插入新帧"与"导入数据补默认值"的双重兜底。
 * 入参可以是部分 FrameAnimation（用于 create/setFrameAnimation 合并场景），
 * 也可以是 ExportCompositionData 的 ComposeFrameData。
 *
 * 行为与原代码逐字一致：
 * - zoom ?? 1
 * - pan ?? { x:0, y:0 }
 * - rotation ?? 0
 * - opacity ?? 1
 * - filters 各字段 ?? 默认值
 * - keyframes ?? []
 * - cameraMotion ?? null
 */
export function createDefaultFrameAnimation(
  frameId: string,
  overrides?: Partial<FrameAnimation>
): FrameAnimation {
  return {
    frameId,
    cameraMotion: overrides?.cameraMotion ?? null,
    zoom: overrides?.zoom ?? DEFAULT_ZOOM,
    pan: overrides?.pan ?? { x: DEFAULT_PAN.x, y: DEFAULT_PAN.y },
    rotation: overrides?.rotation ?? DEFAULT_ROTATION,
    opacity: overrides?.opacity ?? DEFAULT_OPACITY,
    filters: {
      blur: overrides?.filters?.blur ?? DEFAULT_FILTERS.blur,
      brightness: overrides?.filters?.brightness ?? DEFAULT_FILTERS.brightness,
      contrast: overrides?.filters?.contrast ?? DEFAULT_FILTERS.contrast,
      saturation: overrides?.filters?.saturation ?? DEFAULT_FILTERS.saturation,
    },
    keyframes: overrides?.keyframes ?? [],
  };
}

/**
 * 类型守卫：检查一个对象是否看起来像 cameraMotion。
 * 仅做轻量运行时校验（type/duration/intensity 字段存在）。
 */
