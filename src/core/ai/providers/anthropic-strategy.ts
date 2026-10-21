/**
 * Anthropic Provider Strategy
 */

import type { AIRequestConfig, AIResponse } from '@/core/ai/types/ai-core';

import { BaseAIProviderStrategy } from './base';

class AnthropicStrategy extends BaseAIProviderStrategy {
  readonly name = 'anthropic';

  async call(apiKey: string, config: AIRequestConfig): Promise<AIResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        messages: config.messages,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      throw this.handleError('Anthropic', response.status);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      usage: data.usage,
      model: data.model,
    };
  }
}

export const anthropicStrategy = new AnthropicStrategy();
