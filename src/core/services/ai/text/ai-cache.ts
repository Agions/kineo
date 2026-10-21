/**
 * AI 调用缓存
 *
 * 把 "只有 temperature=0 时才走缓存" 的逻辑从 AIService.callAPI 抽出。
 * 缓存键构造 + 读/写都在这里，调用方只关心"我要不要缓存"。
 */

import { requestCache } from '@/core/utils/request';

import type { AIResponse } from './ai-service-types';

/** 缓存 TTL（毫秒），与原实现一致 */
const AI_CACHE_TTL_MS = 10 * 60 * 1000;

/** 缓存键前缀 */
const CACHE_KEY_PREFIX = 'ai';

/**
 * 构造 AI 调用缓存键。
 * 仅当 temperature === 0 时返回键（确定性输出），否则返回 null。
 * 键格式：`ai:<provider>:<modelId>:<prompt前100字符>`
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function buildAICacheKey(
  provider: string,
  modelId: string,
  prompt: string,
  temperature?: number
): string | null {
  if (temperature !== 0) {
    return null;
  }
  return `${CACHE_KEY_PREFIX}:${provider}:${modelId}:${simpleHash(prompt)}`;
}

/**
 * 命中则返回缓存；未命中则执行 fetcher 并写入缓存。
 * 行为与原 callAPI 的缓存分支完全一致。
 */
async function withAICache<T>(cacheKey: string | null, fetcher: () => Promise<T>): Promise<T> {
  if (!cacheKey) {
    return fetcher();
  }
  const cached = requestCache.get<T>(cacheKey);
  if (cached !== undefined && cached !== null) {
    return cached;
  }
  const result = await fetcher();
  requestCache.set(cacheKey, result, AI_CACHE_TTL_MS);
  return result;
}

/** AIResponse 类型的便捷包装（避免外部重复写泛型） */
export async function withAIResponseCache(
  cacheKey: string | null,
  fetcher: () => Promise<AIResponse>
): Promise<AIResponse> {
  return withAICache(cacheKey, fetcher);
}
