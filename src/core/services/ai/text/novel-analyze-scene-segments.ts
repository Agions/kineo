/**
 * 场景分割
 *
 * 从 novel-analyze-service.ts 提取的 segmentScenes 异步方法 +
 * 其内部 processChapter 闭包 + 类私有 ruleBasedSegmentation 私有方法。
 *
 * 关键修复（重复消除）：
 *   原代码段：
 *     - 类内部定义了 private ruleBasedSegmentation（与 novel-helpers 公开
 *       函数完全一致）
 *     - 类内部又定义了 private extractCharacterNames（与 novel-helpers
 *       公开函数完全一致）
 *     - segmentScenes 在 AI 解析失败时调 this.ruleBasedSegmentation，
 *       但 fall back 走的是类内私有版本，没用 helpers
 *   本轮修复：所有 rule-based 路径统一走 novel-helpers 公开函数，
 *   类不再持有重复实现。
 *
 * 单一职责：把 Chapter[] 并发切为 NovelScene[]（AI 优先 + 规则兜底）。
 */

import type { Chapter, NovelScene } from '@/core/types';
import { aiService } from '@/core/services/ai/text/ai-service';
import { ruleBasedSegmentation } from '@/core/services/ai/text/novel-helpers';
import { concurrentLimit } from '@/core/utils/concurrency';
import { logger } from '@/core/utils/logger';

import type { ResolvedAnalyzeConfig } from './novel-analyze-config';

const SCENE_SEGMENT_CONTENT_PREVIEW_CHARS = 3000;
const MAX_CHAPTER_CONCURRENCY = 3;

/**
 * 单章节场景分割 prompt 模板
 */
function buildSceneSplitPrompt(chapter: Chapter): string {
  return `
请将以下小说章节分割为场景。每个场景应该有完整的情节发展。

章节内容：
${chapter.content.slice(0, SCENE_SEGMENT_CONTENT_PREVIEW_CHARS)}${chapter.content.length > SCENE_SEGMENT_CONTENT_PREVIEW_CHARS ? '...' : ''}

请以 JSON 数组格式返回，每个场景包含：
{
  "sceneNumber": 场景序号,
  "title": "场景标题（可选）",
  "content": "场景内容",
  "location": "地点",
  "time": "时间",
  "characters": ["出场角色"]
}

注意：
1. 场景要有明确的时间地点转换
2. 每个场景至少 200 字
3. 返回 JSON 数组格式
`;
}

/**
 * 把 AI 返回的原始 scene 数据 + chapterId 拼成 NovelScene 对象。
 */
function buildSceneFromAiResponse(
  sceneData: Record<string, unknown>,
  chapter: Chapter,
  index: number
): NovelScene {
  return {
    id: `scene_${chapter.id}_${index}`,
    chapterId: chapter.id,
    sceneNumber: (sceneData.sceneNumber as number) || index + 1,
    title: sceneData.title as string | undefined,
    content: (sceneData.content as string) ?? '',
    location: sceneData.location as string | undefined,
    time: sceneData.time as string | undefined,
    startPosition: 0,
    endPosition: ((sceneData.content as string) ?? '').length,
    characters: (sceneData.characters as string[]) ?? [],
    dialogues: [],
    emotions: [],
    tags: [],
  };
}

/**
 * 单章节场景分割：AI 优先 + 规则兜底。
 * 失败 fallback 直接走 novel-helpers.ruleBasedSegmentation 公开函数。
 */
async function splitChapterIntoScenes(
  chapter: Chapter,
  config: ResolvedAnalyzeConfig
): Promise<NovelScene[]> {
  const prompt = buildSceneSplitPrompt(chapter);

  try {
    const response = await aiService.generate(prompt, {
      provider: config.provider,
      model: config.model,
    });

    const aiScenes = JSON.parse(response) as Array<Record<string, unknown>>;
    return aiScenes.map((sceneData, i) => buildSceneFromAiResponse(sceneData, chapter, i));
  } catch {
    // AI 解析失败 → 走 novel-helpers 的规则分割（消除与原类私有实现的重复）
    return ruleBasedSegmentation(chapter, config.sceneMinLength);
  }
}

/**
 * 把多个章节并发切分为场景（每章 ≤3 并发）。
 */
export async function segmentScenes(
  chapters: Chapter[],
  config: ResolvedAnalyzeConfig
): Promise<NovelScene[]> {
  const { results: allScenesArrays, errors } = await concurrentLimit(
    chapters,
    MAX_CHAPTER_CONCURRENCY,
    (chapter) => splitChapterIntoScenes(chapter, config)
  );

  if (errors.length > 0) {
    logger.warn(`[NovelAnalyzer] ${errors.length} 个章节处理失败，将使用规则分割`);
  }

  return allScenesArrays.flat();
}
