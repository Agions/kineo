/**
 * Pipeline 内部执行器
 *
 * 提取自原 pipeline-service.ts 内的 Pipeline 私有类（189 行）。
 *
 * 单一职责：
 *   - 维护单条流水线的状态机（idle/running/paused/completed/error）
 *   - 按顺序执行 config.steps 列表，串联每步 output → 下一步 input
 *   - 处理暂停/恢复/取消指令
 *   - 维护 stepResults / variables / 触发回调
 *
 * 把这个类独立出来后：
 *   - PipelineService（Map管理）只负责 CRUD
 *   - 步骤工厂独立（step-factories.ts）
 *   - 三者组合形成：服务注册 → 工厂拼装 → runner执行
 *
 * @module
 * - 上下文通过 CONTEXT_KEY(Symbol) 挂载到 StepInput 上
 * - 步骤通过 input[CONTEXT_KEY] 访问上下文
 */

import { getErrorMessage } from '@/core/utils';
import { CONTEXT_KEY } from '@/core/pipeline/pipeline-types';
import { logger } from '@/core/utils/logger';

import type {
  PipelineCallbacks,
  PipelineConfig,
  PipelineContext,
  PipelineResult,
  PipelineStep,
  PipelineStepResult,
  PipelineStatus,
} from './pipeline-types';

type PipelineRunCallbacks = PipelineCallbacks;

/**
 * 把 PipelineContext.log 的 level → 对应的 logger 方法集中起来，
 * 避免在 buildContext 里堆 if/else。
 */
function dispatchLogByLevel(
  workflowId: string,
  level: 'info' | 'warn' | 'error'
): (message: string) => void {
  return (message: string) => {
    const prefix = `[Pipeline ${workflowId}] ${message}`;
    if (level === 'error') {
      logger.error(prefix);
    } else if (level === 'warn') {
      logger.warn(prefix);
    } else {
      logger.info(prefix);
    }
  };
}

/** 构造给 step.execute 使用的 PipelineContext */
function buildPipelineContext(
  workflowId: string,
  episodeId: string | undefined,
  projectId: string | undefined,
  variables: Map<string, unknown>
): PipelineContext {
  return {
    workflowId,
    episodeId,
    projectId,
    getVariable: (name) => variables.get(name),
    setVariable: (name, value) => variables.set(name, value),
    log: (message, level = 'info') => dispatchLogByLevel(workflowId, level)(message),
  };
}

/**
 * 等到流水线从 paused 状态恢复。
 * 当 pauseResolve 被 resume()/cancel() 触发时，await 就解开。
 */
function waitForResume(pipeline: PipelineRunner): Promise<void> {
  return new Promise<void>((resolve) => {
    pipeline.setPauseResolver(resolve);
  });
}

export class PipelineRunner {
  readonly workflowId: string;
  readonly config: PipelineConfig;
  status: PipelineStatus = 'idle';
  result?: PipelineResult;

  private variables: Map<string, unknown> = new Map();
  private stepResults: Map<string, PipelineStepResult> = new Map();
  private cancelled = false;
  private paused = false;
  private pauseResolve?: () => void;

  constructor(workflowId: string, config: PipelineConfig) {
    this.workflowId = workflowId;
    this.config = config;
  }

  /** 给 waitForResume 注入 resume 时的解阻塞回调 */
  setPauseResolver(resolve: () => void): void {
    this.pauseResolve = resolve;
  }

  /** 启动流水线（核心循环） */
  async run(initialInput: unknown, callbacks?: PipelineRunCallbacks): Promise<PipelineResult> {
    const startTime = Date.now();
    this.status = 'running';
    this.result = {
      workflowId: this.workflowId,
      status: 'running',
      startTime,
      steps: [],
    };

    const context = buildPipelineContext(
      this.workflowId,
      this.config.episodeId,
      this.config.projectId,
      this.variables
    );

    let currentInput = initialInput;
    const totalSteps = this.config.steps.length;

    for (let i = 0; i < this.config.steps.length; i++) {
      // 1) 取消检测
      if (this.cancelled) {
        this.status = 'idle';
        this.result.status = 'idle';
        return this.result;
      }

      // 2) 暂停等待（resume/cancel 会触发 pauseResolve）
      while (this.paused) {
        await waitForResume(this);
      }

      const step = this.config.steps[i];
      const stepResult = await this.executeSingleStep(
        step,
        i,
        totalSteps,
        currentInput,
        context,
        callbacks
      );

      // 错误短路：executeSingleStep 内部已经 set result.status='error'
      if (stepResult.status === 'error') {
        // status==='error' 时 error 字段必已被 executeSingleStep catch 分支赋值。
        // 原代码直接传 stepResult.error（无 fallback），此处用非空断言保持行为一致。
        callbacks?.onError?.(stepResult.error!, step);
        this.config.onError?.(stepResult.error!, step);
        return this.result;
      }

      currentInput = stepResult.output;
      this.stepResults.set(step.id, stepResult);
      this.result.steps.push(stepResult);
    }

    // 全部成功
    this.status = 'completed';
    this.result.status = 'completed';
    this.result.endTime = Date.now();
    this.result.output = currentInput;

    callbacks?.onComplete?.(this.result);
    this.config.onComplete?.(this.result);

    return this.result;
  }

