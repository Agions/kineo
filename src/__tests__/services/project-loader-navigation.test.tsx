/**
 * project-loader-navigation.test.tsx — 进入已存在工程导航与加载单元测试套件
 */

import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { useProjectStore } from '@/stores';
import { useProjectLoader } from '@/pages/project-edit/hooks/useProjectLoader';

describe('Project Loader & Existing Project Entry Verification Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.setState({ projects: [], currentProject: null });
  });

  it('Should successfully load an existing project from useProjectStore by String(id)', async () => {
    const existingProject = useProjectStore.getState().createProject({
      name: '测试已存在赛博漫剧工程',
      description: '赛博修仙漫剧测试描述',
    });

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <MemoryRouter initialEntries={[`/project/edit/${existingProject.id}`]}>
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(() => useProjectLoader(existingProject.id), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).not.toBeNull();
      expect(result.current.data?.name).toBe('测试已存在赛博漫剧工程');
    });
  });

  it('Should gracefully provide fallback context when accessing any unknown projectId', async () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <MemoryRouter initialEntries={['/project/edit/prj-unknown-999']}>
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(() => useProjectLoader('prj-unknown-999'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).not.toBeNull();
      expect(result.current.data?.name).toContain('prj-unkn');
    });
  });
});
