/**
 * AI 模型管理 Hook
 * 统一的模型选择、配置和管理
 */

import { useState, useCallback, useMemo } from 'react';

import type { AIModel, ModelProvider, ModelCategory, AIModelSettings } from '@/core/types';
import { delay } from '@/core/utils/timing';
import { hasAnyConfiguredModelProvider } from '@/core/config/model-providers';
import {
  AI_MODELS,
  MODEL_PROVIDERS,
  getModelById,
  getModelsByProvider,
  getRecommendedModels,
} from '@/core/config/models-config';
import { secureStorage } from '@/core/services/project/secure-storage-service';

export interface UseModelReturn {
  // 模型列表
  allModels: AIModel[];
  availableModels: AIModel[];
  modelsByProvider: Record<ModelProvider, AIModel[]>;
  recommendedModels: Record<string, AIModel[]>;

  // 当前选择
  selectedModel: AIModel | undefined;
  selectedProvider: ModelProvider | undefined;

  // 模型配置
  isConfigured: boolean;

  // 操作方法
  selectModel: (modelId: string) => void;
  updateSettings: (settings: Partial<AIModelSettings>) => void;
  configureAPI: (provider: ModelProvider, apiKey: string, apiSecret?: string) => Promise<boolean>;
  testConnection: () => Promise<boolean>;

  // 过滤
  filterByCategory: (category: ModelCategory) => AIModel[];
  filterByProvider: (provider: ModelProvider) => AIModel[];

  // 状态
  isLoading: boolean;
  error: string | null;
}

export function useModel(): UseModelReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>('glm-5');

  // 获取当前选中的模型详情
  const selectedModel = useMemo(() => {
    return getModelById(selectedModelId);
  }, [selectedModelId]);

  // 获取当前选中的提供商
  const selectedProvider = selectedModel?.provider;

  // 检查是否已配置有效 API Key
  const isConfigured = useMemo(() => {
    return hasAnyConfiguredModelProvider();
  }, []);

  // 按提供商分组的模型
  const modelsByProvider = useMemo(() => {
    const providers: ModelProvider[] = [
      'openai',
      'anthropic',
      'google',
      'baidu',
      'alibaba',
      'zhipu',
      'iflytek',
      'tencent',
    ];
    return Object.fromEntries(providers.map((p) => [p, getModelsByProvider(p)])) as Record<
      ModelProvider,
      AIModel[]
    >;
  }, []);

  // 获取可用模型
  const availableModels = useMemo(() => {
    return AI_MODELS;
  }, []);

  // 推荐模型
  const recommendedModels = useMemo(
    () => ({
      script: getRecommendedModels('script'),
      analysis: getRecommendedModels('analysis'),
      code: getRecommendedModels('code'),
      fast: getRecommendedModels('fast'),
    }),
    []
  );

  // 选择模型
  const selectModel = useCallback((modelId: string) => {
    const model = getModelById(modelId);
    if (model) {
      setSelectedModelId(modelId);
      setError(null);
    }
  }, []);

  // 更新设置
  const updateSettings = useCallback(
    async (settings: Partial<AIModelSettings>) => {
      // 保存到安全存储（优先使用 Tauri Store，降级到 localStorage）
      if (selectedModel) {
        const key = `ai_model_settings_${selectedModel.provider}`;
        const current = await secureStorage.getSecureConfig(key);
        const updated = current ? { ...JSON.parse(current), ...settings } : settings;
        await secureStorage.saveSecureConfig(key, JSON.stringify(updated));
      }
    },
    [selectedModel]
  );

  // 配置 API
  const configureAPI = useCallback(
    async (provider: ModelProvider, apiKey: string, apiSecret?: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        // 验证 API Key 格式
        const providerConfig = MODEL_PROVIDERS[provider];
        if (!providerConfig) {
          throw new Error('未知的提供商');
        }

        // 保存到安全存储（优先使用 Tauri Store，降级到 localStorage）
        await secureStorage.saveSecureConfig(`api_${provider}_key`, apiKey);
        if (apiSecret) {
          await secureStorage.saveSecureConfig(`api_${provider}_secret`, apiSecret);
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : '配置失败');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 测试连接
  const testConnection = useCallback(async (): Promise<boolean> => {
    if (!selectedModel || !isConfigured) {
      setError('模型未配置');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 这里添加实际的 API 测试逻辑

      // 模拟测试
      await delay(1000);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接测试失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel, isConfigured]);

  // 按分类过滤
  const filterByCategory = useCallback((category: ModelCategory): AIModel[] => {
    return AI_MODELS.filter((model) => model.category.includes(category));
  }, []);

  // 按提供商过滤
  const filterByProvider = useCallback((provider: ModelProvider): AIModel[] => {
    return getModelsByProvider(provider);
  }, []);

  return {
    allModels: AI_MODELS,
    availableModels,
    modelsByProvider,
    recommendedModels,
    selectedModel,
    selectedProvider,
    isConfigured,
    selectModel,
    updateSettings,
    configureAPI,
    testConnection,
    filterByCategory,
    filterByProvider,
    isLoading,
    error,
  };
}

// 使用特定任务推荐的模型
export function useRecommendedModel(task: 'script' | 'analysis' | 'code' | 'fast') {
  const { recommendedModels, selectModel, selectedModel } = useModel();

  const recommended = recommendedModels[task];
  const currentRecommended = recommended.find((m) => m.id === selectedModel?.id);

  const selectRecommended = useCallback(
    (index: number = 0) => {
      if (recommended[index]) {
        selectModel(recommended[index].id);
      }
    },
    [recommended, selectModel]
  );

  return {
    recommended,
    currentRecommended,
    selectRecommended,
  };
}

// 使用模型成本估算
export function useModelCost() {
  const { selectedModel } = useModel();

  const estimateCost = useCallback(
    (inputTokens: number, outputTokens: number): number => {
      if (!selectedModel?.pricing) return 0;

      const { input, output } = selectedModel.pricing;
      return (inputTokens / 1000) * input + (outputTokens / 1000) * output;
    },
    [selectedModel]
  );

  const estimateScriptCost = useCallback(
    (wordCount: number): number => {
      // 估算：输入约 500 tokens，输出约 wordCount * 1.5 tokens
      return estimateCost(500, wordCount * 1.5);
    },
    [estimateCost]
  );

  const formatCost = useCallback((cost: number): string => {
    if (cost < 0.001) return '¥0.001';
    return `¥${cost.toFixed(3)}`;
  }, []);

  return {
    estimateCost,
    estimateScriptCost,
    formatCost,
    pricing: selectedModel?.pricing,
  };
}
