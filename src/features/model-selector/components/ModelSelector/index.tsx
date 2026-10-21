/**
 * 模型选择器组件 — 2026 最新版
 * 明确划分：文字模型 (text)、图片模型 (image)、视频模型 (video) 三大分类矩阵
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  CheckCircle,
  Loader,
  Zap,
  Star,
  DollarSign,
  Settings,
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
} from 'lucide-react';
import { useState, useMemo, useDeferredValue } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import type { ModelCategory, ModelProvider } from '@/common/types';
import { MODEL_PROVIDERS } from '@/core/config/models-config';
import { LLM_MODELS, type LLMModelConfig } from '@/core/constants';
import { useModel, useModelCost, useRecommendedModel } from '@/core/hooks/useModel';

import styles from './index.module.less';
import { TruncatedDescription } from './TruncatedDescription';

// 2026 三大核心分类选项
const CATEGORY_OPTIONS = [
  { label: '全部模型', value: 'all', icon: <Bot size={14} /> },
  { label: '📝 文字大模型', value: 'text', icon: <FileText size={14} /> },
  { label: '🎨 图片生图', value: 'image', icon: <ImageIcon size={14} /> },
  { label: '🎬 视频渲染', value: 'video', icon: <VideoIcon size={14} /> },
];

interface ModelSelectorProps {
  onSelect?: (modelId: string) => void;
  onConfigure?: (provider: ModelProvider) => void;
  compact?: boolean;
  showCost?: boolean;
  taskType?: 'script' | 'analysis' | 'code' | 'fast';
}

// 模型卡片数据接口
interface ModelCardData {
  id: string;
  name: string;
  provider: ModelProvider;
  category: string[];
  description: string;
  version: string;
  contextWindow: number;
  maxTokens: number;
  recommended: boolean;
  pricing?: { input: number; output: number; unit: string };
  features: string[];
}

export function ModelSelector({
  onSelect,
  onConfigure,
  compact = false,
  showCost = true,
  taskType,
}: ModelSelectorProps) {
  const {
    selectedModel,
    isConfigured,
    availableModels,
    selectModel,
    testConnection,
    isLoading,
    error,
  } = useModel();

  const { estimateScriptCost, formatCost } = useModelCost();
  const { recommended, currentRecommended, selectRecommended } = useRecommendedModel(
    taskType || 'script'
  );

  const [category, setCategory] = useState<ModelCategory | 'all'>('all');
  const [provider, setProvider] = useState<ModelProvider | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);
  const [testing, setTesting] = useState(false);

  // 转换 LLM_MODELS 为组件格式
  const allModels = useMemo(() => {
    const models = Object.values(LLM_MODELS) as LLMModelConfig[];
    return models.map(
      (m: LLMModelConfig): ModelCardData => ({
        id: m.modelId,
        name: m.name,
        provider: m.provider as ModelProvider,
        category: [m.category || 'text', ...(m.capabilities || [])],
        description: `${m.name} - ${m.version}`,
        version: m.version,
        contextWindow: m.contextWindow,
        maxTokens: m.maxTokens,
        recommended: m.recommended,
        pricing: m.pricing
          ? { input: m.pricing.input, output: m.pricing.output, unit: '元/千token' }
          : undefined,
        features: m.capabilities,
      })
    );
  }, []);

  // 过滤模型（使用 deferred query 保持搜索输入即时响应）
  const filteredModels = useMemo(() => {
    let models = allModels;

    if (category !== 'all') {
      models = models.filter((m) => m.category.includes(category));
    }

    if (provider !== 'all') {
      models = models.filter((m) => m.provider === provider);
    }

    if (deferredQuery) {
      const query = deferredQuery.toLowerCase();
      models = models.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.provider.toLowerCase().includes(query)
      );
    }

    return models as ModelCardData[];
  }, [allModels, category, provider, deferredQuery]);

  // 处理模型选择
  const handleSelect = (modelId: string) => {
    selectModel(modelId);
    onSelect?.(modelId);
  };

  // 测试连接
  const handleTest = async () => {
    setTesting(true);
    await testConnection();
    setTesting(false);
  };

  // 获取提供商图标
  const getProviderIcon = (providerId: ModelProvider) => {
    const config = MODEL_PROVIDERS[providerId];
    return config?.icon || '';
  };

  // 获取提供商名称
  const getProviderName = (providerId: ModelProvider) => {
    const config = MODEL_PROVIDERS[providerId];
    return config?.name || providerId;
  };

  // 渲染模型卡片
  const renderModelCard = (model: ModelCardData) => {
    const isSelected = selectedModel?.id === model.id;
    const isAvailable = availableModels.some((m) => m.id === model.id);
    const cost = model.pricing ? formatCost(estimateScriptCost(500)) : null;

    return (
      <motion.div
        key={model.id}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card
          className={`${styles.modelCard} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles.unavailable : ''}`}
          onClick={() => handleSelect(model.id)}
          hoverable={isAvailable}
        >
          <div className={styles.cardHeader}>
            <div className={styles.modelInfo}>
              <Avatar className={styles.providerAvatar}>
                <AvatarImage src={getProviderIcon(model.provider)} />
                <AvatarFallback>{model.provider[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className={styles.modelMeta}>
                <span className={styles.modelName}>
                  {model.name}
                  {isSelected && <CheckCircle size={14} className={styles.checkIcon} />}
                </span>
                <span className={styles.providerName} style={{ color: 'var(--muted-foreground)' }}>
                  {getProviderName(model.provider)}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {model.recommended && (
                <Tooltip title="2026 推荐模型">
                  <Star size={16} className={styles.proIcon} />
                </Tooltip>
              )}
              {!isAvailable && <Badge variant="secondary">未配置</Badge>}
            </div>
          </div>

          {!compact && (
            <>
              <TruncatedDescription className={styles.description}>
                {model.description}
              </TruncatedDescription>

              <div className={styles.features}>
                {model.features.slice(0, 3).map((feature, idx) => (
                  <Badge key={idx} variant="secondary" className={styles.featureTag}>
                    {feature}
                  </Badge>
                ))}
              </div>

              <Separator className={styles.divider} />

              <div className={styles.cardFooter}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Tooltip title={`上下文: ${(model.contextWindow / 1000).toFixed(0)}K tokens`}>
                    <Badge variant="outline">
                      <Bot size={12} style={{ marginRight: 4 }} />
                      {(model.contextWindow / 1000).toFixed(0)}K
                    </Badge>
                  </Tooltip>
                  {showCost && cost && (
                    <Tooltip title="预估成本（500字脚本）">
                      <Badge variant="outline" style={{ color: '#52c41a', borderColor: '#b7eb8f' }}>
                        <DollarSign size={12} style={{ marginRight: 4 }} />
                        {cost}
                      </Badge>
                    </Tooltip>
                  )}
                </div>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    );
  };

  return (
    <div className={styles.container}>
      {/* 头部 */}
      <div className={styles.header}>
        <h4 className={styles.title} style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          <Bot size={20} style={{ marginRight: 8 }} /> AI 模型选择与配置
        </h4>
        {selectedModel && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
              当前激活: <strong className="text-[#00f5d4]">{selectedModel.name}</strong>
            </span>
            {isConfigured ? (
              <Badge variant="success">已配置 API</Badge>
            ) : (
              <Badge variant="warning">未配置 API</Badge>
            )}
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive" className={styles.alert}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 任务推荐 */}
      {taskType && (
        <div className={styles.recommendations}>
          <span
            className={styles.sectionTitle}
            style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}
          >
            <Star size={14} /> 2026 最佳推荐
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recommended.map((model, idx) => (
              <Button
                key={model.id}
                variant={currentRecommended?.id === model.id ? 'default' : 'outline'}
                size="small"
                onClick={() => selectRecommended(idx)}
              >
                {idx === 0 && <Star size={12} />}
                {model.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 过滤器 */}
      <div className={styles.filters}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            placeholder="搜索 2026 最新模型..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
            className={styles.searchInput}
            icon={<Search size={16} />}
          />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* 三大分类 Tab */}
            <div style={{ display: 'flex', gap: 4 }}>
              {CATEGORY_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={category === opt.value ? 'default' : 'ghost'}
                  size="small"
                  onClick={() => setCategory(opt.value as ModelCategory)}
                  className="gap-1 text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            {/* 提供商 Selector */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginLeft: 'auto' }}>
              <Button
                variant={provider === 'all' ? 'default' : 'ghost'}
                size="small"
                onClick={() => setProvider('all')}
                className="text-xs"
              >
                全部厂商
              </Button>
              {Object.entries(MODEL_PROVIDERS)
                .slice(0, 6)
                .map(([key, config]) => (
                  <Button
                    key={key}
                    variant={provider === key ? 'default' : 'ghost'}
                    size="small"
                    onClick={() => setProvider(key as ModelProvider)}
                    className="text-xs"
                  >
                    {config.name}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 模型列表 */}
      <div style={{ position: 'relative', minHeight: 200 }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(5, 12, 26, 0.85)',
              zIndex: 10,
            }}
          >
            <Loader className="animate-spin text-[#00f5d4]" size={24} />
            <span style={{ marginLeft: 8, color: '#00f5d4' }}>加载模型集中...</span>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {filteredModels.length > 0 ? (
            <div className={compact ? styles.compactGrid : styles.modelGrid}>
              {filteredModels.map(renderModelCard)}
            </div>
          ) : (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              没有找到匹配的 2026 模型
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部操作 */}
      {selectedModel && !compact && (
        <div className={styles.footer}>
          <Separator />
          <div style={{ display: 'flex', gap: 8, paddingTop: 16 }}>
            {!isConfigured ? (
              <Button
                variant="default"
                icon={<Settings size={16} />}
                onClick={() => onConfigure?.(selectedModel.provider)}
              >
                配置 {getProviderName(selectedModel.provider)} API
              </Button>
            ) : (
              <Button
                variant="outline"
                icon={testing ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
                onClick={handleTest}
              >
                测试连通性
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelSelector;
