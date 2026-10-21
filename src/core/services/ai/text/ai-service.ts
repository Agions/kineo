/**
 * AI 服务（Facade）
 *
 * 重构思路：原 509 行单类混合了 mock 生成 / 缓存 / provider 分发 /
 * 流式适配 / 批量 / 高层业务 API / 模型查询 7 类职责。现拆为 5 个子模块，
 * 主类只做编排：
 * - ai-mock-data        generateMockScenes / generateMockKeyframes
 *                       parseScriptSegments / estimateDuration
 * - ai-cache            buildAICacheKey + withAIResponseCache
 * - ai-call-dispatcher  buildRequestConfig + dispatchAIRequest
 * - ai-stream           chunkText + yieldChunked + streamGenerateWithFallback
 * - ai-batch            batchGenerate（复用 core/utils/concurrency）
 *
 * 公开 API 完全兼容（generate/generateScript/analyzeVideo/optimizeScript/
 * translateScript/streamGenerate/batchGenerate + 6 个 getter + mock 控制），
 * 19 个调用方无需修改。
 */

import type { Script } from '@/core/types';
import { mockStrategy } from '@/core/ai/providers';
import { getModelById } from '@/core/config/models-config';
import { LLM_MODELS, DEFAULT_LLM_MODEL, MODEL_RECOMMENDATIONS } from '@/core/constants';
import { logger } from '@/core/utils/logger';

import { batchGenerate } from './ai-batch';
import { buildAICacheKey, withAIResponseCache } from './ai-cache';
import { buildRequestConfig, dispatchAIRequest } from './ai-call-dispatcher';
import {
  estimateDuration,
  generateMockKeyframes,
  generateMockScenes,
  parseScriptSegments,
} from './ai-mock-data';
import type {
  AIResponse,
  AIModel,
  AIModelSettings,
  VideoAnalysis,
  MockConfig,
} from './ai-service-types';
import { streamGenerateWithFallback } from './ai-stream';
import { promptBuilderService } from './prompt-builder-service';

// Re-export shared types from centralized types file
export type {
  AIResponse,
  AIRequestConfig,
  StreamCallbacks,
  MockConfig,
  AIModel,
  AIModelSettings,
  VideoAnalysis,
  ScriptSegment,
  VideoScene,
  Keyframe,
} from './ai-service-types';

class AIService {
  // 启用/禁用 Mock 模式
  private useMock = false;

  // ─────────── Mock 控制（薄壳，转发到 mockStrategy） ───────────

  setMockConfig(requestId: string, config: MockConfig): void {
    mockStrategy.setMockConfig(requestId, config);
  }

  clearMockConfig(requestId: string): void {
    mockStrategy.clearMockConfig(requestId);
  }

  setMockMode(enabled: boolean): void {
    this.useMock = enabled;
  }

  isMockMode(): boolean {
    return this.useMock;
  }

  // ─────────── 通用生成 ───────────

