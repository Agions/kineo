/**
 * Project Store 测试
 */

import { useProjectStore } from '@/stores';

// 模拟 storage service
jest.mock('@/core/services/project/secure-storage-service', () => ({
  secureStorage: {
    saveSecureConfig: jest.fn(),
    getSecureConfig: jest.fn().mockResolvedValue(null),
  },
}));

describe('Project Store', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      currentProject: null,
    });
  });

  describe('createProject', () => {
    it('应该创建新项目', () => {
      const { createProject } = useProjectStore.getState();

      const project = createProject({
        name: '测试项目',
        description: '这是一个测试项目',
      });

      expect(project).toHaveProperty('id');
      expect(project.name).toBe('测试项目');
      expect(project.description).toBe('这是一个测试项目');
      expect(project.status).toBe('draft');
    });

    it('应该使用默认名称', () => {
      const { createProject } = useProjectStore.getState();

      const project = createProject({});

      expect(project.name).toBe('新项目');
    });
  });

  describe('updateProject', () => {
    it('应该更新项目', () => {
      const { createProject, updateProject } = useProjectStore.getState();

      const project = createProject({ name: '原始名称' });
      updateProject(project.id, { name: '新名称' });

      const updated = useProjectStore.getState().projects.find((p) => p.id === project.id);
      expect(updated?.name).toBe('新名称');
    });
  });

  describe('deleteProject', () => {
    it('应该删除项目', () => {
      const { createProject, deleteProject } = useProjectStore.getState();

      createProject({ name: '测试' });
      expect(useProjectStore.getState().projects.length).toBe(1);

      const project = useProjectStore.getState().projects[0];
      deleteProject(project.id);

      expect(useProjectStore.getState().projects.length).toBe(0);
    });
  });

  describe('recentProjects', () => {
    it('应该返回最近更新的项目', () => {
      const { createProject, recentProjects } = useProjectStore.getState();

      createProject({ name: '项目A' });
      createProject({ name: '项目B' });

      const recent = recentProjects();
      expect(recent.length).toBe(2);
    });

    it('应该限制最多 10 个项目', () => {
      const { createProject, recentProjects } = useProjectStore.getState();

      for (let i = 0; i < 15; i++) {
        createProject({ name: `项目${i}` });
      }

      const recent = recentProjects();
      expect(recent.length).toBe(10);
    });
  });
});
