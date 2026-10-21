/**
 * AI Provider Strategy — Strategy 模式接口
 * 所有 AI Provider 实现必须实现此接口
 */

import type { AIRequestConfig, AIResponse } from '@/core/ai/types/ai-core';

export interface AIProviderStrategy {
  /**
   * 提供商名称
   */
  readonly name: string;

  /**
   * 调用 AI API
   */
  call(apiKey: string, config: AIRequestConfig, requestId?: string): Promise<AIResponse>;

  /**
   * 是否支持流式
   */
  supportsStreaming?: boolean;

  /**
   * 流式调用（可选）
   */
  stream?(apiKey: string, config: AIRequestConfig): AsyncGenerator<string>;
}

/**
 * 基础 Provider Strategy 抽象类
 * 提供公共工具方法
 */
export abstract class BaseAIProviderStrategy implements AIProviderStrategy {
  abstract readonly name: string;

  abstract call(apiKey: string, config: AIRequestConfig, requestId?: string): Promise<AIResponse>;

  supportsStreaming = false;

  /**
   * 通用错误处理
   */
  protected handleError(provider: string, status: number): Error {
    return new Error(`${provider} API 错误: ${status}`);
  }

  /**
   * 通用响应解析（OpenAI 格式）
   */
  protected parseOpenAIResponse(data: unknown): AIResponse {
    const d = data as {
      choices?: { message?: { content?: string } }[];
      usage?: AIResponse['usage'];
      model?: string;
    };
    return {
      content: d.choices?.[0]?.message?.content ?? '',
      usage: d.usage,
      model: d.model ?? 'unknown',
    };
  }
}
