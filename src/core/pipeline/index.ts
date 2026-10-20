/**
 * Kineo Pipeline 统一入口
 *
 * 本文件是 Pipeline 类型的规范入口（Single Entry Point）。
 * 所有新代码应从这里导入 Pipeline 相关类型和工厂函数。
 *
 * @example
 * ```ts
 * // ✅ 推荐方式
 * import {
 *   PipelineEngine,
 *   createPipelineEngine,
 *   PipelineStepId,
 *   PipelineStatus,
 *   type PipelineStep,
 *   type StepInput,
 *   type StepOutput,
 *   type PipelineContext,
 *   CONTEXT_KEY,
 * } from '@/core/pipeline';
 *
 * // ❌ 旧方式（已弃用）
 * import { PipelineStep } from '@/core/services/pipeline/pipeline-types';
 * ```
 *
 * @module
 * - pipeline-engine.ts    — PipelineEngine 类 + createPipelineEngine 工厂
 * - pipeline-types.ts     — 所有核心类型定义（StepInput/StepOutput/PipelineContext 等）
 * - pipeline-engine-types.ts — 引擎事件/中间件类型
 * - step-helpers.ts       — 步骤辅助函数（getContext / createFailedStepResult 等）
 * - step-*.ts (×7)        — 各业务步骤实现
 */

// ========== 引擎核心 ==========
export { PipelineEngine, createPipelineEngine } from './pipeline-engine';

// ========== 核心类型 ==========
export {
  // 枚举
  PipelineStepId,
  PipelineExecutionMode,
  PipelineStatus,
  StepStatus,
  QualityGateDecision,
  // Symbol key
  CONTEXT_KEY,
} from './pipeline-types';

// ========== 核心 type-only 导出 ==========
export type {
  // 步骤契约
  StepInput,
  StepOutput,
  StepMetrics,
  StepCheckpoint,
  StepProgressEvent,
  PipelineStep,
  // 上下文
  PipelineContext,
  PipelineEvent,
  // 配置与状态
  PipelineConfig,
  PipelineExecutionState,
  PipelineEngineEvent,
  // 策略
  RetryPolicy,
  QualityGateConfig,
  // 结果
  PipelineResult,
  PipelineStepResult,
} from './pipeline-types';

// ========== 引擎事件/中间件类型 ==========
export type {
  PipelineEngineEventHandler,
  PipelineMiddleware,
  PipelineEngineOptions,
} from './pipeline-engine-types';

// ========== 步骤实现 ==========
export { VideoEditingStep, createVideoEditingStep } from './step-video-editing';
export { ExportStep, createExportStep } from './step-export';
export type { ExportOutput } from './step-export';

// ========== 步骤辅助函数 ==========
export {
  getContext,
  DEFAULT_RETRY_POLICY,
  createFailedStepResult,
  createSuccessStepResult,
  reportStepProgress,
} from './step-helpers';
