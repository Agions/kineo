/**
 * 项目状态管理
 * 内部使用 slice 模式，外部保持原有 API 完全兼容
 * 默认空状态纯净模式：projects 初始为空 []，完全由用户新建与导入驱动
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { ProjectData } from '@/common/types/project';
import { createDebouncedStorage } from '@/stores/middlewares/persistWithDebounce';
import { createCurrentProjectSlice } from '@/stores/slices/currentProjectSlice';
import { createProjectSlice } from '@/stores/slices/projectSlice';

export const INITIAL_DEMO_PROJECTS: ProjectData[] = [];

export interface ProjectState {
  // 项目列表
  projects: ProjectData[];

  // 当前项目
  currentProject: ProjectData | null;

  // Computed
  recentProjects: () => ProjectData[];

  // Actions
  createProject: (project: Partial<ProjectData>) => ProjectData;
  updateProject: (id: string, updates: Partial<ProjectData>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: ProjectData | null) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => {
      const projectSlice = createProjectSlice(set, get);
      const currentProjectSlice = createCurrentProjectSlice(set);

      return {
        // 初始为空状态 (Clean Empty State)
        projects: [],
        currentProject: null,

        // Computed
        recentProjects: projectSlice.recentProjects,

        // Project actions
        createProject: projectSlice.createProject,
        updateProject: projectSlice.updateProject,
        deleteProject: projectSlice.deleteProject,

        // Current project
        setCurrentProject: currentProjectSlice.setCurrentProject,
      };
    },
    {
      name: 'kineo-project-storage-v2',
      storage: createJSONStorage(() => createDebouncedStorage(localStorage, 1500)),
      partialize: (state) => ({
        projects: state.projects,
      }),
    }
  )
);
