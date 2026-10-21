import { getErrorMessage } from '@/core/utils';
import { logger } from '@/core/utils/logger';

import type {
  PipelineStep,
  StepInput,
  StepOutput,
  StepProgressEvent,
  RetryPolicy,
  PipelineStepId,
} from './pipeline-types';
import { PipelineExecutionMode, StepStatus, QualityGateDecision } from './pipeline-types';
import { createFailedStepResult, reportStepProgress, DEFAULT_RETRY_POLICY } from './step-helpers';

/**
 * Pipeline Step 基类
 *
 * 子类只需实现 executeImpl() 和配置属性，无需重复：
 * - 统一构造器样板（id/name/stepId/mode/retryPolicy/onProgress/dependencies）
 * - 统一 execute()（耗时统计 + try/catch + 标准化 StepOutput + qualityGate）
 * - 统一 reportProgress()
 * - 统一 computeMetrics()（通过 computeCountMetric 辅助）
 */
export abstract class BasePipelineStep implements PipelineStep {
  readonly id: string;
  readonly name: string;
  readonly stepId: PipelineStepId;
  readonly mode: PipelineExecutionMode = PipelineExecutionMode.SEQUENCE;
  readonly retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY;
  readonly dependencies?: PipelineStepId[];
  readonly parallelKeys?: string[];
  onProgress?: (event: StepProgressEvent) => void;

  constructor(config?: Partial<PipelineStep>) {
    this.id = config?.id ?? '';
    this.name = config?.name ?? '';
    this.stepId = config?.stepId ?? ('' as PipelineStepId);
    this.mode = config?.mode ?? PipelineExecutionMode.SEQUENCE;
    this.retryPolicy = config?.retryPolicy ?? DEFAULT_RETRY_POLICY;
    this.dependencies = config?.dependencies;
    this.parallelKeys = config?.parallelKeys;
    this.onProgress = config?.onProgress;
  }

  async execute(input: StepInput): Promise<StepOutput> {
    const startTime = Date.now();
    try {
      const result = await this.executeImpl(input);
      return {
        stepId: this.stepId,
        status: StepStatus.COMPLETED,
        data: result,
        metrics: {
          durationMs: Date.now() - startTime,
          ...this.computeMetrics(result),
        },
        qualityGate: this.computeQualityGate(result) ?? QualityGateDecision.PASS,
        startTime,
        endTime: Date.now(),
        retryCount: 0,
      };
    } catch (error) {
      const msg = getErrorMessage(error);
      logger.error(`[${this.name}] failed: ${msg}`);
      return createFailedStepResult(this.stepId, startTime, msg);
    }
  }

  protected reportProgress(progress: number, message: string): void {
    reportStepProgress(this.stepId, this.onProgress, progress, message);
  }

  /** 子类实现具体业务逻辑，返回步骤数据（自动包装为 StepOutput） */
  protected abstract executeImpl(input: StepInput): Promise<unknown>;

  /** 子类可覆盖，返回额外的 metrics 字段（framesProcessed / tokensUsed 等） */
  protected computeMetrics(_result: unknown): Record<string, unknown> {
    return {};
  }

  /** 子类可覆盖，根据结果计算质量门控决策（默认 PASS） */
  protected computeQualityGate(_result: unknown): QualityGateDecision | undefined {
    return undefined;
  }

  /** 辅助方法：从结果中提取数值字段作为 framesProcessed */
  protected computeNumericMetric(result: unknown, fieldName: string): Record<string, unknown> {
    if (result && typeof result === 'object' && fieldName in (result as Record<string, unknown>)) {
      const val = (result as Record<string, unknown>)[fieldName];
      if (typeof val === 'number') {
        return { framesProcessed: val };
      }
    }
    return {};
  }

  /** 辅助方法：从结果中提取数组字段的长度作为 framesProcessed */
  protected computeCountMetric(result: unknown, fieldName: string): Record<string, unknown> {
    if (result && typeof result === 'object' && fieldName in (result as Record<string, unknown>)) {
      const arr = (result as Record<string, unknown>)[fieldName];
      return { framesProcessed: Array.isArray(arr) ? arr.length : 0 };
    }
    return {};
  }
}
