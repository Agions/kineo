/**
 * AI Image Generation Adapter
 * ================================
 * 统一接口：所有图像/视频生成 provider 实现此接口即可接入管线。
 * 新增模型只需实现接口并注册，无须改动管线代码。
 *
 * 架构：
 *   ImageGenRegistry (singleton)
 *     └── AIImageAdapter (per-model)
 *           ├── seedream  → SeedreamAdapter
 *           ├── kling     → KlingAdapter
 *           ├── vidu      → ViduAdapter
 *           └── seedance  → SeedanceAdapter
 */

import { retryRequest } from '@/core/utils';
import { logger } from '@/core/utils/logger';

import { isNetworkError } from '../image-generation-service';

import type { CharacterVideoRef, ImageSize } from './types';

// ========== Request / Response Contracts ==========

/** 统一图像生成请求 */
export interface ImageGenRequest {
  prompt: string;
  model: ImageModelId;
  size?: ImageSize;
  numImages?: number;
  negativePrompt?: string;
  style?: ImageStyle;
  quality?: ImageQuality;
  signal?: AbortSignal;
}

/** 统一图像生成响应 */
export interface ImageGenResponse {
  url: string;
  base64?: string;
  width: number;
  height: number;
  model: ImageModelId;
  processingTime?: number;
}

/** 统一视频生成请求 */
export interface VideoGenRequest {
  prompt?: string;
  model: VideoModelId;
  referenceImage?: string;
  characterReferences?: CharacterVideoRef[];
  duration?: number;
  aspectRatio?: AspectRatio;
  negativePrompt?: string;
  signal?: AbortSignal;
}

/** 统一视频生成响应 */
export interface VideoGenResponse {
  url: string;
  coverUrl?: string;
  duration: number;
  width: number;
  height: number;
  model: VideoModelId;
  taskId?: string;
  status: 'processing' | 'completed' | 'failed';
}

// ========== Typed Enums ==========

export type ImageModelId = 'seedream-5.0' | 'kling-1.6' | 'kling-3.0' | 'vidu-2.0';
export type VideoModelId = 'seedance-2.0' | 'kling-1.6' | 'kling-3.0' | 'vidu-2.0';
export type { ImageSize } from './types';
export type ImageQuality = 'standard' | 'high' | 'premium';
export type ImageStyle = 'anime' | 'realistic' | 'cartoon' | '3d';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';

export { CharacterVideoRef };

// ========== AIImageAdapter Interface ==========

/**
 * 每个 provider 必须实现的图像生成接口
 */
export interface AIImageAdapter {
  readonly modelId: ImageModelId | VideoModelId;
  readonly displayName: string;

  /** 图像生成 */
  generateImage(req: ImageGenRequest): Promise<ImageGenResponse>;

  /** 视频生成（部分模型支持） */
  generateVideo?(req: VideoGenRequest): Promise<VideoGenResponse>;

  /** 查询视频任务状态（异步模型需要） */
  getVideoStatus?(taskId: string): Promise<VideoGenResponse>;

  /** 健康检查 */
  healthCheck(): Promise<boolean>;
}

// ========== Adapter Registry ==========

type AdapterConstructor = new () => AIImageAdapter;

class ImageGenRegistry {
  private adapters = new Map<ImageModelId | VideoModelId, AIImageAdapter>();
  privateCtors = new Map<ImageModelId | VideoModelId, AdapterConstructor>();

  register(adapter: AIImageAdapter): void {
    this.adapters.set(adapter.modelId, adapter);
    logger.info(
      `[ImageGenRegistry] Registered adapter: ${adapter.modelId} (${adapter.displayName})`
    );
  }

  registerConstructor(modelId: ImageModelId | VideoModelId, Ctor: AdapterConstructor): void {
    this.privateCtors.set(modelId, Ctor);
  }

  get(modelId: ImageModelId | VideoModelId): AIImageAdapter | undefined {
    return this.adapters.get(modelId);
  }

  getOrCreate(modelId: ImageModelId | VideoModelId): AIImageAdapter | undefined {
    const existing = this.adapters.get(modelId);
    if (existing) return existing;

    const ctor = this.privateCtors.get(modelId);
    if (ctor) {
      const adapter = new ctor();
      this.adapters.set(modelId, adapter);
      return adapter;
    }
    return undefined;
  }

  listModels(): Array<{ modelId: ImageModelId | VideoModelId; displayName: string }> {
    return Array.from(this.adapters.values()).map((a) => ({
      modelId: a.modelId,
      displayName: a.displayName,
    }));
  }
}

export const imageGenRegistry = new ImageGenRegistry();

// ========== Unified Dispatcher ===========

const DEFAULT_MAX_RETRIES = 2;

interface RetryableOptions {
  maxRetries?: number;
}

export async function generateImage(
  prompt: string,
  options: Partial<ImageGenRequest & RetryableOptions> = {}
): Promise<ImageGenResponse> {
  const model = options.model ?? 'seedream-5.0';
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const adapter = imageGenRegistry.getOrCreate(model);

  if (!adapter) {
    throw new Error(`[ImageGen] No adapter registered for model: ${model}`);
  }

  const request: ImageGenRequest = { prompt, model, ...options };

  if (maxRetries <= 0) {
    return adapter.generateImage(request);
  }

  return retryRequest(() => adapter.generateImage(request), {
    maxRetries,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: isNetworkError,
    onRetry: (attempt, error) => {
      logger.warn(`[ImageGen][${model}] attempt ${attempt} failed: ${error}`);
    },
  });
}

export async function generateVideo(
  options: Partial<VideoGenRequest & RetryableOptions> = {}
): Promise<VideoGenResponse> {
  const model = options.model ?? 'seedance-2.0';
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const adapter = imageGenRegistry.getOrCreate(model);

  if (!adapter) {
    throw new Error(`[VideoGen] No adapter registered for model: ${model}`);
  }

  const generateVideo = adapter.generateVideo;
  if (!generateVideo) {
    throw new Error(`[VideoGen] Model ${model} does not support video generation`);
  }

  const request: VideoGenRequest = { model, ...options };

  if (maxRetries <= 0) {
    return generateVideo(request);
  }

  return retryRequest(() => generateVideo(request), {
    maxRetries,
    delay: 2000,
    backoff: 'exponential',
    retryCondition: isNetworkError,
    onRetry: (attempt, error) => {
      logger.warn(`[VideoGen][${model}] attempt ${attempt} failed: ${error}`);
    },
  });
}

export async function getVideoStatus(
  taskId: string,
  model: VideoModelId = 'seedance-2.0'
): Promise<VideoGenResponse> {
  const adapter = imageGenRegistry.getOrCreate(model);

  if (!adapter?.getVideoStatus) {
    throw new Error(`[VideoGen] Model ${model} does not support status polling`);
  }

  return adapter.getVideoStatus(taskId);
}

// ========== Backward Compatibility Aliases ==========

export const imageGenerationService = {
  generateImage,
  generateVideo,
  getVideoStatus,
  registry: imageGenRegistry,
};

export default imageGenerationService;
