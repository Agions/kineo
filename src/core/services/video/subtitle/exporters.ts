/**
 * 字幕格式导出器
 *
 * 把 4 种字幕格式的序列化拆为独立函数，按需调用。
 * 所有函数都是纯函数（无 IO、无状态）。
 */

import { formatTime } from '@/core/utils';

import type { SubtitleStyle, SubtitleTrack } from './types';

/**
 * 把 #RRGGBB 转换为 ASS 的 &HBBGGRR。
 */
export function toAssColor(color: string): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `&H${b.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}`;
}

/** ASS alignment 映射表 */
const ASS_ALIGNMENT_MAP: Record<string, number> = {
  left: 1,
  center: 2,
  right: 3,
  top: 8,
  bottom: 4,
};

export function toAssAlignment(alignment: string): number {
  return ASS_ALIGNMENT_MAP[alignment] ?? 2;
}

/** VTT 行级位置字符串 */
export function buildVTTPosition(position: string, margin: number): string {
  const posMap: Record<string, string> = {
    top: ` line:${margin}%`,
    middle: ' line:50%',
    bottom: ` line:-${margin}%`,
  };
  return posMap[position] ?? '';
}

/**
 * 导出为 SRT 文本。
 */
export function exportSRT(track: SubtitleTrack): string {
  return track.items
    .map((item) => {
      const start = formatTime(item.startTime, { hours: 'always', ms: 3, decimalMark: ',' });
      const end = formatTime(item.endTime, { hours: 'always', ms: 3, decimalMark: ',' });
      return `${item.index}\n${start} --> ${end}\n${item.text}\n`;
    })
    .join('\n');
}

/**
 * 导出为 WebVTT 文本。
 */
export function exportVTT(track: SubtitleTrack): string {
  const header = 'WEBVTT\n\n';
  const content = track.items
    .map((item) => {
      const position = buildVTTPosition(track.style.position, track.style.margin);
      const start = formatTime(item.startTime, { hours: 'always', ms: 3, decimalMark: '.' });
      const end = formatTime(item.endTime, { hours: 'always', ms: 3, decimalMark: '.' });
      return `${start} --> ${end}${position}\n${item.text}\n`;
    })
    .join('\n');
  return header + content;
}

/**
 * 导出为 ASS 脚本（Advanced SubStation Alpha）。
 */
export function exportASS(track: SubtitleTrack): string {
  const style: SubtitleStyle = track.style;
  const header = `[Script Info]
|Title: ${track.name}
|ScriptType: v4.00+
|Collisions: Normal
|PlayDepth: 0

[V4+ Styles]
|Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
|Style: Default,${style.fontFamily},${style.fontSize},${toAssColor(style.fontColor)},&H00FFFFFF,${toAssColor(style.outlineColor)},${toAssColor(style.backgroundColor)},0,0,0,0,100,100,0,0,1,${style.outline},${style.shadow},${toAssAlignment(style.alignment)},10,10,${style.margin},1

[Events]
|Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = track.items
    .map((item) => {
      const start = formatTime(item.startTime, { hours: 'if-nonzero', ms: 2, decimalMark: '.' });
      const end = formatTime(item.endTime, { hours: 'if-nonzero', ms: 2, decimalMark: '.' });
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${item.text}`;
    })
    .join('\n');

  return header + events;
}

/**
 * 导出为纯文本（仅字幕文字，每行一条）。
 */
export function exportTXT(track: SubtitleTrack): string {
  return track.items.map((item) => item.text).join('\n');
}

/**
 * 统一入口：根据 track.format 决定输出格式。
 * 默认 fallback 到 SRT。
 */
export function exportSubtitles(track: SubtitleTrack, format?: SubtitleTrack['format']): string {
  const target = format ?? track.format;
  switch (target) {
    case 'srt':
      return exportSRT(track);
    case 'vtt':
      return exportVTT(track);
    case 'ass':
      return exportASS(track);
    case 'txt':
      return exportTXT(track);
    default:
      return exportSRT(track);
  }
}
