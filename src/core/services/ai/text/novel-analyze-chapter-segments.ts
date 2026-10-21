/**
 * 章节分割
 *
 * 从 novel-analyze-service.ts 提取的 segmentChapters 私有方法。
 *
 * 流程：
 *   1. 用 CHAPTER_PATTERNS 正则匹配章节标题
 *   2. 第一个匹配上的 pattern 用来切分；超过 maxChapters 上限截断
 *   3. 切出的章节按 minChapterLength 过滤（短于阈值丢弃）
 *   4. 若 0 章节匹配：按段落 + estimatedChapterCount 均分
 *   5. 给每章补 characters / locations / timePeriod
 *
 * 单一职责：把原始文本切成 Chapter[]。
 */

import type { Chapter } from '@/core/types';
import {
  extractCharacterNames,
  extractLocations,
  extractTimePeriod,
  CHAPTER_PATTERNS,
} from '@/core/services/ai/text/novel-helpers';

import type { ResolvedAnalyzeConfig } from './novel-analyze-config';

/**
 * 把单条 match 转换成 Chapter 对象。
 */
function buildChapterFromMatch(
  match: RegExpMatchArray,
  index: number,
  novelId: string,
  currentPosition: number,
  content: string,
  minChapterLength: number
): { chapter: Chapter | null; newPosition: number } {
  const start = match.index;
  if (start === undefined || start <= currentPosition) {
    return { chapter: null, newPosition: currentPosition };
  }

  const chapterContent = content.slice(currentPosition, start).trim();
  if (chapterContent.length < minChapterLength) {
    return { chapter: null, newPosition: currentPosition };
  }

  const title = (match[1] ?? match[0]).trim();
  return {
    chapter: {
      id: `chapter_${novelId}_${index}`,
      novelId,
      title: title || `第${index + 1}章`,
      content: chapterContent,
      order: index,
      wordCount: chapterContent.length,
    },
    newPosition: start + match[0].length,
  };
}

/**
 * 按 paragraph 数量 + estimatedChapterCount 均分兜底。
 */
function fallbackParagraphSegmentation(
  content: string,
  novelId: string,
  estimatedChapterCount: number,
  minChapterLength: number
): Chapter[] {
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 50);
  const chapterSize = Math.ceil(paragraphs.length / estimatedChapterCount);
  const chapters: Chapter[] = [];

  for (let i = 0; i < paragraphs.length; i += chapterSize) {
    const chunk = paragraphs.slice(i, i + chapterSize).join('\n\n');
    if (chunk.length >= minChapterLength) {
      chapters.push({
        id: `chapter_${novelId}_${chapters.length}`,
        novelId,
        title: `第${chapters.length + 1}章`,
        content: chunk,
        order: chapters.length,
        wordCount: chunk.length,
      });
    }
  }

  return chapters;
}

/**
 * 给章节补 characters / locations / timePeriod
 * （每个 Chapter 字段可能在原 JSON schema 是 optional——这里集中 mutate）
 */
function enrichChaptersWithMetadata(chapters: Chapter[]): void {
  for (const chapter of chapters) {
    chapter.characters = extractCharacterNames(chapter.content);
    chapter.locations = extractLocations(chapter.content);
    chapter.timePeriod = extractTimePeriod(chapter.content);
  }
}

/**
 * 把小说内容切分为章节。
 * 第一个匹配上的章节 pattern 优先；无匹配时按段落均分兜底。
 */
export function segmentChapters(
  content: string,
  novelId: string,
  estimatedChapterCount: number,
  config: ResolvedAnalyzeConfig
): Chapter[] {
  const chapters: Chapter[] = [];
  let currentPosition = 0;

  // 1) pattern 匹配
  for (const pattern of CHAPTER_PATTERNS) {
    const matches = [...content.matchAll(pattern)];
    if (matches.length > 0) {
      for (let i = 0; i < matches.length && i < config.maxChapters; i++) {
        const { chapter, newPosition } = buildChapterFromMatch(
          matches[i],
          i,
          novelId,
          currentPosition,
          content,
          config.minChapterLength
        );
        if (chapter) chapters.push(chapter);
        if (newPosition > currentPosition) {
          currentPosition = newPosition;
        }
      }
      break;
    }
  }

  // 2) 段落均分兜底
  if (chapters.length === 0) {
    const fallback = fallbackParagraphSegmentation(
      content,
      novelId,
      estimatedChapterCount,
      config.minChapterLength
    );
    chapters.push(...fallback);
  }

  // 3) 给每章补 metadata
  enrichChaptersWithMetadata(chapters);

  return chapters;
}
