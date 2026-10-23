/**
 * 图像生成类型定义
 */

export type ImageModel = 'seedream-5.0' | 'kling-1.6' | 'kling-3.0' | 'vidu-2.0';

export type ImageSize = '1K' | '2K' | '4K' | `${number}x${number}`;

export interface ImageGenerationOptions {
  /** 图像模型 */
  model?: ImageModel;
  /** 图像尺寸 */
  size?: ImageSize;
  /** 生成数量 */
  numImages?: number;
  /** 负面提示词 */
  negativePrompt?: string;
  /** 风格 */
  style?: 'anime' | 'realistic' | 'cartoon' | '3d';
  /** 图像质量 */
  quality?: 'standard' | 'high' | 'premium';
  /** 角色一致性参考图 */
  characterReferences?: CharacterVideoRef[];
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  /** 最大重试次数（仅对统一入口有效） */
  maxRetries?: number;
}

export interface ImageGenerationResult {
  /** 图片 URL */
  url: string;
  /** 图片 base64 */
  base64?: string;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 生成的模型 */
  model: string;
  /** 耗时 (ms) */
  processingTime?: number;
}

/**
 * 角色视频参考（用于生成时绑定角色一致性）
 */
export interface CharacterVideoRef {
  /** 角色 ID */
  characterId: string;
  /** 角色名 */
  name: string;
  /** 角色特征描述 token */
  referencePrompt: string;
  /** 三视图参考图 URL */
  referenceImageUrls?: {
    front?: string;
    side?: string;
    fullBody?: string;
  };
}

export interface VideoGenerationOptions {
  /** 视频模型 */
  model?: 'seedance-2.0' | 'kling-1.6' | 'kling-3.0' | 'vidu-2.0';
  /** 视频时长 (秒) */
  duration?: number;
  /** 帧率 */
  fps?: number;
  /** 参考图片（首帧/关键帧） */
  referenceImage?: string;
  /** 角色一致性参考（多个角色的三视图 reference） */
  characterReferences?: CharacterVideoRef[];
  /** 提示词 */
  prompt?: string;
  /** 负面提示词 */
  negativePrompt?: string;
  /** 画面比例 */
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  /** 最大重试次数（仅对统一入口有效） */
  maxRetries?: number;
}

export interface VideoGenerationResult {
  /** 视频 URL */
  url: string;
  /** 封面图 URL */
  coverUrl?: string;
  /** 视频时长 (秒) */
  duration: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 生成的模型 */
  model: string;
  /** 任务 ID */
  taskId?: string;
  /** 状态 */
  status: 'processing' | 'completed' | 'failed';
}
