/**
 * SRT 字幕文件生成
 *
 * 把 SRT 拼装从 ffmpeg-wasm-service.ts 抽出，独立可测，
 * 不依赖 FFmpeg 实例。
 */

import { formatTime } from '@/core/utils';

import type { Subtitle } from './types';

/**
 * 将字幕数组渲染成 SRT 文本。
 * 时间格式：HH:MM:SS,mmm（小时仅在非零时显示，符合 SRT 习惯）
 */
export function generateSRTFile(subtitles: Subtitle[]): string {
  const lines: string[] = [];

  subtitles.forEach((subtitle, index) => {
    lines.push(String(index + 1));
    lines.push(
      `${formatTime(subtitle.startTime, { hours: 'if-nonzero', ms: 3, decimalMark: ',' })} --> ${formatTime(subtitle.endTime, { hours: 'if-nonzero', ms: 3, decimalMark: ',' })}`
    );
    lines.push(subtitle.text);
    lines.push('');
  });

  return lines.join('\n');
}