  async generate(
    prompt: string,
    options: {
      model: string;
      provider: string;
      signal?: AbortSignal;
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<string> {
    const model = this.getModelById(options.model);
    if (!model) {
      if (this.useMock) {
        const mockResponse = await mockStrategy.call('', {
          model: options.model,
          messages: [
            { role: 'system', content: '你是一个专业的视频内容创作助手。' },
            { role: 'user', content: prompt },
          ],
          temperature: options.temperature,
          max_tokens: options.max_tokens,
        });
        return mockResponse.content;
      }
      throw new Error(`Model ${options.model} not found`);
    }

    const settings = this.buildDefaultSettings(model, options);

    try {
      const response = await this.callAPI(model, settings, prompt);
      return response.content;
    } catch (error) {
      logger.error('AI generate failed:', error);
      throw new Error(`AI生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 构造 AIModelSettings 默认值（callAPI 前的初始化 settings）。
   * 内部 helper — 消除 generate() 与 streamGenerate() 重复的 settings 构造代码。
   */
  private buildDefaultSettings(
    model: AIModel,
    options: { temperature?: number; max_tokens?: number }
  ): AIModelSettings {
    return {
      enabled: true,
      apiKey: '',
      baseURL: '',
      model: model.id,
      temperature: options.temperature,
      maxTokens: options.max_tokens,
    } as AIModelSettings;
  }

  // ─────────── 业务高层 API ───────────

  async generateScript(
    model: AIModel,
    settings: AIModelSettings,
    params: {
      topic: string;
      style: string;
      tone: string;
      length: string;
      audience: string;
      language: string;
      keywords?: string[];
      requirements?: string;
      videoDuration?: number;
    }
  ): Promise<Script> {
    const prompt = promptBuilderService.buildScriptPrompt(params);

    try {
      const response = await this.callAPI(model, settings, prompt);
      const content = response.content;

      return {
        id: `script_${Date.now()}`,
        title: params.topic,
        content,
        segments: parseScriptSegments(content),
        metadata: {
          style: params.style,
          tone: params.tone,
          length: params.length as 'short' | 'medium' | 'long',
          targetAudience: params.audience,
          language: params.language,
          wordCount: content.length,
          estimatedDuration: estimateDuration(content.length),
          generatedBy: model.id,
          generatedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('脚本生成失败:', error);
      throw error;
    }
  }

  async analyzeVideo(
    model: AIModel,
    settings: AIModelSettings,
    videoInfo: {
      duration: number;
      width: number;
      height: number;
      format: string;
    }
  ): Promise<Partial<VideoAnalysis>> {
    const prompt = promptBuilderService.buildAnalysisPrompt(videoInfo);

    try {
      const response = await this.callAPI(model, settings, prompt);

      return {
        summary: response.content,
        scenes: generateMockScenes(videoInfo.duration),
        keyframes: generateMockKeyframes(videoInfo.duration),
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('视频分析失败:', error);
      throw error;
    }
  }

  async optimizeScript(
    model: AIModel,
    settings: AIModelSettings,
    script: string,
    optimization: 'shorten' | 'lengthen' | 'simplify' | 'professional'
  ): Promise<string> {
    const prompt = promptBuilderService.buildOptimizationPrompt(script, optimization);

    try {
      const response = await this.callAPI(model, settings, prompt);
      return response.content;
    } catch (error) {
      logger.error('脚本优化失败:', error);
      throw error;
    }
  }

  async translateScript(
    model: AIModel,
    settings: AIModelSettings,
    script: string,
    targetLanguage: string
  ): Promise<string> {
    const prompt = `请将以下脚本翻译成${targetLanguage}，保持原有的语气和风格：

${script}

请直接返回翻译后的内容，不要添加解释。`;

    try {
      const response = await this.callAPI(model, settings, prompt);
      return response.content;
    } catch (error) {
      logger.error('翻译失败:', error);
      throw error;
    }
  }

  // ─────────── 模型查询 ───────────

  getRecommendedModels(
    task: keyof typeof MODEL_RECOMMENDATIONS
  ): (typeof LLM_MODELS)[keyof typeof LLM_MODELS][] {
    return [...(MODEL_RECOMMENDATIONS[task] || [DEFAULT_LLM_MODEL])];
  }

  getModelInfo(modelId: string): (typeof LLM_MODELS)[keyof typeof LLM_MODELS] | null {
    return Object.values(LLM_MODELS).find((m) => m.modelId === modelId) ?? null;
  }

  getAllModels(): (typeof LLM_MODELS)[keyof typeof LLM_MODELS][] {
    return Object.values(LLM_MODELS);
  }

  getDomesticModels(): (typeof LLM_MODELS)[keyof typeof LLM_MODELS][] {
    return Object.values(LLM_MODELS).filter((m) =>
      ['baidu', 'alibaba', 'moonshot', 'zhipu', 'minimax'].includes(m.provider)
    );
  }

  // ─────────── 流式 + 批量 ───────────

  async *streamGenerate(
    prompt: string,
    options: {
      model: string;
      provider: string;
      signal?: AbortSignal;
      temperature?: number;
      max_tokens?: number;
    }
  ): AsyncGenerator<string> {
    const model = this.getModelById(options.model);
    if (!model) {
      throw new Error(`Model ${options.model} not found`);
    }

    const settings = this.buildDefaultSettings(model, options);

    yield* streamGenerateWithFallback(model, settings, prompt, () =>
      this.generate(prompt, options)
    );
  }

  async batchGenerate(
    prompts: string[],
    options: {
      model: string;
      provider: string;
      temperature?: number;
      max_tokens?: number;
      concurrency?: number;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<string[]> {
    return batchGenerate(prompts, options, (prompt, opts) => this.generate(prompt, opts));
  }

  // ─────────── 内部 ───────────

  private getModelById(modelId: string): AIModel | undefined {
    return getModelById(modelId);
  }

  /**
   * 调用 AI API：mock 短路 → 否则构建 config → 走缓存 → 分发到 provider。
   * 业务行为与原实现逐字一致（缓存仅在 temperature=0 时启用）。
   */
  private async callAPI(
    model: AIModel,
    settings: AIModelSettings,
    prompt: string,
    requestId?: string
  ): Promise<AIResponse> {
    if (this.useMock) {
      return mockStrategy.call(
        '',
        {
          model: settings.model ?? model.id,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的视频内容创作助手，擅长生成高质量的解说脚本。',
            },
            { role: 'user', content: prompt },
          ],
          temperature: settings.temperature ?? 0.7,
          max_tokens: settings.maxTokens ?? 2000,
        },
        requestId
      );
    }

    const config = buildRequestConfig(model, settings, prompt);
    const cacheKey = buildAICacheKey(model.provider, model.id, prompt, settings.temperature);

    return withAIResponseCache(cacheKey, () =>
      dispatchAIRequest(model, settings, config, requestId)
    );
  }
}

// 导出单例（与原版一致）
export const aiService = new AIService();
