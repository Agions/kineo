/**
 * 小说元数据提取
 *
 * 从 novel-analyze-service.ts 提取的 extractMetadata 私有方法。
 * 行为：构造 prompt → 调 AI → JSON.parse → 字段兜底 → 返回 NovelMetadata。
 * 失败 fallback：返回"未命名小说"基础 metadata（无 author/genre/tags/language）。
 *
 * 单一职责：元数据（标题/作者/题材/概要/字数/章节数/标签/语言）。
 *
 * 重复模式识别（与 chapter-segments / scene-segments 对比）：
 *   三个都是"prompt 模板 + aiService.generate + JSON.parse + 失败容错"
 *   ——这里把"字段兜底 + 失败 fallback"抽到本模块内部；不同点仅
 *   在"成功时返回什么、失败时返回什么"。
 */

import type { NovelMetadata } from '@/core/types';
import { aiService } from '@/core/services/ai/text/ai-service';
import { logger } from '@/core/utils/logger';

import type { ResolvedAnalyzeConfig } from './novel-analyze-config';

const METADATA_CONTENT_PREVIEW_CHARS = 2000;

/** 元数据提取 prompt 模板 */
function buildMetadataPrompt(content: string): string {
  return `
请分析以下小说内容，提取元数据信息。

小说内容（前${METADATA_CONTENT_PREVIEW_CHARS}字）：
${content.slice(0, METADATA_CONTENT_PREVIEW_CHARS)}

请以 JSON 格式返回以下信息：
{
  "title": "小说标题",
  "author": "作者（可选）",
  "genre": "题材类型",
  "summary": "故事概要（100字以内）",
  "wordCount": 总字数,
  "chapterCount": 预估章节数,
  "tags": ["标签1", "标签2"],
  "language": "语言"
}

注意：wordCount 是全文总字数，不是摘要字数。
`;
}

/**
 * AI 解析失败时的兜底 metadata。
 * 缺 author/genre/summary/tags/language——只保留 id/title/wordCount/chapterCount/createdAt。
 */
function buildFallbackMetadata(novelId: string, content: string): NovelMetadata {
  return {
    id: novelId,
    title: '未命名小说',
    wordCount: content.length,
    chapterCount: 1,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 提取小说元数据
 */
export async function extractNovelMetadata(
  content: string,
  novelId: string,
  config: ResolvedAnalyzeConfig
): Promise<NovelMetadata> {
  const prompt = buildMetadataPrompt(content);

  try {
    const response = await aiService.generate(prompt, {
      provider: config.provider,
      model: config.model,
    });

    const data = JSON.parse(response);

    // Validate required fields
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid AI response format');
    }

    return {
      id: novelId,
      title: (data as Partial<NovelMetadata>).title ?? '未命名小说',
      author: data.author,
      genre: data.genre,
      summary: data.summary,
      wordCount: data.wordCount ?? content.length,
      chapterCount: data.chapterCount ?? 1,
      tags: data.tags ?? [],
      language: data.language ?? 'zh',
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.warn('[NovelAnalyzer] 元数据 AI 解析失败，使用默认值', error);
    return buildFallbackMetadata(novelId, content);
  }
}
