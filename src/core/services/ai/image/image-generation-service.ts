/**
 * 图像生成服务 - 统一入口
 * 支持：字节 Seedream、快手可灵、生数 Vidu
 */

// Re-export types
export type {
  ImageModel,
  ImageSize,
  ImageGenerationOptions,
  ImageGenerationResult,
  VideoGenerationOptions,
  VideoGenerationResult,
} from './image-generation/types';

// Re-export providers
export { generateWithSeedream } from './image-generation/providers/seedream';
export { generateWithKling, generateVideoWithKling } from './image-generation/providers/kling';
export { generateWithVidu, generateVideoWithVidu } from './image-generation/providers/vidu';
export { generateVideoWithSeedance } from './image-generation/providers/seedance';

// Import from providers for unified API
import axios from 'axios';

import { retryRequest } from '@/core/utils';
import { logger } from '@/core/utils/logger';

import { generateWithKling, generateVideoWithKling } from './image-generation/providers/kling';
import { generateVideoWithSeedance } from './image-generation/providers/seedance';
import { generateWithSeedream } from './image-generation/providers/seedream';
import { generateWithVidu, generateVideoWithVidu } from './image-generation/providers/vidu';
import type {
  ImageGenerationOptions,
  ImageGenerationResult,
  VideoGenerationOptions,
  VideoGenerationResult,
} from './image-generation/types';
import { getAPIKey } from './image-generation/utils';

/** 默认重试次数 */
const DEFAULT_MAX_RETRIES = 2;

/** 是否是网络错误（可重试） */
export function isNetworkError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    // 网络错误、超时、5xx 服务器错误可重试
    const status = error.response?.status;
    return (
      !status || // 网络错误
      status === 408 || // 请求超时
      status === 429 || // 请求过多
      status >= 500 // 服务器错误
    );
  }
  return false;
}

/**
 * 图像生成 - 统一入口（带重试机制）
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {}
): Promise<ImageGenerationResult> {
  const model = options.model ?? 'seedream-5.0';
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  const provider = (() => {
    switch (model) {
      case 'seedream-5.0':
        return generateWithSeedream;
      case 'kling-1.6':
        return generateWithKling;
      case 'vidu-2.0':
        return generateWithVidu;
      default:
        return generateWithSeedream;
    }
  })();

  if (maxRetries <= 0) {
    return provider(prompt, options);
  }

  return retryRequest(() => provider(prompt, options), {
    maxRetries,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: isNetworkError,
    onRetry: (attempt, error) => {
      logger.warn(`[ImageGen] ${model} 生成失败，尝试第 ${attempt} 次: ${error}`);
    },
  });
}

/**
 * 视频生成 - 统一入口（带重试机制）
 */
export async function generateVideo(
  prompt: string,
  options: VideoGenerationOptions = {}
): Promise<VideoGenerationResult> {
  const model = options.model ?? 'seedance-2.0';
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

  const provider = (() => {
    switch (model) {
      case 'seedance-2.0':
        return generateVideoWithSeedance;
      case 'kling-1.6':
        return generateVideoWithKling;
      case 'vidu-2.0':
        return generateVideoWithVidu;
      default:
        return generateVideoWithSeedance;
    }
  })();

  if (maxRetries <= 0) {
    return provider(prompt, options);
  }

  return retryRequest(() => provider(prompt, options), {
    maxRetries,
    delay: 2000, // 视频生成需要更长的间隔
    backoff: 'exponential',
    retryCondition: isNetworkError,
    onRetry: (attempt, error) => {
      logger.warn(`[VideoGen] ${model} 生成失败，尝试第 ${attempt} 次: ${error}`);
    },
  });
}

/**
 * 查询视频生成状态
 */
export async function getVideoStatus(
  taskId: string,
  model: string = 'seedance-2.0'
): Promise<VideoGenerationResult> {
  let url = '';
  let apiKey = '';

  switch (model) {
    case 'seedance-2.0':
      url = `https://ark.cn-beijing.volces.com/api/v3/video/tasks/${taskId}`;
      apiKey = await getAPIKey('seedance');
      break;
    case 'kling-1.6':
      url = `https://api.klingai.com/v1/videos/tasks/${taskId}`;
      apiKey = await getAPIKey('kling');
      break;
    case 'vidu-2.0':
      url = `https://api.vidu.cn/v1/videos/tasks/${taskId}`;
      apiKey = await getAPIKey('vidu');
      break;
  }

  const response = await axios({
    method: 'get',
    url,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  const videoData = response.data?.data ?? response.data;

  return {
    url: videoData?.url ?? '',
    coverUrl: videoData?.cover_url ?? videoData?.cover_image_url,
    duration: videoData?.duration ?? 5,
    width: videoData?.width ?? 1920,
    height: videoData?.height ?? 1080,
    model,
    taskId,
    status:
      videoData?.status === 'completed'
        ? 'completed'
        : videoData?.status === 'failed'
          ? 'failed'
          : 'processing',
  };
}


export const imageGenerationService = {
  generateImage,
  generateVideo,
  getVideoStatus,
  // 单独服务
  seedream: generateWithSeedream,
  kling: {
    image: generateWithKling,
    video: generateVideoWithKling,
  },
  vidu: {
    image: generateWithVidu,
    video: generateVideoWithVidu,
  },
  seedance: generateVideoWithSeedance,
};

export default imageGenerationService;
