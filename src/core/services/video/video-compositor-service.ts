/**
 * 视频合成服务 - Video Compositor Service
 *
 * 合并自原 6 个子模块（environment / dispatch / tauri / ffmpeg / helpers / service），
 * 保持对外 API 完全兼容。
 *
 * @module core/services/video/video-compositor-service
 */

import { fetchFile } from '@ffmpeg/util';
import { saveAs } from 'file-saver';

import { isTauri } from '@/core/utils/environment';
import { loadFFmpeg, ffmpegWasmService, type ProgressCallback } from '@/core/services/video/ffmpeg-wasm-service';
import { logger } from '@/core/utils/logger';


/** 检测浏览器是否支持 FFmpeg.wasm（需 SharedArrayBuffer） */
function isFFmpegWasmAvailable(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}

/** 返回当前环境的"能力快照" */
function getSupportedFeatures(): {
  ffmpegWasm: boolean;
  tauri: boolean;
  sharedArrayBuffer: boolean;
} {
  const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  return {
    ffmpegWasm: sharedArrayBuffer,
    tauri: isTauri(),
    sharedArrayBuffer,
  };
}


/** 双模式分支的通用签名 */
type ModeBranch<TResult> = (...args: unknown[]) => Promise<TResult>;

/**
 * 根据当前运行环境自动选择 Tauri 或 FFmpeg.wasm 实现。
 */
async function dispatchByMode<TResult>(
  tauriBranch: ModeBranch<TResult>,
  ffmpegBranch: ModeBranch<TResult>,
  args: unknown[],
  errorMessage: string
): Promise<TResult> {
  if (isTauri()) {
    try {
      return await tauriBranch(...args);
    } catch (error) {
      logger.error('[VideoCompositor] Tauri 调用失败:', error);
      throw error;
    }
  }

  if (isFFmpegWasmAvailable()) {
    try {
      return await ffmpegBranch(...args);
    } catch (error) {
      logger.error('[VideoCompositor] FFmpeg.wasm 调用失败:', error);
      throw error;
    }
  }

  throw new Error(errorMessage);
}

/**
 * 把 ffmpegWasmService 的"内层返回 resultBlob + outputPath"转换为
 * 上层 CompositionResult 形状
 */
function mapWasmResultToComposition(
  wasmResult: { outputPath: string; resultBlob: Blob },
  resolution?: { width?: number; height?: number }
): {
  outputPath: string;
  outputBlob: Blob;
  duration: number;
  width: number;
  height: number;
  fileSize: number;
} {
  return {
    outputPath: wasmResult.outputPath,
    outputBlob: wasmResult.resultBlob,
    duration: 0,
    width: resolution?.width ?? 1920,
    height: resolution?.height ?? 1080,
    fileSize: wasmResult.resultBlob.size,
  };
}


/** 懒加载 @tauri-apps/api/core 并调用指定命令 */
async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

/** Tauri: 合成视频 */
async function tauriComposeVideo(
  scenes: import('@/core/services/video/ffmpeg-wasm-service').CompositionScene[],
  options: import('@/core/services/video/ffmpeg-wasm-service').CompositionOptions
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  return tauriInvoke<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult>('compose_video', { scenes, options });
}

/** Tauri: 添加字幕 */
async function tauriAddSubtitles(
  videoBlob: Blob,
  subtitles: import('@/core/services/video/ffmpeg-wasm-service').SubtitleTrack,
  style: import('@/core/services/video/ffmpeg-wasm-service').SubtitleStyle,
  outputFormat: 'mp4' | 'webm'
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  return tauriInvoke<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult>('add_subtitles', {
    videoBlob,
    subtitles,
    style,
    outputPath: `output_with_subtitles.${outputFormat}`,
  });
}

