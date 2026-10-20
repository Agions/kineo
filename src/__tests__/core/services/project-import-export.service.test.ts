/**
 * ProjectImportExportService Tests
 */

import type { ProjectData } from '@/common/types/project';
import { projectImportExportService } from '@/core/services/project/project-import-export-service';

// Mock UUID - returns unique IDs for each call
let uuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => `mock-uuid-${++uuidCounter}`),
}));

const resetUuidCounter = () => {
  uuidCounter = 0;
};

describe('ProjectImportExportService', () => {
  // Sample project data for testing
  const createMockProject = (overrides: Partial<ProjectData> = {}): ProjectData => ({
    id: 'project-1',
    name: '测试项目',
    description: '这是一个测试项目',
    status: 'draft',
    videos: [
      {
        id: 'video-1',
        name: '视频1.mp4',
        path: '/path/to/video1.mp4',
        duration: 120,
        width: 1920,
        height: 1080,
        fps: 30,
        format: 'mp4',
        size: 1024000,
      },
    ],
    scripts: [
      {
        id: 'script-1',
        title: '脚本标题',
        content: '脚本内容',
        segments: [
          {
            id: 'seg-1',
            startTime: 0,
            endTime: 10,
            content: '第一段内容',
            type: 'narration',
          },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    resetUuidCounter();
  });

  describe('exportToJSON', () => {
    it('should export project to JSON string', () => {
      const project = createMockProject();
      const result = projectImportExportService.exportToJSON(project);

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.project.name).toBe('测试项目');
      expect(parsed.metadata.format).toBe('json');
      expect(parsed.metadata.includesMedia).toBe(false);
    });

    it('should include media flag based on options', () => {
      const project = createMockProject();
      const resultWithMedia = projectImportExportService.exportToJSON(project, {
        includeMedia: true,
      });
      const parsedWithMedia = JSON.parse(resultWithMedia);
      expect(parsedWithMedia.metadata.includesMedia).toBe(true);
    });

    it('should sanitize video paths on export', () => {
      const project = createMockProject();
      const result = projectImportExportService.exportToJSON(project);
      const parsed = JSON.parse(result);

      expect(parsed.project.videos[0].path).toBe('[导出时移除]');
    });

    it('should include exportedAt timestamp', () => {
      const project = createMockProject();
      const result = projectImportExportService.exportToJSON(project);
      const parsed = JSON.parse(result);

      expect(parsed.exportedAt).toBeDefined();
      expect(new Date(parsed.exportedAt)).toBeInstanceOf(Date);
    });
  });

  describe('exportProject', () => {
    it('should return filename and content for JSON format', async () => {
      const project = createMockProject();
      const result = await projectImportExportService.exportProject(project, { format: 'json' });

      expect(result.filename).toMatch(/^kineo_测试项目_\d{4}-\d{2}-\d{2}\.json$/);
      expect(typeof result.content).toBe('string');
    });

    it('should use default options when none provided', async () => {
      const project = createMockProject();
      const result = await projectImportExportService.exportProject(project);

      expect(result.filename).toContain('.json');
      expect(typeof result.content).toBe('string');
    });

    it('should sanitize project name in filename', async () => {
      const project = createMockProject({ name: '项目/名称:测试' });
      const result = await projectImportExportService.exportProject(project);

      expect(result.filename).not.toContain('/');
      expect(result.filename).not.toContain(':');
      expect(result.filename).toContain('项目_名称_测试');
    });

    it('should handle ZIP format', async () => {
      const project = createMockProject();
      const result = await projectImportExportService.exportProject(project, { format: 'zip' });

      expect(result.filename).toMatch(/\.zip$/);
      // Currently ZIP just returns JSON content (placeholder implementation)
      expect(typeof result.content).toBe('string');
    });
  });

  describe('importProject', () => {
    it('should import project from valid JSON string', async () => {
      const project = createMockProject();
      const exportData = projectImportExportService.exportToJSON(project);
      const imported = await projectImportExportService.importProject(exportData);

      expect(imported.name).toBe(project.name);
      expect(imported.id).not.toBe(project.id); // New ID generated
    });

    it('should throw error for invalid JSON string', async () => {
      await expect(projectImportExportService.importProject('not valid json {')).rejects.toThrow(
        '无效的项目文件格式'
      );
    });

    // Skipped: JSDOM File.text() not natively supported
    it.skip('should import from File object', async () => {
      const project = createMockProject();
      const exportData = projectImportExportService.exportToJSON(project);
      const file = new File([exportData], 'test.json', { type: 'application/json' });

      const imported = await projectImportExportService.importProject(file);

      expect(imported.name).toBe(project.name);
    });

    // Skipped: JSDOM File.text() not natively supported
    it.skip('should throw error for invalid File object', async () => {
      const file = new File(['invalid json {'], 'test.json', { type: 'application/json' });

      await expect(projectImportExportService.importProject(file)).rejects.toThrow(
        '无效的项目文件格式'
      );
    });

    it('should throw error for unsupported version', async () => {
      const invalidVersionData = JSON.stringify({
        version: '0.1.0',
        exportedAt: new Date().toISOString(),
        project: createMockProject(),
        metadata: { appVersion: '0.1.0', format: 'json', includesMedia: false },
      });

      await expect(projectImportExportService.importProject(invalidVersionData)).rejects.toThrow(
        /版本.*不被支持/
      );
    });

    it('should skip validation when validate is false', async () => {
      const project = createMockProject();
      // Create export data with old version but skip validation
      const exportData = JSON.stringify({
        version: '0.9.0',
        exportedAt: new Date().toISOString(),
        project,
        metadata: { appVersion: '0.9.0', format: 'json', includesMedia: false },
      });

      const imported = await projectImportExportService.importProject(exportData, {
        validate: false,
      });
      expect(imported.name).toBe(project.name);
    });

    it('should reset video paths on import', async () => {
      const project = createMockProject();
      const exportData = projectImportExportService.exportToJSON(project);
      const imported = await projectImportExportService.importProject(exportData);

      expect(imported.videos![0].path).toBe('');
    });

    it('should preserve original ID when merge option is true', async () => {
      const project = createMockProject();
      const exportData = projectImportExportService.exportToJSON(project);
      const imported = await projectImportExportService.importProject(exportData, { merge: true });

      expect(imported.id).toBe(project.id);
    });
  });

  describe('validateProjectData', () => {
    it('should return valid for correct project data', () => {
      const project = createMockProject();
      const result = projectImportExportService.validateProjectData(project);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing id', () => {
      const project = createMockProject({ id: undefined as any });
      const result = projectImportExportService.validateProjectData(project);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少项目 ID');
    });

    it('should return errors for missing name', () => {
      const project = createMockProject({ name: undefined as any });
      const result = projectImportExportService.validateProjectData(project);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少项目名称');
    });

    it('should return errors for missing status', () => {
      const project = createMockProject({ status: undefined as any });
      const result = projectImportExportService.validateProjectData(project);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少项目状态');
    });

    it('should return errors for non-array videos', () => {
      const project = createMockProject({ videos: 'not an array' as any });
      const result = projectImportExportService.validateProjectData(project);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('字段 videos 应该是数组');
    });

    it('should return errors for non-array scripts', () => {
      const project = createMockProject({ scripts: 123 as any });
      const result = projectImportExportService.validateProjectData(project);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('字段 scripts 应该是数组');
    });

    it('should return multiple errors for multiple issues', () => {
      const project = { id: 123, name: 456 } as any;
      const result = projectImportExportService.validateProjectData(project);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('backupProject', () => {
    it('should create backup and return backup ID', async () => {
      const project = createMockProject();
      const backupId = await projectImportExportService.backupProject(project);

      expect(backupId).toMatch(/^mock-uuid-\d+$/);
    });

    it('should store backup in localStorage', async () => {
      const project = createMockProject();
      await projectImportExportService.backupProject(project);

      const backupContent = localStorage.getItem('kineo_backup_mock-uuid-1');
      expect(backupContent).not.toBeNull();

      const parsed = JSON.parse(backupContent!);
      expect(parsed.project.name).toBe('测试项目');
    });

    it('should add entry to backup list', async () => {
      const project = createMockProject();
      await projectImportExportService.backupProject(project);

      const backupList = projectImportExportService.getBackupList();
      expect(backupList).toHaveLength(1);
      expect(backupList[0].id).toMatch(/^mock-uuid-\d+$/);
      expect(backupList[0].projectName).toBe('测试项目');
    });

    it('should limit backups to 10', async () => {
      const projects = Array.from({ length: 15 }, (_, i) =>
        createMockProject({ id: `project-${i}`, name: `项目${i}` })
      );

      for (const project of projects) {
        await projectImportExportService.backupProject(project);
      }

      const backupList = projectImportExportService.getBackupList();
      expect(backupList).toHaveLength(10);
    });

    it('should generate correct backup filename', async () => {
      const project = createMockProject();
      await projectImportExportService.backupProject(project);

      const backupList = projectImportExportService.getBackupList();
      expect(backupList[0].filename).toMatch(/^backup_测试项目_.+\.json$/);
    });
  });

  describe('restoreBackup', () => {
    it('should return null for non-existent backup', async () => {
      const result = await projectImportExportService.restoreBackup('non-existent-id');
      expect(result).toBeNull();
    });

    it('should restore project from backup', async () => {
      const project = createMockProject();
      const backupId = await projectImportExportService.backupProject(project);

      const restored = await projectImportExportService.restoreBackup(backupId);

      expect(restored).not.toBeNull();
      expect(restored!.name).toBe(project.name);
    });

    it('should return null for corrupted backup data', async () => {
      localStorage.setItem('kineo_backup_corrupted', 'not valid json {');

      const result = await projectImportExportService.restoreBackup('corrupted');
      expect(result).toBeNull();
    });
  });

  describe('getBackupList', () => {
    it('should return empty array when no backups exist', () => {
      const list = projectImportExportService.getBackupList();
      expect(list).toEqual([]);
    });

    it('should return list of backups', async () => {
      const project = createMockProject();
      await projectImportExportService.backupProject(project);

      const list = projectImportExportService.getBackupList();
      expect(list).toHaveLength(1);
    });

    it('should include backup metadata', async () => {
      const project = createMockProject();
      await projectImportExportService.backupProject(project);

      const list = projectImportExportService.getBackupList();
      expect(list[0]).toMatchObject({
        id: 'mock-uuid-1',
        projectId: 'project-1',
        projectName: '测试项目',
        size: expect.any(Number),
        createdAt: expect.any(String),
      });
    });
  });

  describe('deleteBackup', () => {
    it('should remove backup from localStorage', async () => {
      const project = createMockProject();
      const backupId = await projectImportExportService.backupProject(project);

      projectImportExportService.deleteBackup(backupId);

      expect(localStorage.getItem('kineo_backup_mock-uuid-1')).toBeNull();
    });

    it('should remove backup from backup list', async () => {
      const project = createMockProject();
      const backupId = await projectImportExportService.backupProject(project);

      projectImportExportService.deleteBackup(backupId);

      const list = projectImportExportService.getBackupList();
      expect(list).toHaveLength(0);
    });

    it('should only delete specified backup', async () => {
      const project1 = createMockProject({ id: 'p1', name: '项目1' });
      const project2 = createMockProject({ id: 'p2', name: '项目2' });
      const backupId1 = await projectImportExportService.backupProject(project1);
      await projectImportExportService.backupProject(project2);

      projectImportExportService.deleteBackup(backupId1);

      const list = projectImportExportService.getBackupList();
      expect(list).toHaveLength(1);
      expect(list[0].projectName).toBe('项目2');
    });
  });

  describe('duplicateProject', () => {
    it('should create a copy with new ID', () => {
      const project = createMockProject();
      const duplicate = projectImportExportService.duplicateProject(project);

      expect(duplicate.id).not.toBe(project.id);
      expect(duplicate.id).toMatch(/^mock-uuid-\d+$/);
    });

    it('should use custom name when provided', () => {
      const project = createMockProject();
      const duplicate = projectImportExportService.duplicateProject(project, '自定义名称');

      expect(duplicate.name).toBe('自定义名称');
    });

    it('should append (副本) to name when no custom name provided', () => {
      const project = createMockProject();
      const duplicate = projectImportExportService.duplicateProject(project);

      expect(duplicate.name).toBe('测试项目 (副本)');
    });

    it('should update timestamps', () => {
      const project = createMockProject();
      const originalCreatedAt = project.createdAt;

      const duplicate = projectImportExportService.duplicateProject(project);

      expect(duplicate.createdAt).not.toBe(originalCreatedAt);
      expect(new Date(duplicate.updatedAt).getTime()).toBeGreaterThan(0);
    });

    it('should deep copy videos array', () => {
      const project = createMockProject();
      const duplicate = projectImportExportService.duplicateProject(project);

      expect(duplicate.videos).toHaveLength(project.videos!.length);
      expect(duplicate.videos![0].id).toBe(project.videos![0].id); // Same video, new copy
      expect(duplicate.videos).not.toBe(project.videos); // Different array reference
    });

    it('should regenerate script IDs', () => {
      const project = createMockProject();
      const duplicate = projectImportExportService.duplicateProject(project);

      expect(duplicate.scripts![0].id).not.toBe(project.scripts![0].id);
      expect(duplicate.scripts![0].id).toMatch(/^mock-uuid-\d+$/);
    });
  });

  describe('compareProjects', () => {
    it('should return identical=true when projects match', () => {
      const project1 = createMockProject();
      const project2 = createMockProject();

      const result = projectImportExportService.compareProjects(project1, project2);

      expect(result.identical).toBe(true);
      expect(result.differences).toHaveLength(0);
    });

    it('should detect name differences', () => {
      const project1 = createMockProject({ name: '项目A' });
      const project2 = createMockProject({ name: '项目B' });

      const result = projectImportExportService.compareProjects(project1, project2);

      expect(result.identical).toBe(false);
      expect(result.differences).toContain('名称: "项目A" -> "项目B"');
    });

    it('should detect status differences', () => {
      const project1 = createMockProject({ status: 'draft' });
      const project2 = createMockProject({ status: 'completed' });

      const result = projectImportExportService.compareProjects(project1, project2);

      expect(result.identical).toBe(false);
      expect(result.differences).toContain('状态: "draft" -> "completed"');
    });

    it('should detect description changes', () => {
      const project1 = createMockProject({ description: '旧描述' });
      const project2 = createMockProject({ description: '新描述' });

      const result = projectImportExportService.compareProjects(project1, project2);

      expect(result.differences).toContain('描述已修改');
    });

    it('should detect video count differences', () => {
      const project1 = createMockProject({ videos: [{ id: 'v1', name: '视频1' }] });
      const project2 = createMockProject({
        videos: [
          { id: 'v1', name: '视频1' },
          { id: 'v2', name: '视频2' },
        ],
      });

      const result = projectImportExportService.compareProjects(project1, project2);

      expect(result.differences).toContain('视频数量: 1 -> 2');
    });

    it('should detect script count differences', () => {
      const project1 = createMockProject({
        scripts: [
          {
            id: 's1',
            title: '脚本1',
            content: '内容1',
            segments: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
      const project2 = createMockProject({
        scripts: [],
      });

      const result = projectImportExportService.compareProjects(project1, project2);

      expect(result.differences).toContain('脚本数量: 1 -> 0');
    });

    it('should track multiple differences', () => {
      const project1 = createMockProject({ name: 'A', status: 'draft' });
      const project2 = createMockProject({ name: 'B', status: 'completed' });

      const result = projectImportExportService.compareProjects(project1, project2);

      expect(result.identical).toBe(false);
      expect(result.differences.length).toBeGreaterThanOrEqual(2);
    });
  });
});
