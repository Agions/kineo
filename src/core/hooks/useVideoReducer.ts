/**
 * useVideo Reducer — 状态机化
 *
 * 架构决策 (2026-06-11):
 *   v3.4 P0 phase 5 A2.5 — 8 useState 集中为 1 个 reducer:
 *   - 视频信息: video / analysis
 *   - 上传: isUploading / uploadProgress
 *   - 分析: isAnalyzing / analysisProgress
 *   - 任务: taskStatus
 *   - 错误: error
 *
 * 死代码清理: 原 useState `isLoading` (L121) setter 从未使用, 永远 false, 删.
 *
 * 对外 API 不变: 8 setXxx 名字 + signature 保持兼容, 调用方 0 改动.
 */

import type { VideoInfo, VideoAnalysis, TaskStatus } from '@/core/types';
import { createFieldUpdater, type FieldUpdater } from '@/core/utils/reducer-helpers';

export interface VideoState {
  video: VideoInfo | null;
  analysis: VideoAnalysis | null;
  isUploading: boolean;
  uploadProgress: number;
  isAnalyzing: boolean;
  analysisProgress: number;
  taskStatus: TaskStatus | null;
  error: string | null;
  // isLoading 是接口契约 (测试 + 调用方期望), 但实际从未被 setter 改过
  // 保留为常量 false 以满足 UseVideoReturn 类型
  isLoading: boolean;
}

// ─── Action 类型 ───────────────────────────────────────────────────────────

export type VideoAction =
  | { type: 'set'; key: keyof VideoState; value: unknown }
  | { type: 'update'; key: keyof VideoState; updater: (prev: unknown) => unknown };

// ─── 初始 State ────────────────────────────────────────────────────────────

export const initialVideoState: VideoState = {
  video: null,
  analysis: null,
  isUploading: false,
  uploadProgress: 0,
  isAnalyzing: false,
  analysisProgress: 0,
  taskStatus: null,
  error: null,
  isLoading: false,
};

// ─── Reducer ───────────────────────────────────────────────────────────────

export function videoReducer(state: VideoState, action: VideoAction): VideoState {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value } as VideoState;
    case 'update':
      return {
        ...state,
        [action.key]: action.updater(state[action.key]),
      } as VideoState;
    default:
      return state;
  }
}

// ─── Setter 工厂 ───────────────────────────────────────────────────────────

export interface VideoSetter {
  setVideo: (v: FieldUpdater<VideoInfo | null>) => void;
  setAnalysis: (v: FieldUpdater<VideoAnalysis | null>) => void;
  setIsUploading: (v: FieldUpdater<boolean>) => void;
  setUploadProgress: (v: FieldUpdater<number>) => void;
  setIsAnalyzing: (v: FieldUpdater<boolean>) => void;
  setAnalysisProgress: (v: FieldUpdater<number>) => void;
  setTaskStatus: (v: FieldUpdater<TaskStatus | null>) => void;
  setError: (v: FieldUpdater<string | null>) => void;
}

export function createVideoSetters(dispatch: (action: VideoAction) => void): VideoSetter {
  return {
    setVideo: createFieldUpdater(dispatch as (action: unknown) => void, 'video'),
    setAnalysis: createFieldUpdater(dispatch as (action: unknown) => void, 'analysis'),
    setIsUploading: createFieldUpdater(dispatch as (action: unknown) => void, 'isUploading'),
    setUploadProgress: createFieldUpdater(dispatch as (action: unknown) => void, 'uploadProgress'),
    setIsAnalyzing: createFieldUpdater(dispatch as (action: unknown) => void, 'isAnalyzing'),
    setAnalysisProgress: createFieldUpdater(
      dispatch as (action: unknown) => void,
      'analysisProgress'
    ),
    setTaskStatus: createFieldUpdater(dispatch as (action: unknown) => void, 'taskStatus'),
    setError: createFieldUpdater(dispatch as (action: unknown) => void, 'error'),
  };
}
