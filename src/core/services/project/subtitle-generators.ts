/**
 * 字幕文件生成器
 *
 * 从 export-service.ts 抽离 generateSRT / generateASS。
 * 与 video/subtitle/* 下的同名生成器独立 —— 此处专门用于"从分镜数据导出"。
 */

import { formatTime } from '@/core/utils';

import type { StoryboardData } from './export-types';

/** 默认每条字幕时长（秒），与原行为一致 */
const DEFAULT_SUBTITLE_DURATION_SECONDS = 3;

/**
 * 把分镜转成 SRT 文本。
 * 行为与原 generateSRT 完全一致：
 * - 只导出有 dialogue 的场景
 * - 时间戳用 formatTime，hours=if-nonzero，ms=3，decimalMark=,
 * - 每段后留空行
 */
export function generateSRT(storyboard: StoryboardData): string {
  let index = 1;
  let currentTime = 0;
  const lines: string[] = [];

  for (const scene of storyboard.scenes) {
    if (scene.dialogue) {
      const startTime = formatTime(currentTime, { hours: 'if-nonzero', ms: 3, decimalMark: ',' });
      const duration = scene.duration || DEFAULT_SUBTITLE_DURATION_SECONDS;
      const endTime = formatTime(currentTime + duration, {
        hours: 'if-nonzero',
        ms: 3,
        decimalMark: ',',
      });

      lines.push(`${index}`);
      lines.push(`${startTime} --> ${endTime}`);
      lines.push(scene.dialogue);
      lines.push('');

      index += 1;
      currentTime += duration;
    }
  }

  return lines.join('\n');
}

/** ASS 文件头（与原 generateASS 逐字一致） */
const ASS_HEADER_TEMPLATE = (title: string): string => `[Script Info]
|Title: ${title}
|ScriptType: v4.00+
|PlayDepth: 0

[V4+ Styles]
|Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
|Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,30,1

[Events]
|Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

/**
 * 把分镜转成 ASS 文本。
 * 行为与原 generateASS 完全一致：
 * - 换行 → \\N（ASS 转义）
 * - 时间戳 hours=if-nonzero，ms=2，decimalMark=.
 * - 默认每段 3 秒
 */
export function generateASS(storyboard: StoryboardData): string {
  const header = ASS_HEADER_TEMPLATE(storyboard.title);

  let currentTime = 0;
  const lines: string[] = [header];

  for (const scene of storyboard.scenes) {
    if (scene.dialogue) {
      const startTime = formatTime(currentTime, { hours: 'if-nonzero', ms: 2, decimalMark: '.' });
      const duration = scene.duration || DEFAULT_SUBTITLE_DURATION_SECONDS;
      const endTime = formatTime(currentTime + duration, {
        hours: 'if-nonzero',
        ms: 2,
        decimalMark: '.',
      });

      const dialogueText = scene.dialogue.replace(/\n/g, '\\N');
      lines.push(`Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${dialogueText}`);

      currentTime += duration;
    }
  }

  return lines.join('\n');
}
