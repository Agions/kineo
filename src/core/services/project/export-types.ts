/**
 * Export 模块类型定义
 *
 * 把 export-service.ts 中的 enum/interface 集中到此文件，
 * 多个子模块共享，避免循环依赖。
 */

/** 支持的导出格式 */
export enum ProjectExportFormat {
  PDF = 'pdf',
  ZIP = 'zip',
  MP4 = 'mp4',
  GIF = 'gif',
  ASS = 'ass',
}

/** 导出质量档位 */
export enum ExportQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ORIGINAL = 'original',
}

/** 导出选项 */
export interface ProjectExportOptions {
  format: ProjectExportFormat;
  quality: ExportQuality;
  includeVoice: boolean;
  includeSubtitles: boolean;
  includeBGM: boolean;
  fileName?: string;
}

/** 进度上报 */
export interface ExportProgress {
  current: number;
  total: number;
  stage: string;
  message: string;
}

/** 进度回调签名 */
export type ProgressCallback = (progress: ExportProgress) => void;

/** 单个场景的最小数据（用于导出） */
export interface SceneData {
  id: string;
  imageUrl: string;
  description?: string;
  dialogue?: string;
  duration?: number;
}

/** 导出所需的分镜数据 */
export interface StoryboardData {
  title: string;
  scenes: SceneData[];
  totalDuration: number;
}

import { RESOLUTION_1080P } from '@/core/constants/media-presets';

/** 质量 → 缩放比例映射 */
export const QUALITY_SCALE: Record<ExportQuality, number> = {
  [ExportQuality.LOW]: 0.5,
  [ExportQuality.MEDIUM]: 0.75,
  [ExportQuality.HIGH]: 1.0,
  [ExportQuality.ORIGINAL]: 1.0,
};

/** MP4 导出默认参数 */
export const MP4_DEFAULT_FPS = 30;
export const MP4_DEFAULT_RESOLUTION = RESOLUTION_1080P;

/** GIF 导出默认参数（分辨率/帧率较低） */
export const GIF_DEFAULT_FPS = 15;
export const GIF_DEFAULT_RESOLUTION = { width: 480, height: 270 };

/** MP4 单场景默认时长（秒） */
export const MP4_DEFAULT_SCENE_DURATION = 3;
/** GIF 单场景默认时长（秒） */
export const GIF_DEFAULT_SCENE_DURATION = 1;
