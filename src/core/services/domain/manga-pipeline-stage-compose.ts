/**
 * 流水线阶段 4：视频合成
 * @module core/services/domain/manga-pipeline-stage-compose
 *
 * 提取自原 generateFromNovel "阶段 4" 块（composeVideo + 字幕合并 + finalVideoUrl 回填）。
 */

import type { CompositionScene } from '@/core/video/types/composition';
import type { SubtitleTrack } from '@/core/services/video/ffmpeg-wasm-service';
import { composeVideo, addSubtitles } from '@/core/services/video/video-compositor-service';

import {
  MAIN_SUBTITLE_TRACK_ID,
  SCENE_VIDEO_DURATION_SECONDS,
  SCENE_VIDEO_VOLUME,
  STAGE_PROGRESS_START,
} from './manga-pipeline-types';
import type {
  StageProgressEmitter,
  PipelineConfig,
  PipelineScene,
} from './manga-pipeline-types';

/**
 * 把 pipelineScenes 映射为 composeVideo 期望的 Scene 数组
 *
 * 行为与原 generateFromNovel 阶段 4 内联 `.map((s, i) => ({...}))` 字节级一致：
 *   - 过滤有 videoUrl 的
 *   - startTime = i * 5
 *   - duration = 5
 *   - volume = 1.0
 */
export function buildVideoScenesFromPipeline(pipelineScenes: PipelineScene[]): CompositionScene[] {
  return pipelineScenes
    .filter((s) => s.videoUrl)
    .map((s, i) => ({
      id: s.id,
      mediaPath: s.videoUrl!,
      mediaType: 'video' as const,
      startTime: i * SCENE_VIDEO_DURATION_SECONDS,
      duration: SCENE_VIDEO_DURATION_SECONDS,
      volume: SCENE_VIDEO_VOLUME,
    }));
}

/**
 * 合并所有场景的字幕到主字幕轨
 *
 * 行为与原 generateFromNovel 阶段 4 `pipelineScenes.forEach((scene, i) => ...)` 字节级一致：
 *   - startTime / endTime 整体平移 i * 5
 */
export function mergeSubtitleTracks(pipelineScenes: PipelineScene[]): SubtitleTrack {
  const merged: SubtitleTrack = { id: MAIN_SUBTITLE_TRACK_ID, subtitles: [] };
  pipelineScenes.forEach((scene, i) => {
    if (!scene.subtitles) return;
    scene.subtitles.subtitles.forEach((sub) => {
      merged.subtitles.push({
        ...sub,
        startTime: sub.startTime + i * SCENE_VIDEO_DURATION_SECONDS,
        endTime: sub.endTime + i * SCENE_VIDEO_DURATION_SECONDS,
      });
    });
  });
  return merged;
}

/**
 * 阶段 4：合成视频 + 可选字幕
 *
 * 行为与原 generateFromNovel 阶段 4 字节级一致：
 *   - 起始 overallProgress=80
 *   - 合成完成后回填 scene.finalVideoUrl
 *   - 任一场景有 subtitles 时整体合并
 */
export async function composePipelineVideo(
  pipelineScenes: PipelineScene[],
  config: PipelineConfig,
  emit: StageProgressEmitter,
  totalScenes: number
): Promise<void> {
  emit.emit('composing', STAGE_PROGRESS_START.compose, 0, 0, totalScenes, '开始合成视频');

  const videoScenes = buildVideoScenesFromPipeline(pipelineScenes);
  if (videoScenes.length === 0) return;

  const composeResult = await composeVideo(videoScenes, config.composition);

  if (pipelineScenes.some((s) => s.subtitles)) {
    const allSubtitles = mergeSubtitleTracks(pipelineScenes);
    await addSubtitles(composeResult.outputPath, allSubtitles);
  }

  pipelineScenes.forEach((scene) => {
    scene.finalVideoUrl = composeResult.outputPath;
  });
}
