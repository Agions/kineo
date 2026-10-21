/**
 * Story Context — type re-exports
 *
 * Source of truth for StoryboardFrame: @/core/storyboard/types/storyboard
 *
 * Note: PipelineStepId / StepCheckpoint 已移除 — 它们定义在 core/pipeline，
 * 不属于 shared 层。如需要请直接 import from '@/core/pipeline/pipeline-types'。
 */

export type { StoryboardFrame } from '@/core/storyboard/types/storyboard';
