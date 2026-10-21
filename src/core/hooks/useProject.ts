/**
 * 项目管理 Hook（reducer 实现）
 *
 * 内部用 useReducer + localStorage 完成项目 CRUD。
 * 状态机定义在 useProjectReducer.ts。
 */

import { useReducer, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { ProjectData, VideoInfo, Script, ProjectSettings, TaskStatus } from '@/core/types';
import { STORAGE_KEYS } from '@/core/constants/app-config';

import {
  projectReducer,
  initialProjectState,
  createProjectSetters,
  type ProjectState,
} from './useProjectReducer';

function loadProjects(): ProjectData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return raw ? (JSON.parse(raw) as ProjectData[]) : [];
  } catch {
    return [];
  }
}

function persistProjects(projects: ProjectData[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  } catch {
    // ignore quota errors
  }
}

const DEFAULT_SETTINGS: ProjectSettings = {
  videoQuality: 'high',
  outputFormat: 'mp4',
  resolution: '1080p',
  frameRate: 30,
  audioCodec: 'aac',
  videoCodec: 'h264',
  subtitleEnabled: true,
};

export interface UseProjectReturn {
  project: ProjectData | null;
  projects: ProjectData[];
  recentProjects: ProjectData[];
  createProject: (name: string, description?: string) => ProjectData;
  loadProject: (projectId: string) => Promise<boolean>;
  saveProject: () => Promise<boolean>;
  updateProject: (updates: Partial<ProjectData>) => void;
  deleteProject: (projectId: string) => Promise<boolean>;
  duplicateProject: (projectId: string) => Promise<ProjectData | null>;
  setVideo: (videoInfo: VideoInfo) => void;
  removeVideo: () => void;
  setScript: (script: Script) => void;
  updateScript: (updates: Partial<Script>) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  taskStatus: TaskStatus | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  resetProject: () => void;
}

// 初始状态工厂 (lazy load projects from storage)
function createInitialState(): ProjectState {
  return { ...initialProjectState, projects: loadProjects() };
}

export function useProject(_projectId?: string): UseProjectReturn {
  const [state, dispatch] = useReducer(projectReducer, undefined, createInitialState);
  const setters = createProjectSetters(dispatch);

  const { projects } = state;

  const recentProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 10),
    [projects]
  );

  const createProject = useCallback(
    (name: string, description?: string): ProjectData => {
      const now = new Date().toISOString();
      const newProject: ProjectData = {
        id: uuidv4(),
        name: name || '未命名项目',
        description,
        status: 'draft',
        settings: { ...DEFAULT_SETTINGS },
        videos: [],
        scripts: [],
        createdAt: now,
        updatedAt: now,
      };
      setters.setProjects((prev) => {
        const next = [newProject, ...prev];
        persistProjects(next);
        return next;
      });
      setters.setProject(newProject);
      setters.setHasUnsavedChanges(false);
      return newProject;
    },
    [setters]
  );

  const loadProject = useCallback(
    async (id: string): Promise<boolean> => {
      setters.setIsLoading(true);
      setters.setError(null);
      try {
        const all = loadProjects();
        const loaded = all.find((p) => p.id === id) || null;
        if (loaded) {
          setters.setProject(loaded);
          setters.setHasUnsavedChanges(false);
          return true;
        } else {
          setters.setError('项目不存在');
          return false;
        }
      } catch {
        setters.setError('加载项目失败');
        return false;
      } finally {
        setters.setIsLoading(false);
      }
    },
    [setters]
  );

  const saveProject = useCallback(async (): Promise<boolean> => {
    const currentProject = state.project;
    if (!currentProject) return false;
    setters.setIsSaving(true);
    try {
      const updated = { ...currentProject, updatedAt: new Date().toISOString() };
      setters.setProjects((prev) => {
        const next = prev.map((p) => (p.id === updated.id ? updated : p));
        persistProjects(next);
        return next;
      });
      setters.setProject(updated);
      setters.setHasUnsavedChanges(false);
      return true;
    } catch {
      setters.setError('保存项目失败');
      return false;
    } finally {
      setters.setIsSaving(false);
    }
  }, [setters, state.project]);

  const updateProject = useCallback(
    (updates: Partial<ProjectData>) => {
      setters.setProject((prev) => (prev ? { ...prev, ...updates } : null));
      setters.setHasUnsavedChanges(true);
    },
    [setters]
  );

  const deleteProject = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setters.setProjects((prev) => {
          const next = prev.filter((p) => p.id !== id);
          persistProjects(next);
          return next;
        });
        if (state.project?.id === id) setters.setProject(null);
        return true;
      } catch {
        setters.setError('删除项目失败');
        return false;
      }
    },
    [setters, state.project]
  );

  const duplicateProject = useCallback(
    async (id: string): Promise<ProjectData | null> => {
      const source = loadProjects().find((p) => p.id === id);
      if (!source) return null;
      const now = new Date().toISOString();
      const duplicated: ProjectData = {
        ...source,
        id: uuidv4(),
        name: `${source.name} (副本)`,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };
      setters.setProjects((prev) => {
        const next = [duplicated, ...prev];
        persistProjects(next);
        return next;
      });
      return duplicated;
    },
    [setters]
  );

  const setVideo = useCallback(
    (videoInfo: VideoInfo) => updateProject({ videos: [videoInfo] }),
    [updateProject]
  );

  const removeVideo = useCallback(() => updateProject({ videos: [] }), [updateProject]);

  const setScript = useCallback(
    (script: Script) => updateProject({ scripts: [script] }),
    [updateProject]
  );

  const updateScript = useCallback(
    (updates: Partial<Script>) => {
      if (!state.project?.scripts?.[0]) return;
      updateProject({
        scripts: [{ ...state.project.scripts[0], ...updates, updatedAt: new Date().toISOString() }],
      });
    },
    [state.project, updateProject]
  );

  const updateSettings = useCallback(
    (settings: Partial<ProjectSettings>) => {
      if (!state.project) return;
      updateProject({
        settings: { ...state.project.settings, ...settings } as ProjectSettings,
      });
    },
    [state.project, updateProject]
  );

  const resetProject = useCallback(() => {
    setters.setProject(null);
    setters.setHasUnsavedChanges(false);
    setters.setError(null);
    setters.setCurrentStep(0);
  }, [setters]);

  return {
    project: state.project,
    projects: state.projects,
    recentProjects,
    createProject,
    loadProject,
    saveProject,
    updateProject,
    deleteProject,
    duplicateProject,
    setVideo,
    removeVideo,
    setScript,
    updateScript,
    updateSettings,
    taskStatus: state.taskStatus,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    hasUnsavedChanges: state.hasUnsavedChanges,
    currentStep: state.currentStep,
    setCurrentStep: setters.setCurrentStep,
    saving: state.isSaving,
    setSaving: setters.setIsSaving,
    setError: setters.setError,
    resetProject,
  };
}
