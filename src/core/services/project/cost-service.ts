/**
 * 成本追踪服务（统一实现）
 *
 * 原拆分为 types / constants / record-builders / budget / stats / report / service
 * 现合并为单文件，外部仅 import { costService } from './cost-service'。
 */

import { secureStorage } from '@/core/services/project/secure-storage-service';
import { logger } from '@/core/utils/logger';

// ========== 类型定义 ==========
export type CostRecordType = 'llm' | 'video' | 'audio' | 'storage';

export interface CostRecord {
  id: string;
  type: CostRecordType;
  provider: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cost: number;
  duration?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CostStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
  byModel: Record<string, number>;
}

export interface BudgetStatus {
  daily: { used: number; limit: number; percent: number };
  weekly: { used: number; limit: number; percent: number };
  monthly: { used: number; limit: number; percent: number };
}

export interface CostAlert {
  id: string;
  period: 'daily' | 'weekly' | 'monthly';
  percent: number;
  threshold: number;
  timestamp: string;
}

export interface CostBudget {
  daily: number;
  weekly: number;
  monthly: number;
  alerts: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

// ========== 定价常量 ==========
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  'gpt-5': { input: 0.005, output: 0.015 },
  'gpt-5-mini': { input: 0.0005, output: 0.0015 },
  'claude-4-sonnet': { input: 0.003, output: 0.015 },
  'claude-4-opus': { input: 0.015, output: 0.075 },
  'ernie-5.0': { input: 0.0012, output: 0.0012 },
  'ernie-speed': { input: 0.0001, output: 0.0001 },
  'qwen-max': { input: 0.002, output: 0.006 },
  'qwen-plus': { input: 0.0008, output: 0.002 },
  'qwen-turbo': { input: 0.0003, output: 0.0006 },
  'kimi-k2.5': { input: 0.001, output: 0.003 },
  'glm-5': { input: 0.001, output: 0.003 },
  'minimax-m2.5': { input: 0.001, output: 0.003 },
};

export const VIDEO_COSTS: Record<string, number> = {
  vidu: 0.5,
  seedance: 0.4,
  kling: 0.3,
  local: 0,
};

// ========== 记录构造器 ==========
function generateCostRecordId(type: CostRecordType): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substr(2, 5);
  return `${type}_${timestamp}_${randomSuffix}`;
}

