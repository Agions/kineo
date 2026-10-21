/**
 * Pipeline Engine - 流水线引擎（facade）
 *
 * 拆分为：
 * - pipeline-engine-types.ts: 类型定义
 * - pipeline-middleware.ts: Logger + Metrics 中间件
 * - 本文件：引擎核心类 + 工厂函数
 */
import { delay } from '@/core/utils/timing';
import { secureStorage } from '@/core/services/project/secure-storage-service';
import { logger } from '@/core/utils/logger';

import type {
  PipelineEngineEventHandler,
  PipelineEngineOptions,
  PipelineMiddleware,
} from './pipeline-engine-types';
import type {
  PipelineContext,
  PipelineEvent,
  PipelineStep,
  StepCheckpoint,
  StepInput,
  StepOutput,
} from './pipeline-types';
import { CONTEXT_KEY, PipelineStatus } from './pipeline-types';

// Re-export types + middleware 保持向后兼容
export type {
  PipelineEngineEventHandler,
  PipelineMiddleware,
  PipelineEngineOptions,
} from './pipeline-engine-types';
 
export {
   
  LoggerMiddleware,
   
  MetricsMiddleware,
  getMetrics,
  resetMetrics,
} from './pipeline-middleware';

export class PipelineEngine {
  private steps: PipelineStep[] = [];
  private options: PipelineEngineOptions;
  private status: PipelineStatus = PipelineStatus.IDLE;
  private eventHandler?: PipelineEngineEventHandler;
  private abortController: AbortController | null = null;
  private enableCheckpoint = true;
  /** 跨步骤变量存储 — 由 buildContext() 暴露给步骤 */
  private variables: Map<string, unknown> = new Map();
  /** 流水线级 Checkpoint 缓存 — 避免频繁读写存储 */
  private checkpointCache: Map<string, StepCheckpoint> = new Map();

  constructor(options: PipelineEngineOptions = {}) {
    this.options = { enableCheckpoint: true, enableQualityGate: true, ...options };
    this.enableCheckpoint = !!this.options.enableCheckpoint && !!this.options.workflowId;
  }

  onEvents(handler: PipelineEngineEventHandler): void {
    this.eventHandler = handler;
  }

  getStatus(): { status: PipelineStatus; stepCount: number; steps: string[] } {
    return {
      status: this.status,
      stepCount: this.steps.length,
      steps: this.steps.map((s) => s.id),
    };
  }

  /**
   * 构建 PipelineContext 实例。
   *
   * 在首次执行 run()/resume() 时调用一次，后续步骤通过
   * StepInput[CONTEXT_KEY] 访问同一实例。
   */
  buildContext(): PipelineContext {
    const context: PipelineContext = {
      workflowId: this.options.workflowId ?? '',
      projectId: this.options.projectId,
      variables: this.variables,

      getVariable: <T = unknown>(key: string) => this.variables.get(key) as T | undefined,
      setVariable: <T = unknown>(key: string, value: T) => this.variables.set(key, value),
      log: (message, level = 'info') => {
        const prefix = `[Pipeline ${this.options.workflowId ?? 'unknown'}] ${message}`;
        if (level === 'error') logger.error(prefix);
        else if (level === 'warn') logger.warn(prefix);
        else logger.info(prefix);
      },
      getCheckpoint: (stepId) => this.checkpointCache.get(stepId),
      saveCheckpoint: (checkpoint) => {
        this.checkpointCache.set(checkpoint.stepId, checkpoint);
      },
      emit: (event: PipelineEvent) => {
        this.eventHandler?.onStepComplete?.(event.stepId ?? '', {} as StepOutput);
      },
    };
    return context;
  }

  /** 获取当前变量 Map（调试/测试用） */
  getVariables(): ReadonlyMap<string, unknown> {
    return this.variables;
  }

  pause(): boolean {
    if (this.status !== PipelineStatus.RUNNING) return false;
    this.status = PipelineStatus.PAUSED;
    return true;
  }

  async resume(input?: StepInput): Promise<StepOutput> {
    this.status = PipelineStatus.RUNNING;
    this.abortController = new AbortController();
    const actualInput = input || ({} as StepInput);
    this.mountContext(actualInput);
    return this.runInternal(actualInput, true);
  }

  cancel(): void {
    this.status = PipelineStatus.CANCELLED;
    this.abortController?.abort();
  }

  addStep(step: PipelineStep): this {
    this.steps.push(step);
    return this;
  }

  addMiddleware(middleware: PipelineMiddleware): this {
    if (!this.options.middlewares) this.options.middlewares = [];
    this.options.middlewares.push(middleware);
    return this;
  }

  async run(input: StepInput): Promise<StepOutput> {
    this.status = PipelineStatus.RUNNING;
    this.abortController = new AbortController();
    // 构建运行时上下文并挂载到输入（Symbol key，spread 时自动排除）
    this.mountContext(input);
    logger.info('[PipelineEngine] Starting pipeline', {
      workflowId: this.options.workflowId,
      steps: this.steps.map((s) => s.id),
    });
    return this.runInternal(input, false);
  }

