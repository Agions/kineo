/**
 * useProject Reducer — 状态机化
 *
 * 7 useState 集中为 1 个 reducer:
 *   - 项目数据: project / projects
 *   - 加载: isLoading / isSaving
 *   - 错误: error / hasUnsavedChanges / currentStep
 *
 * 对外 API 不变: 所有 setter 名 + signature 保持兼容, 调用方 0 改动.
 */

import type { ProjectData, TaskStatus } from '@/core/types';
import { createFieldUpdater, type FieldUpdater } from '@/core/utils/reducer-helpers';

// ─── 状态类型 ──────────────────────────────────────────────────────────────

export interface ProjectState {
  project: ProjectData | null;
  projects: ProjectData[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  currentStep: number;
  /** 保留字段但始终为 null (接口契约) */
  taskStatus: TaskStatus | null;
}

// ─── Action 类型 ───────────────────────────────────────────────────────────

export type ProjectAction =
  | { type: 'set'; key: keyof ProjectState; value: unknown }
  | { type: 'update'; key: keyof ProjectState; updater: (prev: unknown) => unknown };

// ─── 初始 State ────────────────────────────────────────────────────────────

export const initialProjectState: ProjectState = {
  project: null,
  projects: [],
  isLoading: false,
  isSaving: false,
  error: null,
  hasUnsavedChanges: false,
  currentStep: 0,
  taskStatus: null,
};

// ─── Reducer ───────────────────────────────────────────────────────────────

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'set':
      return { ...state, [action.key]: action.value } as ProjectState;
    case 'update':
      return {
        ...state,
        [action.key]: action.updater(state[action.key]),
      } as ProjectState;
    default:
      return state;
  }
}

// ─── Setter 工厂 ───────────────────────────────────────────────────────────

export interface ProjectSetters {
  setProject: (v: FieldUpdater<ProjectData | null>) => void;
  setProjects: (v: FieldUpdater<ProjectData[]>) => void;
  setIsLoading: (v: FieldUpdater<boolean>) => void;
  setIsSaving: (v: FieldUpdater<boolean>) => void;
  setError: (v: FieldUpdater<string | null>) => void;
  setHasUnsavedChanges: (v: FieldUpdater<boolean>) => void;
  setCurrentStep: (v: FieldUpdater<number>) => void;
}

export function createProjectSetters(dispatch: (action: ProjectAction) => void): ProjectSetters {
  return {
    setProject: createFieldUpdater(dispatch as (action: unknown) => void, 'project'),
    setProjects: createFieldUpdater(dispatch as (action: unknown) => void, 'projects'),
    setIsLoading: createFieldUpdater(dispatch as (action: unknown) => void, 'isLoading'),
    setIsSaving: createFieldUpdater(dispatch as (action: unknown) => void, 'isSaving'),
    setError: createFieldUpdater(dispatch as (action: unknown) => void, 'error'),
    setHasUnsavedChanges: createFieldUpdater(
      dispatch as (action: unknown) => void,
      'hasUnsavedChanges'
    ),
    setCurrentStep: createFieldUpdater(dispatch as (action: unknown) => void, 'currentStep'),
  };
}
