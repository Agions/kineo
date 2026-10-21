/**
 * OpenAI 兼容协议策略基类
 * ========================
 * OpenAI / Alibaba / Zhipu 三家 API 均为 OpenAI chat/completions 格式，
 * 仅 endpoint URL 和 provider 名称不同。提取共享的 fetch + 错误处理 + 响应解析。
 */

import type { AIRequestConfig, AIResponse } from '@/core/ai/types/ai-core';

import { BaseAIProviderStrategy } from './base';

export interface OpenAICompatibleConfig {
  readonly name: string;
  readonly endpoint: string;
  readonly providerLabel: string;
}

export abstract class OpenAICompatibleStrategy extends BaseAIProviderStrategy {
  protected abstract readonly apiConfig: OpenAICompatibleConfig;

  async call(apiKey: string, config: AIRequestConfig): Promise<AIResponse> {
    const response = await fetch(this.apiConfig.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw this.handleError(this.apiConfig.providerLabel, response.status);
    }

    const data = await response.json();
    return this.parseOpenAIResponse(data);
  }
}
