/**
 * 视频合成（多场景 → 单个视频文件）
 *
 * 复刻原 composeVideoWithFFmpeg 行为：支持全图片场景与图片/视频混合场景。
 * 子流程已抽到 ffmpeg-pipeline / filter-builder 中，本文件只剩业务编排。
 */

import { fetchFile } from '@ffmpeg/util';

import { RESOLUTION_1080P } from '@/core/constants/media-presets';
import { logger } from '@/core/utils/logger';

import { getFFmpegInstance, setActiveProgressCallback } from './ffmpeg-instance';
import { execFFmpegCommand, readOutputAsBlob, safeDeleteFiles } from './ffmpeg-pipeline';
import { buildImageOnlyFilterComplex, buildMixedMediaFilterComplex } from './filter-builder';
import type {
  CompositionOptions,
  CompositionResult,
  ProgressCallback,
  CompositionScene,
} from './types';

interface SceneInputSource {
  source: Blob | string;
  name: string;
}

/**
 * 把 Scene[] 映射成 FFmpeg 输入文件描述。
 */
function buildSceneInputSources(scenes: CompositionScene[]): SceneInputSource[] {
  return scenes.map((scene, index) => {
    if (scene.mediaType === 'image') {
      return { source: scene.mediaPath, name: `input_image_${index}.png` };
    }
    return { source: scene.mediaPath, name: `input_video_${index}.mp4` };
  });
}

/**
 * 判断场景列表是否全是图片。
 */
function isAllImageScenes(scenes: CompositionScene[]): boolean {
  return scenes.every((scene) => scene.mediaType === 'image');
}

/**
 * 全图片场景：构造输入参数 + filter_complex 并执行。
 */
async function composeAllImageScenes(
  ff: Awaited<ReturnType<typeof getFFmpegInstance>>,
  scenes: CompositionScene[],
  resolution: { width: number; height: number },
  fps: number,
  totalDurationSeconds: number,
  outputFile: string
): Promise<void> {
  const args: string[] = ['-y'];

  for (let i = 0; i < scenes.length; i++) {
    args.push('-loop', '1', '-i', `input_image_${i}.png`);
    args.push('-t', String(scenes[i].duration));
  }

  const filterComplex = buildImageOnlyFilterComplex(scenes, resolution);
  args.push(
    '-filter_complex',
    filterComplex,
    '-map',
    '[outv]',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-r',
    String(fps),
    '-t',
    String(totalDurationSeconds),
    outputFile
  );

  await execFFmpegCommand(ff, args);
}

/**
 * 混合图片/视频场景：构造 concat demuxer 路径并执行。
 */
async function composeMixedScenes(
  ff: Awaited<ReturnType<typeof getFFmpegInstance>>,
  scenes: CompositionScene[],
  resolution: { width: number; height: number },
  totalDurationSeconds: number,
  outputFile: string
): Promise<void> {
  const args: string[] = ['-y'];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    if (scene.mediaType === 'image') {
      args.push('-loop', '1', '-i', `input_image_${i}.png`);
    } else {
      args.push('-i', `input_video_${i}.mp4`);
    }
  }

  // 注：原实现连续 push 了多个 -filter_complex，FFmpeg 会按顺序应用，
  // 这里保留这一行为以确保业务结果不变。
  for (let i = 0; i < scenes.length; i++) {
    const perScene = `[${i}:v]scale=${resolution.width}:${resolution.height}:force_original_aspect_ratio=decrease,pad=${resolution.width}:${resolution.height}:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS+${totalDurationSeconds}s/TB[v${i}]`;
    args.push('-filter_complex', perScene);
  }

  const concatFilter = buildMixedMediaFilterComplex(
    scenes.length,
    resolution,
    totalDurationSeconds
  );
  args.push('-filter_complex', concatFilter);
  args.push('-map', '[outv]', '-c:v', 'libx264', '-t', String(totalDurationSeconds), outputFile);

  await execFFmpegCommand(ff, args);
}

/**
 * 视频合成主入口（保留原函数签名与行为）。
 */
export async function composeVideoWithFFmpeg(
  scenes: CompositionScene[],
  options: CompositionOptions = {},
  progressCallback?: ProgressCallback
): Promise<CompositionResult> {
  setActiveProgressCallback(progressCallback ?? null);

  const ff = await getFFmpegInstance();
  const format = options.format ?? 'mp4';
  const fps = options.fps ?? 30;
  const resolution = options.resolution ?? RESOLUTION_1080P;
  const outputFile = `output.${format}`;
  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);

  progressCallback?.({
    progress: 5,
    status: 'preparing',
    message: '准备合成视频...',
  });

  // 写入所有输入媒体
  const sources = buildSceneInputSources(scenes);
  const writtenNames: string[] = [];
  for (let i = 0; i < sources.length; i++) {
    progressCallback?.({
      progress: 5 + Math.round((i / sources.length) * 20),
      status: 'processing',
      message: `加载媒体 ${i + 1}/${sources.length}...`,
    });
    try {
      const { source, name } = sources[i];
      const data = await fetchFile(source);
      await ff.writeFile(name, data);
      writtenNames.push(name);
    } catch (error) {
      logger.error(`[FFmpeg.wasm] 加载媒体失败 ${scenes[i].mediaPath}:`, error);
      throw new Error(`无法加载媒体文件: ${scenes[i].mediaPath}`);
    }
  }

  progressCallback?.({
    progress: 30,
    status: 'processing',
    message: '开始合成视频...',
  });

  if (isAllImageScenes(scenes)) {
    await composeAllImageScenes(ff, scenes, resolution, fps, totalDuration, outputFile);
  } else {
    await composeMixedScenes(ff, scenes, resolution, totalDuration, outputFile);
  }

  progressCallback?.({
    progress: 90,
    status: 'encoding',
    message: '生成输出文件...',
  });

  const { blob } = await readOutputAsBlob(ff, outputFile, `video/${format}`);
  await safeDeleteFiles(ff, [...writtenNames, outputFile]);

  setActiveProgressCallback(null);

  return {
    outputPath: outputFile,
    outputBlob: blob,
    duration: totalDuration,
    width: resolution.width,
    height: resolution.height,
    fileSize: blob.size,
  };
}
