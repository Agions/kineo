/**
 * 小说分析器配置
 *
 * 从 novel-analyze-service.ts 提取的默认配置工厂 + 完整配置类型。
 * 单一职责：把 AnalyzeConfig 各种 undefined 兜底为默认值。
 */

import type { AnalyzeConfig } from '@/core/types';

/** 完整（无 optional）配置类型 */
export type ResolvedAnalyzeConfig = Required<AnalyzeConfig>;

/**
 * 把 optional 字段全部兜底为默认值，返回完整配置。
 * 原代码类构造器内的 Object spread 完全相同的逻辑。
 */
export function resolveAnalyzeConfig(config: AnalyzeConfig = {}): ResolvedAnalyzeConfig {
  return {
    maxChapters: config.maxChapters ?? 50,
    minChapterLength: config.minChapterLength ?? 100,
    sceneMinLength: config.sceneMinLength ?? 200,
    detectCharacters: config.detectCharacters ?? true,
    detectEmotions: config.detectEmotions ?? true,
    generatePrompts: config.generatePrompts ?? true,
    provider: config.provider ?? 'alibaba',
    model: config.model ?? 'qwen-3.5',
  };
}
