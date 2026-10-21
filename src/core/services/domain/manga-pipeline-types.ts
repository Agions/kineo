/**
 * 视频脚本流水线共享类型与常量
 * @module core/services/domain/manga-pipeline-types
 */

import type { TTSConfig } from '@/core/types';
import type {
  ImageGenerationOptions,
  VideoGenerationOptions,
} from '@/core/services/ai/image/image-generation-service';
import type { LipSyncOptions } from '@/core/services/audio/lip-sync-service';
import type { SubtitleTrack, CompositionOptions } from '@/core/services/video/ffmpeg-wasm-service';

export { DEFAULT_TTS_CONFIG } from '../audio/tts-types';

/** 流水线配置 */
export interface PipelineConfig {
  image?: ImageGenerationOptions;
  video?: VideoGenerationOptions;
  tts?: Partial<TTSConfig>;
  lipSync?: LipSyncOptions;
  composition?: CompositionOptions;
}

/** 流水线单场景输入/输出 */
export interface PipelineScene {
  id: string;
  description: string;
  imagePrompt: string;
  dialogue?: string;
  character?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  finalVideoUrl?: string;
  subtitles?: SubtitleTrack;
}

/** 流水线最终结果 */
export interface PipelineResult {
  scenes: PipelineScene[];
  finalVideoUrl?: string;
  totalProcessingTime: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/** 流水线阶段标识 */
export type PipelineStage =
  | 'analyzing'
  | 'generating_images'
  | 'generating_audio'
  | 'syncing_lips'
  | 'composing'
  | 'exporting'
  | 'completed'
  | 'failed'
  | 'processing';

/** 进度推送载荷 */
export interface PipelineProgress {
  stage: PipelineStage;
  overallProgress: number;
  stageProgress: number;
  currentSceneIndex: number;
  totalScenes: number;
  message?: string;
}

/** 进度回调签名 */
export type ProgressCallback = (progress: PipelineProgress) => void;

/** 阶段进度发射器接口（stage-*.ts 函数使用） */
export interface StageProgressEmitter {
  emit: (
    stage: PipelineStage,
    overallProgress: number,
    stageProgress: number,
    currentSceneIndex: number,
    totalScenes: number,
    message?: string
  ) => void;
}

/** 流水线各阶段在 overallProgress 上的起点百分比（消除 generateFromNovel 内 4 处 10/40/60/80 magic number） */
export const STAGE_PROGRESS_START: Record<'images' | 'audio' | 'lipsync' | 'compose', number> = {
  images: 10,
  audio: 40,
  lipsync: 60,
  compose: 80,
};

/** 各阶段在 overallProgress 上占用的宽度（30/20/20/20，加起来 = overall 90 → 末尾 10 给 completed） */
export const STAGE_PROGRESS_WIDTH: Record<'images' | 'audio' | 'lipsync' | 'compose', number> = {
  images: 30,
  audio: 20,
  lipsync: 20,
  compose: 20,
};

/** 默认图像生成模型（与原 `config.image?.model || 'seedream-5.0'` 一致） */
export const DEFAULT_IMAGE_MODEL = 'seedream-5.0';

/** 默认视频生成模型（与原 `config.video?.model || 'seedance-2.0'` 一致） */
export const DEFAULT_VIDEO_MODEL = 'seedance-2.0';

/** 场景视频默认时长（与原 composeVideo 阶段 `duration: 5` 一致） */
export const SCENE_VIDEO_DURATION_SECONDS = 5;

/** 场景视频默认音量（与原 composeVideo 阶段 `volume: 1.0` 一致） */
export const SCENE_VIDEO_VOLUME = 1.0;

/** TTS 占位 URL 前缀（与原 `pipelineScenes[i].audioUrl = 'tts_audio_' + i` 一致） */
export const TTS_AUDIO_URL_PREFIX = 'tts_audio_';

/** 主字幕轨 id（与原 `const allSubtitles: SubtitleTrack = { id: 'main', subtitles: [] }` 一致） */
export const MAIN_SUBTITLE_TRACK_ID = 'main';

/** 取消时统一错误消息（消除 3 处 throw 重复） */
export const PIPELINE_CANCELLED_MESSAGE = '流水线已被取消';

/** AbortError 在 DOM 中的标准错误名（与原 `(error as Error).name === 'AbortError'` 一致） */
export const ABORT_ERROR_NAME = 'AbortError';
