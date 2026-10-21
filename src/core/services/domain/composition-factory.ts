/**
 * Composition 工厂
 *
 * 把 "创建/导入 CompositionProject" 的纯逻辑从 CompositionService 类剥离。
 * 单帧构造委托 frame-defaults.createDefaultFrameAnimation 消除重复。
 */

import { v4 as uuidv4 } from 'uuid';

import type { CompositionProject, StoryboardFrame } from '@/core/types';

import {
  createDefaultMasterSettings,
  EXPORT_SCHEMA_VERSION,
  type ComposeFrameData,
  type ExportCompositionData,
} from './composition-types';
import {
  createDefaultFrameAnimation,
  DEFAULT_FILTERS,
  DEFAULT_OPACITY,
  DEFAULT_PAN,
  DEFAULT_ROTATION,
  DEFAULT_ZOOM,
} from './frame-defaults';

/**
 * 创建空白合成项目（按 masterSettings 默认值填充）。
 * 行为与原 CompositionService.create 逐字一致。
 */
export function createComposition(
  projectId: string,
  masterSettingsOverrides?: Partial<CompositionProject['masterSettings']>
): CompositionProject {
  const composition: CompositionProject = {
    id: uuidv4(),
    projectId,
    frames: [],
    transitions: [],
    masterSettings: createDefaultMasterSettings(masterSettingsOverrides),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return composition;
}

/**
 * 从分镜批量构造 FrameAnimation 数组（每帧默认值，无关键帧）。
 * 用于 initializeFromStoryboard。
 */
export function buildFramesFromStoryboard(storyboardFrames: StoryboardFrame[]) {
  return storyboardFrames.map((frame) => createDefaultFrameAnimation(frame.id));
}

/**
 * 从 ExportCompositionData 重建 CompositionProject。
 * 行为与原 CompositionService.importComposition 一致：
 * - id 重新生成（不复用导入数据的 id）
 * - frames 全部走 createDefaultFrameAnimation，keyframes 强制为空数组
 * - transitions / masterSettings 直接搬过来
 */
export function importCompositionFromData(data: ExportCompositionData): CompositionProject {
  return {
    id: uuidv4(),
    projectId: data.projectId,
    frames: data.frames.map((f) =>
      createDefaultFrameAnimation(f.frameId, {
        cameraMotion: f.cameraMotion ?? null,
        zoom: f.zoom,
        pan: f.pan,
        rotation: f.rotation,
        opacity: f.opacity,
        filters: f.filters,
      })
    ),
    transitions: data.transitions,
    masterSettings: data.masterSettings,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 把 CompositionProject 序列化为导出格式。
 * 行为与原 CompositionService.exportComposition 逐字一致（默认值兜底）。
 */
export function exportCompositionToData(composition: CompositionProject): ExportCompositionData {
  return {
    version: EXPORT_SCHEMA_VERSION,
    projectId: composition.projectId,
    frames: composition.frames.map<ComposeFrameData>((f) => ({
      frameId: f.frameId,
      cameraMotion: f.cameraMotion ?? null,
      zoom: f.zoom ?? DEFAULT_ZOOM,
      pan: f.pan ?? { x: DEFAULT_PAN.x, y: DEFAULT_PAN.y },
      rotation: f.rotation ?? DEFAULT_ROTATION,
      opacity: f.opacity ?? DEFAULT_OPACITY,
      filters: {
        blur: f.filters?.blur ?? DEFAULT_FILTERS.blur,
        brightness: f.filters?.brightness ?? DEFAULT_FILTERS.brightness,
        contrast: f.filters?.contrast ?? DEFAULT_FILTERS.contrast,
        saturation: f.filters?.saturation ?? DEFAULT_FILTERS.saturation,
      },
    })),
    transitions: composition.transitions,
    masterSettings: composition.masterSettings,
    exportedAt: new Date().toISOString(),
  };
}