export function buildLLMCostRecord(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  metadata?: Record<string, unknown>
): CostRecord {
  const pricing = MODEL_COSTS[model] ?? { input: 0.001, output: 0.003 };
  return {
    id: generateCostRecordId('llm'),
    type: 'llm',
    provider,
    model,
    inputTokens,
    outputTokens,
    cost: (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

export function buildVideoCostRecord(
  provider: string,
  durationSeconds: number,
  resolution: string,
  metadata?: Record<string, unknown>
): CostRecord {
  const costPerMinute = VIDEO_COSTS[provider] ?? 0.5;
  return {
    id: generateCostRecordId('video'),
    type: 'video',
    provider,
    cost: (durationSeconds / 60) * costPerMinute,
    duration: durationSeconds * 1000,
    timestamp: new Date().toISOString(),
    metadata: { ...metadata, resolution },
  };
}

export function buildAudioCostRecord(
  provider: string,
  durationSeconds: number,
  metadata?: Record<string, unknown>
): CostRecord {
  return {
    id: generateCostRecordId('audio'),
    type: 'audio',
    provider,
    cost: (durationSeconds / 60) * 0.06,
    duration: durationSeconds * 1000,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

export function buildStorageCostRecord(
  provider: string,
  sizeMB: number,
  metadata?: Record<string, unknown>
): CostRecord {
  return {
    id: generateCostRecordId('storage'),
    type: 'storage',
    provider,
    cost: (sizeMB / 1024) * 0.02,
    timestamp: new Date().toISOString(),
    metadata: { ...metadata, sizeMB },
  };
}

// ========== 统计 ==========
export function calculateCostStats(records: CostRecord[]): CostStats {
  return records.reduce(
    (acc, r) => {
      acc.total += r.cost;
      const now = Date.now();
      const day = 86400000;
      const week = 7 * day;
      const month = 30 * day;

      const ts = new Date(r.timestamp).getTime();
      if (now - ts < day) acc.today += r.cost;
      if (now - ts < week) acc.thisWeek += r.cost;
      if (now - ts < month) acc.thisMonth += r.cost;

      acc.byType[r.type] = (acc.byType[r.type] ?? 0) + r.cost;
      acc.byProvider[r.provider] = (acc.byProvider[r.provider] ?? 0) + r.cost;
      if (r.model) acc.byModel[r.model] = (acc.byModel[r.model] ?? 0) + r.cost;

      return acc;
    },
    {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byType: {},
      byProvider: {},
      byModel: {},
    } as CostStats
  );
}

export function calculateProjectStats(records: CostRecord[], projectId: string): CostStats {
  return calculateCostStats(records.filter((r) => r.metadata?.projectId === projectId));
}

export function filterRecordsByProject(records: CostRecord[], projectId?: string): CostRecord[] {
  if (!projectId) return records;
  return records.filter((r) => r.metadata?.projectId === projectId);
}

// ========== 预算与告警 ==========
export function buildBudgetStatus(stats: CostStats, budget: CostBudget): BudgetStatus {
  const periods = ['daily', 'weekly', 'monthly'] as const;
  const limits = [budget.daily, budget.weekly, budget.monthly];
  const totals = [stats.today, stats.thisWeek, stats.thisMonth];

  return periods.reduce(
    (acc, period, i) => ({
      ...acc,
      [period]: {
        used: totals[i],
        limit: limits[i],
        percent: limits[i] > 0 ? (totals[i] / limits[i]) * 100 : 0,
      },
    }),
    {} as BudgetStatus
  );
}

export function evaluateBudgetAlerts(
  records: CostRecord[],
  budget: CostBudget,
  cooldown: Record<'daily' | 'weekly' | 'monthly', number>,
  now: number
): CostAlert[] {
  const stats = calculateCostStats(records);
  const status = buildBudgetStatus(stats, budget);
  const alerts: CostAlert[] = [];

  for (const period of ['daily', 'weekly', 'monthly'] as const) {
    if (status[period].percent >= budget.alerts[period]) {
      if (now - cooldown[period] > 5 * 60000) {
        alerts.push({
          id: `${period}_${Date.now()}`,
          period,
          percent: status[period].percent,
          threshold: budget.alerts[period],
          timestamp: new Date(now).toISOString(),
        });
        cooldown[period] = now;
      }
    }
  }

  return alerts;
}

// ========== 报告与优化建议 ==========
const HIGH_COST_MODELS = ['gpt-5', 'claude-4-opus', 'qwen-max'];
const LLM_RATIO_ALERT_THRESHOLD = 0.6;
const VIDEO_RATIO_ALERT_THRESHOLD = 0.3;
const MODEL_RATIO_ALERT_THRESHOLD = 0.3;

type TaskComplexity = 'simple' | 'standard' | 'complex' | 'creative';
type BudgetConstraint = 'low' | 'medium' | 'high';

interface ModelOption {
  model: string;
  provider: string;
  cost: number;
}

const MODEL_SUGGESTIONS: Record<TaskComplexity, ModelOption[]> = {
  simple: [
    { model: 'qwen-turbo', provider: 'alibaba', cost: 0.0003 },
    { model: 'ernie-speed', provider: 'baidu', cost: 0.0001 },
    { model: 'kimi-k2.5', provider: 'moonshot', cost: 0.001 },
  ],
  standard: [
    { model: 'qwen-plus', provider: 'alibaba', cost: 0.0008 },
    { model: 'kimi-k2.5', provider: 'moonshot', cost: 0.001 },
    { model: 'glm-5', provider: 'zhipu', cost: 0.001 },
  ],
  complex: [
    { model: 'qwen-max', provider: 'alibaba', cost: 0.002 },
    { model: 'gpt-5', provider: 'openai', cost: 0.005 },
    { model: 'claude-4-sonnet', provider: 'anthropic', cost: 0.003 },
  ],
  creative: [
    { model: 'kimi-k2.5', provider: 'moonshot', cost: 0.001 },
    { model: 'claude-4-sonnet', provider: 'anthropic', cost: 0.003 },
    { model: 'gpt-5', provider: 'openai', cost: 0.005 },
  ],
};

export function getModelSuggestion(
  taskComplexity: TaskComplexity,
  budgetConstraint?: BudgetConstraint
): { model: string; provider: string; estimatedCost: number } {
  const options = MODEL_SUGGESTIONS[taskComplexity] ?? MODEL_SUGGESTIONS.standard;

  if (budgetConstraint === 'low') {
    const cheapest = options.reduce((min, curr) => (curr.cost < min.cost ? curr : min));
    return { ...cheapest, estimatedCost: cheapest.cost };
  }

  if (budgetConstraint === 'high') {
    const best = options[options.length - 1];
    return { ...best, estimatedCost: best.cost };
  }

  const balanced = options[Math.floor(options.length / 2)];
  return { ...balanced, estimatedCost: balanced.cost };
}

export function generateOptimizationSuggestions(stats: CostStats): string[] {
  const suggestions: string[] = [];
  const llmCost = stats.byType['llm'] ?? 0;
  const videoCost = stats.byType['video'] ?? 0;
  const totalCost = stats.total;

  if (totalCost === 0) return ['暂无成本数据，开始使用后会生成优化建议'];

  if (llmCost / totalCost > LLM_RATIO_ALERT_THRESHOLD) {
    suggestions.push(
      '💡 LLM 成本占比超过 60%，建议：\n' +
        '  - 启用响应缓存\n' +
        '  - 使用模型分级策略（简单任务用 Turbo 模型）\n' +
        '  - 压缩提示词长度'
    );
  }

  if (videoCost / totalCost > VIDEO_RATIO_ALERT_THRESHOLD) {
    suggestions.push(
      '💡 视频生成成本较高，建议：\n' +
        '  - 使用智能参数选择\n' +
        '  - 优先使用本地生成\n' +
        '  - 降低分辨率和帧率'
    );
  }

  for (const model of HIGH_COST_MODELS) {
    const modelCost = stats.byModel[model];
    if (modelCost && modelCost > totalCost * MODEL_RATIO_ALERT_THRESHOLD) {
      suggestions.push(`💡 ${model} 使用成本较高，建议评估是否可以降级到 Plus 或 Turbo 模型`);
    }
  }

  return suggestions.length > 0 ? suggestions : ['✅ 成本结构良好，暂无优化建议'];
}

export function renderCostReport(
  stats: CostStats,
  budget: CostBudget,
  suggestions: string[]
): string {
  return `
# Kineo AI 成本报告

生成时间: ${new Date().toLocaleString('zh-CN')}

## 成本概览

| 周期 | 成本 (USD) | 占比 |
|------|-----------|------|
| 今日 | $${stats.today.toFixed(2)} | ${((stats.today / budget.daily) * 100).toFixed(1)}% |
| 本周 | $${stats.thisWeek.toFixed(2)} | ${((stats.thisWeek / budget.weekly) * 100).toFixed(1)}% |
| 本月 | $${stats.thisMonth.toFixed(2)} | ${((stats.thisMonth / budget.monthly) * 100).toFixed(1)}% |
| 总计 | $${stats.total.toFixed(2)} | - |

## 成本分布

### 按类型
${Object.entries(stats.byType)
  .map(([type, cost]) => `- ${type}: $${cost.toFixed(2)}`)
  .join('\n')}

### 按提供商
${Object.entries(stats.byProvider)
  .map(([provider, cost]) => `- ${provider}: $${cost.toFixed(2)}`)
  .join('\n')}

### 按模型
${Object.entries(stats.byModel)
  .map(([model, cost]) => `- ${model}: $${cost.toFixed(2)}`)
  .join('\n')}

## 优化建议

${suggestions.join('\n\n')}

---
*报告由 Kineo AI 成本追踪服务生成*
  `.trim();
}

// ========== CostService 类 ==========
class CostService {
  private records: CostRecord[] = [];
  private budget: CostBudget = {
    daily: 50,
    weekly: 300,
    monthly: 1000,
    alerts: { daily: 80, weekly: 80, monthly: 80 },
  };
  private listeners: Set<(stats: CostStats) => void> = new Set();
  private alertListeners: Set<(alert: CostAlert) => void> = new Set();
  private alertCooldown: Record<'daily' | 'weekly' | 'monthly', number> = {
    daily: 0,
    weekly: 0,
    monthly: 0,
  };

  constructor() {
    void this.loadFromStorage();
  }

  // ── 记录入口 ──
  recordLLMCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    metadata?: Record<string, any>
  ): CostRecord {
    const record = buildLLMCostRecord(provider, model, inputTokens, outputTokens, metadata);
    this.appendRecord(record);
    return record;
  }

  recordVideoCost(
    provider: string,
    duration: number,
    resolution: string,
    metadata?: Record<string, any>
  ): CostRecord {
    const record = buildVideoCostRecord(provider, duration, resolution, metadata);
    this.appendRecord(record);
    return record;
  }

  recordAudioCost(provider: string, duration: number, metadata?: Record<string, any>): CostRecord {
    const record = buildAudioCostRecord(provider, duration, metadata);
    this.appendRecord(record);
    return record;
  }

  recordStorageCost(provider: string, sizeMB: number, metadata?: Record<string, any>): CostRecord {
    const record = buildStorageCostRecord(provider, sizeMB, metadata);
    this.appendRecord(record);
    return record;
  }

  // ── 查询 ──
  getStats(): CostStats {
    return calculateCostStats(this.records);
  }

  getProjectStats(projectId: string): CostStats {
    return calculateProjectStats(this.records, projectId);
  }

  getRecords(projectId?: string): CostRecord[] {
    return filterRecordsByProject(this.records, projectId);
  }

  getBudgetStatus(stats: CostStats = this.getStats()): BudgetStatus {
    return buildBudgetStatus(stats, this.budget);
  }

  setBudget(budget: Partial<CostBudget>): void {
    this.budget = { ...this.budget, ...budget };
  }

  getBudget(): CostBudget {
    return this.budget;
  }

  getModelSuggestion = getModelSuggestion;

  getOptimizationSuggestions(): string[] {
    return generateOptimizationSuggestions(this.getStats());
  }

  exportReport(): string {
    return renderCostReport(this.getStats(), this.budget, this.getOptimizationSuggestions());
  }

  // ── 订阅 ──
  subscribe(listener: (stats: CostStats) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeAlert(listener: (alert: CostAlert) => void): () => void {
    this.alertListeners.add(listener);
    return () => this.alertListeners.delete(listener);
  }

  // ── 维护 ──
  clear(): void {
    this.records = [];
    this.notifyListeners();
  }

  async saveToStorage(): Promise<void> {
    try {
      await secureStorage.saveCostData('records', this.records);
      await secureStorage.saveCostData('budget', this.budget);
    } catch (error) {
      logger.error('保存成本记录失败:', error);
    }
  }

  async loadFromStorage(): Promise<boolean> {
    try {
      const records = await secureStorage.loadCostData<CostRecord[]>('records');
      const budget = await secureStorage.loadCostData<CostBudget>('budget');
      if (records) this.records = records;
      if (budget) this.budget = budget;
      return true;
    } catch (error) {
      logger.error('加载成本记录失败:', error);
      return false;
    }
  }

  private appendRecord(record: CostRecord): void {
    this.records.push(record);
    this.checkBudgetAlert();
    this.notifyListeners();
  }

  private checkBudgetAlert(): void {
    const alerts = evaluateBudgetAlerts(this.records, this.budget, this.alertCooldown, Date.now());
    for (const alert of alerts) this.notifyAlertListeners(alert);
  }

  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach((listener) => listener(stats));
    void this.saveToStorage();
  }

  private notifyAlertListeners(alert: CostAlert): void {
    this.alertListeners.forEach((listener) => listener(alert));
  }
}

export const costService = new CostService();
export default CostService;