  /**
   * 将 PipelineContext 挂载到输入对象上。
   *
   * 使用 Object.defineProperty 设置非枚举属性，确保：
   * 1. `context = input[CONTEXT_KEY]` 类型安全
   * 2. `{ ...input }` spread 操作不包含 context（防止步骤返回值覆盖）
   * 3. JSON.stringify 不包含 context（不影响 Checkpoint 序列化）
   */
  private mountContext(input: StepInput): void {
    const ctx = this.buildContext();
    Object.defineProperty(input, CONTEXT_KEY, {
      value: ctx,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }

  private async runInternal(input: StepInput, isResume: boolean): Promise<StepOutput> {
    // 注意：spread 不会保留 Symbol 键（已定义为 non-enumerable），
    // 所以 context 直接引用 input 而非副本。后续合并步骤输出时也需手动保留 Symbol。
    let context: StepInput = input;
    this.options.middlewares?.forEach((m) => m.onPipelineStart?.());

    try {
      for (const step of this.steps) {
        if (this.status === PipelineStatus.CANCELLED) throw new Error('Pipeline cancelled');
        while (this.status === PipelineStatus.PAUSED) {
          await delay(100);
        }

        this.options.middlewares?.forEach((m) => m.onStepStart?.(step.id, context as never));

        const restored = await this.restoreCheckpoint(step.id, context, isResume);
        if (restored) {
          // 断点恢复后需重新挂载 context — spread 会丢失 Symbol 键
          context = Object.assign(restored as StepInput, { [CONTEXT_KEY]: context[CONTEXT_KEY] });
          this.eventHandler?.onStepComplete?.(step.id, context as never);
          continue;
        }

        if (await this.shouldSkipCheckpoint(step.id)) {
          continue;
        }

        try {
          this.eventHandler?.onStepStart?.(step.id);
          this.options.onProgress?.(step.id, 0);

          const result = await step.execute(context);
          // 合并步骤输出时保留 context Symbol 键（步骤返回值不可覆盖上下文）
          context = Object.assign(result, { [CONTEXT_KEY]: context[CONTEXT_KEY] }) as StepInput;

          await this.saveCheckpoint(step.id, result);

          this.options.onProgress?.(step.id, 1);
          this.eventHandler?.onStepComplete?.(step.id, result);
          this.options.middlewares?.forEach((m) => m.onStepComplete?.(step.id, result));
        } catch (error) {
          const err = error as Error;
          this.options.onError?.(step.id, err);
          this.eventHandler?.onStepFail?.(step.id, err.message);
          this.options.middlewares?.forEach((m) => m.onStepError?.(step.id, err));
          throw error;
        }
      }

      this.status = PipelineStatus.COMPLETED;
      const output = context as unknown as StepOutput;
      this.options.onComplete?.(output);
      this.options.middlewares?.forEach((m) => m.onPipelineComplete?.(output));
      logger.info('[PipelineEngine] Pipeline completed successfully');
      return output;
    } catch (error) {
      this.status = PipelineStatus.FAILED;
      const err = error as Error;
      this.eventHandler?.onStepFail?.('pipeline', err.message);
      this.options.middlewares?.forEach((m) => m.onPipelineError?.(err));
      logger.error('[PipelineEngine] Pipeline failed:', err);
      throw error;
    }
  }

  getSteps(): PipelineStep[] {
    return [...this.steps];
  }
  isRunning(): boolean {
    return this.status === PipelineStatus.RUNNING;
  }
  isFinal(): boolean {
    return this.status === PipelineStatus.COMPLETED;
  }
  isFailed(): boolean {
    return this.status === PipelineStatus.FAILED;
  }

  // Checkpoint 策略（内联原 CheckpointManager）

  private async shouldSkipCheckpoint(stepId: string): Promise<boolean> {
    if (!this.enableCheckpoint) return false;
    const cp = await secureStorage.loadCheckpoint(stepId);
    return !!cp?.completed;
  }

  private async restoreCheckpoint(
    stepId: string,
    context: StepInput,
    isResume: boolean
  ): Promise<StepInput | null> {
    if (!this.enableCheckpoint || !isResume) return null;
    const cp = await secureStorage.loadCheckpoint(stepId);
    if (!cp?.completed) return null;
    return { ...context, ...(cp.data as Record<string, unknown>) } as StepInput;
  }

  private async saveCheckpoint(stepId: string, data: StepOutput): Promise<void> {
    if (!this.enableCheckpoint) return;
    await secureStorage.saveCheckpoint(stepId, data);
  }
}

/** 工厂函数 */
export function createPipelineEngine(config: {
  workflowId: string;
  projectId?: string;
  enableCheckpoint?: boolean;
  enableQualityGate?: boolean;
  middlewares?: PipelineMiddleware[];
}): PipelineEngine {
  return new PipelineEngine({
    workflowId: config.workflowId,
    projectId: config.projectId,
    enableCheckpoint: config.enableCheckpoint ?? true,
    enableQualityGate: config.enableQualityGate ?? true,
    middlewares: config.middlewares,
  });
}
