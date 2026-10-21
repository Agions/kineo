/**
 * Video services: composition, ffmpeg-wasm wrapper, scene analysis,
 * subtitle, visual consistency scoring.
 */

export * from './video-analysis-service';
export * from './video-compositor-service';
export * from './scene-analyzer-service';
export * from './visual-consistency-scorer-service';
export * from './ffmpeg-wasm-service';
export * from './subtitle-service';

// ffmpeg-wasm subdirectory: re-export common types only (avoid Scene/etc collision with composition.types)

// video-composition-types: re-export only distinct type names to avoid collision
// Source of truth: @/core/video/types/composition (single canonical location)
export type {
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
  ExportProgress,
  ProgressCallback,
  CompositionScene,
  SceneEffect,
  SubtitleRenderStyle,
  SubtitleTrack,
  SubtitleItem,
  SubtitleFormat,
} from '@/core/video/types/composition';

// Backward compat alias — 老代码 import SubtitleStyle 仍能用
export type { SubtitleRenderStyle as SubtitleStyle } from '@/core/video/types/composition';
