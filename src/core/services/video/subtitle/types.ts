/**
 * 字幕相关类型与默认样式
 *
 * 把 SubtitleService 类的类型字段、常量集中到独立文件，
 * 多个子模块（exporters / parsers / generators）共享，避免循环依赖。
 */

import type { ScriptSegment } from '@/core/types';
import type { SubtitleFormat } from '@/core/video/types/composition';

/** @deprecated Use @/core/video/types/composition */
export type { SubtitleFormat };

/** 字幕样式 */
export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  outline: number;
  outlineColor: string;
  shadow: number;
  alignment: 'left' | 'center' | 'right' | 'top' | 'bottom';
  margin: number;
  position: 'top' | 'middle' | 'bottom';
}

/** 单条字幕 */
export interface SubtitleItem {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  text: string;
  style?: Partial<SubtitleStyle>;
}

/** 字幕轨道 */
export interface SubtitleTrack {
  id: string;
  name: string;
  language: string;
  items: SubtitleItem[];
  style: SubtitleStyle;
  format: SubtitleFormat;
}

/** AI 生成时使用的时间帧结构（与 SubtitleItem 不同：start/end 而不是 startTime/endTime） */
export interface SubtitleTimeframe {
  start: number;
  end: number;
  text: string;
}

/** 脚本分段输入（与 ScriptSegment 一致，仅复述便于该模块独立） */
export type ScriptSegmentInput = ScriptSegment;

/** 默认字幕样式 */
export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontFamily: 'Microsoft YaHei, SimHei, Arial',
  fontSize: 24,
  fontColor: '#FFFFFF',
  backgroundColor: '#000000',
  outline: 2,
  outlineColor: '#000000',
  shadow: 0,
  alignment: 'center',
  margin: 10,
  position: 'bottom',
};

/**
 * ASS 样式预设（与原实现完全一致，便于回归）。
 */
export const ASS_STYLE_PRESETS: Record<string, Partial<SubtitleStyle>> = {
  default: {},
  karaoke: {
    fontSize: 28,
    fontColor: '#FFFF00',
    outline: 1,
  },
  cinema: {
    fontSize: 32,
    fontColor: '#FFFFFF',
    backgroundColor: '#80000000',
    outline: 3,
  },
  minimal: {
    fontSize: 20,
    fontColor: '#FFFFFF',
    outline: 0,
    shadow: 2,
  },
};