/** Tauri: 添加背景音乐 */
async function tauriAddBackgroundMusic(
  videoBlob: Blob,
  music: import('@/core/services/video/ffmpeg-wasm-service').BackgroundMusic,
  outputFormat: 'mp4' | 'webm'
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  return tauriInvoke<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult>('add_audio', {
    videoBlob,
    music,
    outputPath: `output_with_music.${outputFormat}`,
  });
}

/** Tauri: 导出视频 */
async function tauriExportVideo(
  inputBlob: Blob,
  outputFormat: 'mp4' | 'webm',
  options: { bitrate?: string; fps?: number; resolution?: { width: number; height: number } }
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  return tauriInvoke<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult>('export_video', { inputBlob, outputFormat, options });
}

/** Tauri: 合并多个视频 */
async function tauriConcatenateVideos(
  videoBlobs: Blob[],
  outputFormat: 'mp4' | 'webm'
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  return tauriInvoke<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult>('concat_videos', {
    videoBlobs,
    outputPath: `concatenated.${outputFormat}`,
  });
}

/** Tauri: 获取导出进度 */
async function tauriGetExportProgress(): Promise<unknown> {
  return tauriInvoke('get_export_progress');
}

/** Tauri: 取消导出 */
async function tauriCancelExport(): Promise<unknown> {
  return tauriInvoke('cancel_export');
}


/** FFmpeg.wasm: 合成视频 */
async function ffmpegComposeVideo(
  scenes: import('@/core/services/video/ffmpeg-wasm-service').CompositionScene[],
  options: import('@/core/services/video/ffmpeg-wasm-service').CompositionOptions,
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  return ffmpegWasmService.compose(scenes, options, progressCallback);
}

/** FFmpeg.wasm: 添加字幕 */
async function ffmpegAddSubtitles(
  videoBlob: Blob,
  subtitles: import('@/core/services/video/ffmpeg-wasm-service').SubtitleTrack,
  style: import('@/core/services/video/ffmpeg-wasm-service').SubtitleStyle,
  outputFormat: 'mp4' | 'webm',
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  const result = await ffmpegWasmService.addSubtitles(videoBlob, subtitles, style, outputFormat, progressCallback);
  return mapWasmResultToComposition(result);
}

/** FFmpeg.wasm: 添加背景音乐 */
async function ffmpegAddBackgroundMusic(
  videoBlob: Blob,
  music: import('@/core/services/video/ffmpeg-wasm-service').BackgroundMusic,
  outputFormat: 'mp4' | 'webm',
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  const result = await ffmpegWasmService.addBackgroundMusic(
    videoBlob,
    music.filePath,
    { volume: music.volume, fadeIn: music.fadeIn, fadeOut: music.fadeOut, loop: music.loop },
    outputFormat,
    progressCallback
  );
  return mapWasmResultToComposition(result);
}

/** FFmpeg.wasm: 导出视频（带分辨率回退到 1920x1080） */
async function ffmpegExportVideo(
  inputBlob: Blob,
  outputFormat: 'mp4' | 'webm',
  options: {
    bitrate?: string;
    fps?: number;
    resolution?: { width: number; height: number };
  },
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  const result = await ffmpegWasmService.export(inputBlob, outputFormat, options, progressCallback);
  return mapWasmResultToComposition(result, options.resolution);
}

/** FFmpeg.wasm: 合并多个视频 */
async function ffmpegConcatenateVideos(
  videoBlobs: Blob[],
  outputFormat: 'mp4' | 'webm',
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  const result = await ffmpegWasmService.concatenate(videoBlobs, outputFormat, progressCallback);
  return mapWasmResultToComposition(result);
}


/**
 * 把 URL / string / Blob 统一转为 Blob
 */
async function toBlob(input: Blob | string): Promise<Blob> {
  if (typeof input === 'string') {
    const response = await fetch(input);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    return await response.blob();
  }
  return input;
}

/**
 * 获取导出进度
 */