  /**
   * 执行单个步骤：拆出来让 run 循环更聚焦"状态机"，
   * 本函数聚焦"单步生命周期"（onProgress 回调 → execute → 计时/异常处理）
   */
  private async executeSingleStep(
    step: PipelineStep,
    stepIndex: number,
    totalSteps: number,
    input: unknown,
    context: PipelineContext,
    callbacks?: PipelineRunCallbacks
  ): Promise<PipelineStepResult> {
    const stepStartTime = Date.now();
    const progress = Math.round(((stepIndex + 1) / totalSteps) * 100);

    callbacks?.onStepChange?.(step);
    this.config.onStepChange?.(step);

    const stepResult: PipelineStepResult = {
      stepId: step.id,
      name: step.name,
      status: 'running',
      startTime: stepStartTime,
    };

    try {
      const progressMessage = `执行中: ${step.name}`;
      step.onProgress?.(progress, progressMessage);
      callbacks?.onProgress?.(step.stepId, progress, progressMessage);
      this.config.onProgress?.(step.stepId, progress, progressMessage);

      // 将上下文挂载到输入对象上（Symbol key，spread 时自动排除）
      // 新风格步骤可通过 input[CONTEXT_KEY] 访问；旧风格步骤通过第二参数访问
      const mountedInput = this.mountContextOnInput(input, context);
      const output = await step.execute(mountedInput, context);
      stepResult.status = 'completed';
      stepResult.output = output;
      stepResult.endTime = Date.now();
      stepResult.duration = stepResult.endTime - stepResult.startTime;

      context.log(`Step ${step.name} completed`);
      return stepResult;
    } catch (error) {
      stepResult.status = 'error';
      stepResult.error = getErrorMessage(error);
      stepResult.endTime = Date.now();
      stepResult.duration = stepResult.endTime - stepResult.startTime;

      this.status = 'error';
      this.result!.status = 'error';
      this.result!.error = stepResult.error;
      this.result!.steps.push(stepResult);

      return stepResult;
    }
  }

  /**
   * 将 PipelineContext 挂载到输入对象上（Symbol key，非枚举属性）。
   *
   * 若输入不是对象（原始类型），直接返回原值 — 上下文通过第二参数传递。
   */
  private mountContextOnInput(input: unknown, context: PipelineContext): unknown {
    if (input !== null && typeof input === 'object') {
      Object.defineProperty(input, CONTEXT_KEY, {
        value: context,
        enumerable: false,
        writable: false,
        configurable: false,
      });
    }
    return input;
  }

  /** 暂停（仅在 running 时生效） */
  pause(): void {
    if (this.status === 'running') {
      this.paused = true;
      this.status = 'paused';
    }
  }

  /** 恢复（仅在 paused 时生效） */
  resume(): void {
    if (this.status === 'paused' && this.paused) {
      this.paused = false;
      this.status = 'running';
      if (this.pauseResolve) {
        this.pauseResolve();
        this.pauseResolve = undefined;
      }
    }
  }

  /** 取消（任意状态都会重置 cancelled + 解除暂停等待） */
  cancel(): void {
    this.cancelled = true;
    this.paused = false;
    this.status = 'idle';
    if (this.pauseResolve) {
      this.pauseResolve();
      this.pauseResolve = undefined;
    }
  }

  /** 获取变量 */
  getVariable(name: string): unknown {
    return this.variables.get(name);
  }

  /** 设置变量 */
  setVariable(name: string, value: unknown): void {
    this.variables.set(name, value);
  }

  /** 获取某步骤的执行结果 */
  getStepResult(stepId: string): PipelineStepResult | undefined {
    return this.stepResults.get(stepId);
  }
}
