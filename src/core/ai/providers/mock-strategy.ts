/**
 * Mock Provider Strategy (用于测试/开发)
 */

import type { AIRequestConfig, AIResponse } from '@/core/ai/types/ai-core';
import { delay } from '@/core/utils/timing';

import { BaseAIProviderStrategy } from './base';

export class MockStrategy extends BaseAIProviderStrategy {
  readonly name = 'mock';
  private mockConfigs: Map<
    string,
    { delay?: number; shouldFail?: boolean; errorMessage?: string; content?: string }
  > = new Map();

  setMockConfig(
    requestId: string,
    config: { delay?: number; shouldFail?: boolean; errorMessage?: string; content?: string }
  ): void {
    this.mockConfigs.set(requestId, config);
  }

  clearMockConfig(requestId: string): void {
    this.mockConfigs.delete(requestId);
  }

  async call(apiKey: string, config: AIRequestConfig, requestId?: string): Promise<AIResponse> {
    // 忽略 apiKey 参数
    void apiKey;

    let mockConfig: {
      delay?: number;
      shouldFail?: boolean;
      errorMessage?: string;
      content?: string;
    } = {};
    if (requestId && this.mockConfigs.has(requestId)) {
      mockConfig = this.mockConfigs.get(requestId)!;
    } else if (this.mockConfigs.has('default')) {
      mockConfig = this.mockConfigs.get('default')!;
    }

    const mockDelayMs = mockConfig.delay ?? 1500 + Math.random() * 1000;
    await delay(mockDelayMs);

    if (mockConfig.shouldFail) {
      throw new Error(mockConfig.errorMessage ?? 'Mock API 错误');
    }

    const content = mockConfig.content ?? this.generateMockContent(config);

    return {
      content,
      usage: {
        prompt_tokens: Math.floor(content.length / 4),
        completion_tokens: Math.floor(content.length / 4),
        total_tokens: Math.floor(content.length / 2),
      },
      model: config.model,
    };
  }

  private generateMockContent(config: AIRequestConfig): string {
    const userMessage = config.messages.find((m) => m.role === 'user')?.content ?? '';

    if (userMessage.includes('脚本') || userMessage.includes('主题')) {
      const match = userMessage.match(/主题[：:](.+?)(?:\n|$)/);
      const theme = match ? match[1] : '通用主题';
      return `【${theme}】视频脚本\n\n【开场】\n大家好！欢迎来到今天的视频！\n\n【主体内容】\n第一点：核心要点解析\n第二点：深度分析\n第三点：实用建议\n\n【总结】\n感谢观看！`;
    }

    if (userMessage.includes('分析') || userMessage.includes('视频')) {
      return '【视频分析报告】\n内容丰富、结构清晰。';
    }

    return '这是一个模拟生成的回复。';
  }
}

export const mockStrategy = new MockStrategy();
