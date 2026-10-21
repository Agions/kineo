/**
 * FFmpeg.wasm 服务类型定义
 *
 * 从 @/types/media 重导出共享类型。
 * 仅保留 FFmpeg 专有类型（精简 SubtitleTrack）。
 * VideoMetadata 已迁移到 @/types/media，此处为兼容重导出。
 */

export type {
  CompositionScene,
  SceneEffect,
  SubtitleRenderStyle,
  Subtitle,
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
  ExportProgress,
  ProgressCallback,
  VideoMetadata,
} from '@/core/video/types/composition';

// Backward compat: ffmpeg internal code used `SubtitleStyle` historically.
// Render style 与 Editor style 语义统一后, 此处简化为 type alias.
// 如需 Editor 风格(全 required), 请直接 import from features/subtitle.
export type { SubtitleRenderStyle as SubtitleStyle } from '@/core/video/types/composition';

/**
 * 字幕轨道（FFmpeg 精简版：子项为无 id 的 Subtitle）。
 * 与 @/types/media 的完整版 SubtitleTrack (SubtitleItem[], 含 label/language)
 * 语义不同，供 manga-pipeline / 合成管线使用。
 */
export interface SubtitleTrack {
  id: string;
  subtitles: import('@/core/video/types/composition').Subtitle[];
}