async function getExportProgress(): Promise<import('@/core/services/video/ffmpeg-wasm-service').ExportProgress> {
  if (!isTauri()) {
    return { progress: 100, status: 'completed' };
  }
  try {
    return (await tauriGetExportProgress()) as import('@/core/services/video/ffmpeg-wasm-service').ExportProgress;
  } catch {
    return { progress: 100, status: 'completed' };
  }
}

/**
 * 取消导出
 */
async function cancelExport(): Promise<void> {
  if (!isTauri()) return;
  try {
    await tauriCancelExport();
  } catch {
    // 静默
  }
}

/**
 * 通过 FFmpeg.wasm 抽帧，返回 ObjectURL 数组
 */
async function extractFrames(videoBlob: Blob, fps: number = 1): Promise<string[]> {
  if (!isFFmpegWasmAvailable()) {
    throw new Error('提取帧需要支持 SharedArrayBuffer 的浏览器');
  }

  try {
    const ff = await ffmpegWasmService.getInstance();
    const inputName = 'input_video.mp4';
    const frameDir = 'frames';

    await ff.writeFile(inputName, await fetchFile(videoBlob));

    await ff.createDir?.(frameDir).catch(() => {
      /* 目录已存在 */
    });

    await ff.exec(['-i', inputName, '-vf', `fps=${fps}`, `${frameDir}/frame_%04d.png`]);

    const frameFiles: string[] = [];
    let i = 1;
    while (true) {
      const frameName = `frame_${String(i).padStart(4, '0')}.png`;
      try {
        const data = await ff.readFile(`${frameDir}/${frameName}`);
        const blob = new Blob([data as BlobPart], { type: 'image/png' });
        frameFiles.push(URL.createObjectURL(blob));
        i++;
      } catch {
        break;
      }
    }

    await ff.deleteFile(inputName);
    for (const frameFile of frameFiles) {
      URL.revokeObjectURL(frameFile);
    }

    return frameFiles;
  } catch (error) {
    logger.error('[VideoCompositor] FFmpeg.wasm 提取帧失败:', error);
    throw error;
  }
}

/** 获取视频元信息 */
async function getVideoInfo(videoBlob: Blob): Promise<{
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
}> {
  return ffmpegWasmService.getVideoInfo(videoBlob);
}

/** 浏览器端下载视频 */
function downloadVideo(blob: Blob, fileName: string): void {
  saveAs(blob, fileName);
}


/**
 * 初始化视频合成器
 */
export async function initializeVideoCompositor(
  progressCallback?: ProgressCallback
): Promise<boolean> {
  if (isTauri()) {
    logger.info('[VideoCompositor] 使用 Tauri 模式');
    return true;
  }

  if (!isFFmpegWasmAvailable()) {
    logger.warn('[VideoCompositor] 当前环境不支持 FFmpeg.wasm (需要 SharedArrayBuffer)');
    return false;
  }

  try {
    progressCallback?.({ progress: 0, status: 'loading', message: '正在加载 FFmpeg.wasm...' });

    const loaded = await loadFFmpeg(progressCallback);

    if (loaded) {
      logger.info('[VideoCompositor] FFmpeg.wasm 初始化成功');
    }

    return loaded;
  } catch (error) {
    logger.error('[VideoCompositor] FFmpeg.wasm 初始化失败:', error);
    return false;
  }
}

/**
 * 合成视频（双模式分发：Tauri invoke → FFmpeg.wasm）
 */
export async function composeVideo(
  scenes: Parameters<typeof tauriComposeVideo>[0],
  options: Parameters<typeof tauriComposeVideo>[1] = {},
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  return dispatchByMode(
    (s, o) => tauriComposeVideo(s as Parameters<typeof tauriComposeVideo>[0], o as Parameters<typeof tauriComposeVideo>[1]),
    (s, o) => ffmpegComposeVideo(s as Parameters<typeof ffmpegComposeVideo>[0], o as Parameters<typeof ffmpegComposeVideo>[1], progressCallback),
    [scenes, options],
    '视频合成需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器'
  );
}

