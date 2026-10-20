/**
 * Kineo Pipeline 核心类型定义
 *
 * 定义流水线步骤的标准化接口、数据契约和质量门控
 *
 * @module
 * - 本文件是所有 Pipeline 类型的单一真源（Single Source of Truth）
 * - CONTEXT_KEY 用于在 StepInput 上挂载运行时上下文（非 enumerable，spread 时自动排除）
 */

import type { QualityGateThresholds } from '@/core/services/pipeline/quality-gate-service';

export const CONTEXT_KEY: unique symbol = Symbol('PipelineContext');

export enum PipelineStepId {
  IMPORT = 'import',
  ANALYSIS = 'analysis',
  SCRIPT = 'script',
  CHARACTER = 'character',
  STORYBOARD = 'storyboard',
  RENDER = 'render',
  VIDEO_EDITING = 'video-editing',
  COMPOSITION = 'composition',
  AUDIO_SYNTHESIS = 'audio-synthesis',
  EXPORT = 'export',
}

export enum PipelineExecutionMode {
  SEQUENCE = 'sequence',
  PARALLEL = 'parallel',
  DAG = 'dag',
  LOOP = 'loop',
}

export enum PipelineStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  RETRYING = 'retrying',
}

export enum QualityGateDecision {
  PASS = 'pass',
  FAIL = 'fail',
  WARN = 'warn',
  BLOCK = 'block',
}

export interface StepInput {
  [key: string]: unknown;
  [CONTEXT_KEY]?: PipelineContext;
  workflowId?: string;
  stepId?: PipelineStepId;
  prevStepOutputs?: Map<PipelineStepId, StepOutput>;
  checkpoint?: StepCheckpoint;
}

export interface StepOutput {
  [key: string]: unknown;
  stepId: PipelineStepId;
  status: StepStatus;
  data: unknown;
  metrics?: StepMetrics;
  qualityGate?: QualityGateDecision;
  error?: string;
  startTime: number;
  endTime?: number;
  retryCount: number;
}

export interface StepMetrics {
  durationMs: number;
  tokensUsed?: number;
  costEstimate?: number;
  framesProcessed?: number;
  qualityScore?: number;
}

export interface StepCheckpoint {
  stepId: PipelineStepId;
  completedFrames: string[];
  lastProcessedIndex: number;
  partialOutput: unknown;
  timestamp: number;
}

export interface PipelineContext {
  workflowId: string;
  projectId?: string;
  episodeId?: string;
  variables?: Map<string, unknown>;
  getVariable: <T = unknown>(key: string) => T | undefined;
  setVariable: <T = unknown>(key: string, value: T) => void;
  log: (message: string, level?: 'debug' | 'info' | 'warn' | 'error') => void;
  getCheckpoint: (stepId: PipelineStepId) => StepCheckpoint | undefined;
  saveCheckpoint: (checkpoint: StepCheckpoint) => void;
  emit: (event: PipelineEvent) => void;
}

export interface PipelineEvent {
  type:
    | 'step_start'
    | 'step_progress'
    | 'step_complete'
    | 'step_fail'
    | 'quality_gate'
    | 'checkpoint';
  workflowId: string;
  stepId?: PipelineStepId;
  progress?: number;
  message?: string;
  data?: unknown;
  timestamp: number;
}

export interface PipelineStep {
  id: string;
  name: string;
  stepId: PipelineStepId;
  mode: PipelineExecutionMode;
  retryPolicy: RetryPolicy;
  qualityGate?: QualityGateConfig;
  dependencies?: PipelineStepId[];
  parallelKeys?: string[];
  execute(input: StepInput): Promise<StepOutput>;
  onProgress?: (event: StepProgressEvent) => void;
}

export interface StepProgressEvent {
  stepId: PipelineStepId;
  progress: number;
  message: string;
  detail?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryableErrors?: string[];
}

export interface QualityGateConfig {
  enabled: boolean;
  thresholds: QualityGateThresholds;
  onFail: 'block' | 'warn' | 'skip';
}

export interface PipelineConfig {
  workflowId: string;
  name: string;
  mode: PipelineExecutionMode;
  steps: PipelineStep[];
  projectId?: string;
  episodeId?: string;
  enableCheckpoint?: boolean;
  enableQualityGate?: boolean;
}

export interface PipelineExecutionState {
  workflowId: string;
  status: PipelineStatus;
  currentStepId?: PipelineStepId;
  stepStates: Map<PipelineStepId, StepStatus>;
  context: PipelineContext;
  startTime?: number;
  endTime?: number;
  error?: string;
}

export interface PipelineEngineEvent {
  onStepStart?: (stepId: PipelineStepId) => void;
  onStepProgress?: (stepId: PipelineStepId, progress: number, message?: string) => void;
  onStepComplete?: (stepId: PipelineStepId, output: StepOutput) => void;
  onStepFail?: (stepId: PipelineStepId, error: string) => void;
  onQualityGate?: (stepId: PipelineStepId, decision: QualityGateDecision, details?: string) => void;
  onCheckpoint?: (stepId: PipelineStepId, checkpoint: StepCheckpoint) => void;
  onPipelineComplete?: (results: Map<PipelineStepId, StepOutput>) => void;
  onPipelineFail?: (error: string, failedStepId?: PipelineStepId) => void;
}

export interface PipelineCallbacks {
  onStepChange?: (step: PipelineStep) => void;
  onProgress?: (stepId: string, progress: number, message?: string) => void;
  onComplete?: (result: PipelineResult) => void;
  onError?: (error: string, step?: PipelineStep) => void;
}

export interface PipelineResult {
  workflowId: string;
  status: PipelineStatus;
  output?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
  steps: PipelineStepResult[];
}

export interface PipelineStepResult {
  stepId: string;
  name: string;
  status: PipelineStatus;
  output?: unknown;
  error?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}
