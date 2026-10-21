/**
 * Project Types
 * Extracted from src/shared/types/index.ts
 *
 * EvaluationScores / FrameComment / StoryboardVersion 原本定义在 core/services，
 * 此处提升为 shared 层单向来源，core/services 通过 re-export 保持向后兼容。
 */

import type { AudioTrackConfig } from '@/core/audio/types/audio';
import type { CompositionProject, ExportSettings } from '@/core/audio/types/composition';
import type { Character, StoryAnalysis } from '@/core/script/types/novel';
import type { Script } from '@/core/script/types/script';
import type { StoryboardFrame } from '@/core/storyboard/types/storyboard';

/** 质量评分（原 core/services/project/evaluation-service.ts） */
export interface EvaluationScores {
  consistency: number;
  pacing: number;
  readability: number;
  cost: number;
  overall: number;
}

/** 分镜评论（原 core/services/domain/collaboration-service.ts） */
export interface FrameComment {
  id: string;
  projectId: string;
  frameId: string;
  content: string;
  author: string;
  createdAt: string;
}

/** 分镜版本快照（原 core/services/domain/collaboration-service.ts） */
export interface StoryboardVersion {
  id: string;
  projectId: string;
  label: string;
  createdAt: string;
  createdBy: string;
  payload: unknown;
  /** 内容类型：storyboard | script | character | asset */
  contentType?: string;
}

/** 剧本版本 payload */
export interface ScriptVersionPayload {
  scriptText: string;
  segments: unknown[];
}

/** 角色版本 payload */
export interface CharacterVersionPayload {
  characters: unknown[];
}

/** 素材版本 payload */
export interface AssetVersionPayload {
  assets: unknown[];
  templates: unknown[];
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status?: 'draft' | 'processing' | 'completed' | 'failed';
  content?: string;
  videos?: {
    id: string;
    path?: string;
    name: string;
    duration?: number;
    width?: number;
    height?: number;
    fps?: number;
    format?: string;
    size?: number;
    thumbnail?: string;
    createdAt?: string;
  }[];
  scripts?: Script[];
  settings?: ProjectSettings;
  createdAt: string;
  updatedAt: string;
  metadata?: unknown;
  keyFrames?: string[];
  coverImage?: string;
  videoPath?: string;
  thumbnail?: string;
  novelMetadata?: unknown;
  storyAnalysis?: StoryAnalysis;
  storyboardComments?: FrameComment[];
  storyboardVersions?: StoryboardVersion[];
  // Extended properties used by ProjectDetailPage / ProjectEditPage
  storyboardFrames?: StoryboardFrame[];
  characters?: Character[];
  composition?: CompositionProject;
  audioConfig?: AudioTrackConfig;
  evaluationSummary?: EvaluationScores;
  evaluationReport?: { summary?: EvaluationScores };
  // Export preferences
  exportPreset?: '9:16' | '16:9' | '1:1';
  exportSettings?: Partial<ExportSettings>;
  // Script text (plain string form)
  script?: string;
  novelText?: string;
  parsedScenes?: any[];
  sopStep?: number;
  stage?: string;
  // Multi-Agent Director 2.0 metadata extensions
  cameraDirectingPlans?: Record<string, unknown>;
  spatialMemory?: Record<string, unknown>;
  auditReports?: unknown[];
  subtitles?: unknown[];
  // Pipeline progress tracking
  currentStep?: PipelineStep;
}

export interface ProjectSettings {
  videoQuality?: 'low' | 'medium' | 'high';
  outputFormat?: 'mp4' | 'webm' | 'gif';
  resolution?: '480p' | '720p' | '1080p' | '4k';
  frameRate?: number;
  audioCodec?: string;
  videoCodec?: string;
  subtitleEnabled?: boolean;
  subtitleStyle?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    outline?: boolean;
    outlineColor?: string;
    position?: 'top' | 'bottom' | 'center';
    alignment?: 'left' | 'center' | 'right';
  };
}

// Pipeline step tracking
export type PipelineStep =
  | 'import'
  | 'analysis'
  | 'script'
  | 'character'
  | 'storyboard'
  | 'render'
  | 'video_editing'
  | 'export';

/**
 * Task status (used by hooks/stores; previously lived in @/core/types).
 */
export type TaskStatus = {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message?: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * User preferences bag (used by user.store; previously @/core/types).
 */
export interface UserPreferences {
  [key: string]: unknown;
}

/**
 * Script generation template (used by useWorkflow; previously @/core/types).
 */
export interface ScriptTemplate {
  id: string;
  name: string;
  description?: string;
  content?: string;
}