/** 添加字幕（双模式分发） */
export async function addSubtitles(
  videoInput: Blob | string,
  subtitles: Parameters<typeof tauriAddSubtitles>[1],
  style: Parameters<typeof tauriAddSubtitles>[2] = {},
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  const videoBlob = await toBlob(videoInput);

  return dispatchByMode(
    (b, s, st, f) => tauriAddSubtitles(b as Blob, s as Parameters<typeof tauriAddSubtitles>[1], st as Parameters<typeof tauriAddSubtitles>[2], f as 'mp4' | 'webm'),
    (b, s, st, f) => ffmpegAddSubtitles(b as Blob, s as Parameters<typeof ffmpegAddSubtitles>[1], st as Parameters<typeof ffmpegAddSubtitles>[2], f as 'mp4' | 'webm', progressCallback),
    [videoBlob, subtitles, style, outputFormat],
    '添加字幕需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器'
  );
}

/** 添加背景音乐（双模式分发） */
export async function addBackgroundMusic(
  videoBlob: Blob,
  music: Parameters<typeof tauriAddBackgroundMusic>[1],
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  return dispatchByMode(
    (b, m, f) => tauriAddBackgroundMusic(b as Blob, m as Parameters<typeof tauriAddBackgroundMusic>[1], f as 'mp4' | 'webm'),
    (b, m, f) => ffmpegAddBackgroundMusic(b as Blob, m as Parameters<typeof ffmpegAddBackgroundMusic>[1], f as 'mp4' | 'webm', progressCallback),
    [videoBlob, music, outputFormat],
    '添加背景音乐需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器'
  );
}

/** 导出视频（双模式分发） */
export async function exportVideo(
  inputBlob: Blob,
  outputFormat: 'mp4' | 'webm',
  options: Parameters<typeof tauriExportVideo>[2] = {},
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  return dispatchByMode(
    (b, f, o) => tauriExportVideo(b as Blob, f as 'mp4' | 'webm', o as Parameters<typeof tauriExportVideo>[2]),
    (b, f, o) => ffmpegExportVideo(b as Blob, f as 'mp4' | 'webm', o as Parameters<typeof ffmpegExportVideo>[2], progressCallback),
    [inputBlob, outputFormat, options],
    '导出视频需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器'
  );
}

/** 合并多个视频（双模式分发） */
export async function concatenateVideos(
  videoBlobs: Blob[],
  outputFormat: 'mp4' | 'webm' = 'mp4',
  progressCallback?: ProgressCallback
): Promise<import('@/core/services/video/ffmpeg-wasm-service').CompositionResult> {
  return dispatchByMode(
    (b, f) => tauriConcatenateVideos(b as Blob[], f as 'mp4' | 'webm'),
    (b, f) => ffmpegConcatenateVideos(b as Blob[], f as 'mp4' | 'webm', progressCallback),
    [videoBlobs, outputFormat],
    '合并视频需要 Tauri 环境或支持 SharedArrayBuffer 的浏览器'
  );
}


export { toBlob, getExportProgress, cancelExport, extractFrames, getVideoInfo, downloadVideo };


export type {
  CompositionScene,
  SubtitleTrack,
  SubtitleStyle,
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
  ExportProgress,
  ProgressCallback,
} from '@/core/services/video/ffmpeg-wasm-service';


export const videoCompositorService = {
  initialize: initializeVideoCompositor,
  compose: composeVideo,
  addSubtitles,
  addBackgroundMusic,
  export: exportVideo,
  concatenate: concatenateVideos,
  getProgress: getExportProgress,
  cancelExport,
  extractFrames,
  getVideoInfo,
  download: downloadVideo,
  getSupportedFeatures,
  isFFmpegWasmAvailable: () => isFFmpegWasmAvailable(),
  isTauriAvailable: isTauri,
};

export default videoCompositorService;
