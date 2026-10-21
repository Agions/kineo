/**
 * Video Editing Step — 类型定义
 * ==============================
 * 所有与视频剪辑合成相关的类型、接口、配置常量。
 */

import type { SubtitleRenderStyle } from '@/core/video/types/composition';

// ========== 核心类型 ==========

export interface VideoClip {
  id: string;
  path: string;
  type: 'image' | 'video';
  startTime: number; // 在最终视频中的起始时间
  duration: number; // 持续时长（秒）
  sourceStart?: number; // 对于视频片段：源素材的起始点
  sourceEnd?: number; // 对于视频片段：源素材的结束点
}

export interface Transition {
  type: 'fade' | 'dissolve' | 'slide_left' | 'slide_right' | 'zoom' | 'blur';
  duration: number; // 秒
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

/**
 * 视频编辑 Step 的字幕样式 — alias 到 SubtitleRenderStyle 并扩展 bold 字段
 * 单一来源：原 inline SubtitleStyle 已删除，类型从 shared/types 统一引用
 */
export type SubtitleStyle = SubtitleRenderStyle & { bold?: boolean };

/** Step 内部字幕块，style 字段使用 SubtitleStyle（含 bold 扩展） */
export interface SubtitleBlock {
  startTime: number;
  endTime: number;
  text: string;
  style?: SubtitleStyle;
}

export interface AudioTrack {
  type: 'dialogue' | 'bgm' | 'sfx';
  path: string;
  startTime: number;
  duration: number;
  volume: number; // 0.0 - 1.0
  fadeIn?: number; // 秒
  fadeOut?: number; // 秒
}

export interface VideoEditingOutput {
  finalVideoUrl: string;
  duration: number;
  resolution: { width: number; height: number };
  format: 'mp4';
  fileSize?: number;
  subtitleUrl?: string;
  audioMixUrl?: string;
}

export interface VideoEditingConfig {
  resolution?: { width: number; height: number };
  fps?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  outputFormat?: 'mp4';
  enableHardwareAccel?: boolean;
}

// ========== 步骤工厂 Props ==========
