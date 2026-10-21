/**
 * AI 字幕生成 + 翻译
 *
 * 把 "调用 aiService 生成字幕/翻译字幕" 这块 IO 相关逻辑从
 * SubtitleService 类剥离成独立模块，便于测试与未来替换 AI provider。
 */

import { v4 as uuidv4 } from 'uuid';

import { formatTime } from '@/core/utils';
import { aiService } from '@/core/services/ai/text/ai-service';
import { logger } from '@/core/utils/logger';

import { generateFromText } from './generators';
import type { SubtitleItem, SubtitleStyle, SubtitleTimeframe, SubtitleTrack } from './types';
import { DEFAULT_SUBTITLE_STYLE } from './types';

/** 默认每个字幕片段时长（秒） */
const DEFAULT_AVG_DURATION_SECONDS = 4;

/** 解析 AI 返回的字幕行（格式：start-end|text） */
export function parseAIGeneratedSubtitles(
  text: string,
  totalDuration: number
): SubtitleTimeframe[] {
  const timeframes: SubtitleTimeframe[] = [];
  const lines = text.split('\n');
  let cursor = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const pipeMatch = line.match(/(\d+)-(\d+)\|(.+)/);
    if (pipeMatch) {
      timeframes.push({
        start: parseInt(pipeMatch[1], 10),
        end: parseInt(pipeMatch[2], 10),
        text: pipeMatch[3],
      });
    } else {
      // 未带时间戳则按平均时长均分
      const end = Math.min(cursor + DEFAULT_AVG_DURATION_SECONDS, totalDuration);
      timeframes.push({ start: cursor, end, text: line });
      cursor = end;
    }
  }

  return timeframes;
}

/**
 * 使用 AI 从视频描述生成字幕轨道。
 * 失败时返回空字幕轨道（与原行为一致）。
 */
export async function generateFromVideo(
  videoText: string,
  duration: number,
  style: Partial<SubtitleStyle> = {}
): Promise<SubtitleTrack> {
  try {
    const prompt = `请为以下视频内容生成分段字幕。

视频总时长：${formatTime(duration)}

视频内容描述：
${videoText}

请生成字幕分段，每个片段约 3-5 秒。

返回格式要求：
- 每行一个字幕片段
- 格式：时间点|字幕文本
- 时间点使用秒数，如：0-5|这是第一条字幕

确保字幕：
1. 每行长度适中（约 20-30 字）
2. 语义完整
3. 适当断句`;

    const result = await aiService.generate(prompt, {
      model: 'gpt-3.5-turbo',
      provider: 'openai',
    });

    const timeframes = parseAIGeneratedSubtitles(result, duration);
    return generateFromText('', timeframes, style);
  } catch (error) {
    logger.error('AI 字幕生成失败:', error);
    return {
      id: uuidv4(),
      name: '字幕轨道',
      language: 'zh-CN',
      items: [],
      style: { ...DEFAULT_SUBTITLE_STYLE, ...style },
      format: 'srt',
    };
  }
}

/**
 * 把现有字幕轨道翻译成目标语言。
 * 单条失败时保留原文，不中断整体流程。
 */
export async function translateSubtitles(
  track: SubtitleTrack,
  targetLanguage: string
): Promise<SubtitleTrack> {
  const translatedItems: SubtitleItem[] = [];

  for (const item of track.items) {
    try {
      const prompt = `请翻译以下字幕到 ${targetLanguage}：

${item.text}

请直接返回翻译后的文本，不要添加任何解释。`;

      const translated = await aiService.generate(prompt, {
        model: 'gpt-3.5-turbo',
        provider: 'openai',
      });

      translatedItems.push({
        ...item,
        id: uuidv4(),
        text: translated.trim(),
      });
    } catch (error) {
      logger.error(`翻译字幕 ${item.index} 失败:`, error);
      translatedItems.push(item);
    }
  }

  return {
    ...track,
    id: uuidv4(),
    name: `${track.name} (${targetLanguage})`,
    language: targetLanguage,
    items: translatedItems,
  };
}
