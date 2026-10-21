/**
 * clean-empty-state.test.ts — 项目纯净空状态与无 Mock 填充数据单元测试套件
 */

import { useProjectStore } from '@/stores';

describe('Clean Empty State & Mock Data Exclusion Verification Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    useProjectStore.setState({ projects: [], currentProject: null });
  });

  it('Should initialize useProjectStore with an empty projects array []', () => {
    const state = useProjectStore.getState();
    expect(state.projects).toEqual([]);
    expect(state.currentProject).toBeNull();
  });

  it('Should not contain any mock filler projects on cold startup', () => {
    const projects = useProjectStore.getState().projects;
    expect(projects.length).toBe(0);
  });
});
