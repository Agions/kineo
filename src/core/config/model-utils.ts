/**
 * 模型查询工具函数
 */
import type { AIModel, ModelProvider, ModelCategory } from '@/core/types';

import { AI_MODELS } from './model-catalog';

export const MODEL_RECOMMENDATIONS: Record<string, string[]> = {
  // 脚本生成 - 国产推荐
  script: ['glm-5', 'minimax-m2.5', 'qwen-2.5', 'kimi-k2.5', 'ernie-5.0', 'doubao-2.0'],
  // 视频分析
  analysis: ['qwen-2.5', 'doubao-2.0', 'gemini-2.0-pro', 'kimi-k2.5'],
  // 代码生成
  code: ['qwen-2.5', 'glm-5', 'claude-4-sonnet', 'gpt-4.5'],
  // 快速响应
  fast: ['doubao-2.0', 'qwen-2.5', 'gemini-2.0-flash', 'gpt-4.5'],
  // 长上下文
  longContext: ['kimi-k2.5', 'minimax-m2.5', 'glm-5', 'gemini-2.0-pro'],
  // 成本敏感
  costEffective: ['doubao-2.0', 'glm-5', 'qwen-2.5', 'ernie-5.0'],
  // 高质量
  highQuality: ['gpt-4.5', 'claude-4-opus', 'kimi-k2.5', 'qwen-2.5'],
  // 图像生成
  imageGeneration: ['seedream-5.0', 'kling-3.0', 'kling-1.6', 'vidu-2.0'],
  // 视频生成
  videoGeneration: ['kling-3.0', 'seedance-2.0', 'kling-1.6', 'vidu-2.0'],
  // 国内首选
  domestic: ['glm-5', 'minimax-m2.5', 'qwen-2.5', 'kimi-k2.5', 'ernie-5.0', 'doubao-2.0'],
};

// 获取模型配置
export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS.find((model) => model.id === id);
};

// 获取提供商模型
export const getModelsByProvider = (provider: ModelProvider): AIModel[] => {
  return AI_MODELS.filter((model) => model.provider === provider);
};

// 获取分类模型
export const getModelsByCategory = (category: ModelCategory): AIModel[] => {
  return AI_MODELS.filter((model) => model.category.includes(category));
};

// 获取推荐模型
export const getRecommendedModels = (task: keyof typeof MODEL_RECOMMENDATIONS): AIModel[] => {
  const modelIds = MODEL_RECOMMENDATIONS[task] || [];
  return modelIds.map((id) => getModelById(id)).filter(Boolean) as AIModel[];
};
