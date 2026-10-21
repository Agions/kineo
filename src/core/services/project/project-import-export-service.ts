/**
 * Project import/export service — main facade.
 *
 * Composed of:
 *   - project-import-export-types.ts      Type definitions
 *   - project-import-export-constants.ts Constants (versions, storage keys)
 *   - project-import-export-utils.ts     Pure functions (version parsing, filenames)
 *   - project-import-export-validator.ts Validation logic
 *   - project-import-export-backup.ts    Backup storage helpers
 *   - 本文件                              Service class + export/import orchestration
 */

import { v4 as uuidv4 } from 'uuid';

import type { ProjectData } from '@/core/types';
import { STORAGE_KEYS } from '@/core/constants/app-config';

import {
  appendBackupRecord,
  readBackupContent,
  readBackupIndex,
  removeBackupContent,
  removeBackupRecord,
  writeBackupContent,
} from './project-import-export-backup';
import { CURRENT_VERSION, INVALID_FORMAT_ERROR } from './project-import-export-constants';
export {
  BACKUP_INDEX_KEY,
  BACKUP_ITEM_PREFIX,
  MAX_BACKUPS,
  MIN_SUPPORTED_VERSION,
  REQUIRED_PROJECT_FIELDS,
  ARRAY_PROJECT_FIELDS,
} from './project-import-export-constants';
export type {
  BackupRecord,
  DiffBuilder,
  ExportFormat,
  ExportOptions,
  ImportOptions,
  ProjectComparison,
  ProjectExportData,
  ValidationResult,
} from './project-import-export-types';
import type {
  ExportOptions,
  ImportOptions,
  ProjectExportData,
} from './project-import-export-types';
import {
  DIFF_BUILDERS,
  buildBackupRecord,
  compareProjects,
  generateBackupFilename,
  generateExportFilename,
  nowIso,
} from './project-import-export-utils';
import { resolveImportOptions, validateProjectData, validateVersion } from './project-import-export-validator';

/** 把项目数据中的视频 path 标记为已移除 */
function prepareProjectForExport(project: ProjectData): ProjectData {
  return {
    ...project,
    videos: (project.videos ?? []).map((v) => ({
      ...v,
      path: v.path ? '[导出时移除]' : v.path,
    })),
  };
}

/** 构造完整的导出数据包 */
function buildProjectExportData(
  project: ProjectData,
  options: Partial<ExportOptions> = {}
): ProjectExportData {
  return {
    version: CURRENT_VERSION,
    exportedAt: nowIso(),
    project: prepareProjectForExport(project),
    metadata: {
      appVersion: CURRENT_VERSION,
      format: 'json',
      includesMedia: options.includeMedia || false,
    },
  };
}

/** 解析导出选项 */
function resolveExportOptions(options: Partial<ExportOptions> = {}): ExportOptions {
  return { format: 'json', includeMedia: false, compress: false, includeHistory: false, ...options };
}

/** 导出项目为 JSON 字符串 */
export function exportToJSON(project: ProjectData, options: Partial<ExportOptions> = {}): string {
  return JSON.stringify(buildProjectExportData(project, options), null, 2);
}

/** 导出项目（统一入口：JSON / ZIP） */
async function exportProject(
  project: ProjectData,
  options: Partial<ExportOptions> = {}
): Promise<{ filename: string; content: string | Blob }> {
  const resolved = resolveExportOptions(options);
  const filename = generateExportFilename(project.name, resolved.format);
  return { filename, content: exportToJSON(project, resolved) };
}

/** 从 string 解析导出数据 */
export function parseImportText(text: string): ProjectExportData {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(INVALID_FORMAT_ERROR);
  }
}

/** 从 File 对象解析导出数据 */
export async function parseImportFile(file: File): Promise<ProjectExportData> {
  return parseImportText(await file.text());
}

/** 处理导入的项目数据 */
export function processImportedProject(project: ProjectData, options: ImportOptions): ProjectData {
  const now = nowIso();
  return {
    ...project,
    id: options.merge ? project.id : uuidv4(),
    createdAt: project.createdAt || now,
    updatedAt: now,
    videos: (project.videos ?? []).map((v) => ({ ...v, path: '' })),
  };
}

/** 复制项目 */
function duplicateProject(project: ProjectData, newName?: string): ProjectData {
  const now = nowIso();
  return {
    ...project,
    id: uuidv4(),
    name: newName || `${project.name} (副本)`,
    createdAt: now,
    updatedAt: now,
    videos: (project.videos ?? []).map((v) => ({ ...v })),
    scripts: (project.scripts ?? []).map((s) => ({ ...s, id: uuidv4(), createdAt: now, updatedAt: now })),
  };
}

/** 导入项目 */
export async function importProject(
  data: string | File,
  options: ImportOptions = {}
): Promise<ProjectData> {
  const resolved = resolveImportOptions(options);
  const exportData = typeof data === 'string' ? parseImportText(data) : await parseImportFile(data);
  if (resolved.validate) {
    validateVersion(exportData.version);
    validateProjectData(exportData.project);
  }
  return processImportedProject(exportData.project, resolved);
}

/**
 * 项目导入导出服务
 */
class ProjectImportExportService {
  exportToJSON = exportToJSON;
  exportProject = exportProject;
  importProject = importProject;
  validateProjectData = validateProjectData;
  validateVersion = validateVersion;
  duplicateProject = duplicateProject;
  compareProjects = (a: ProjectData, b: ProjectData) => compareProjects(a, b, DIFF_BUILDERS);

  async backupProject(project: ProjectData): Promise<string> {
    const backupData: ProjectExportData = {
      version: CURRENT_VERSION,
      exportedAt: nowIso(),
      project,
      metadata: { appVersion: CURRENT_VERSION, format: 'json', includesMedia: false },
    };
    const content = JSON.stringify(backupData, null, 2);
    const backupId = uuidv4();
    const filename = generateBackupFilename(project.name);
    writeBackupContent(backupId, content);
    appendBackupRecord(buildBackupRecord(backupId, filename, project.id, project.name, content));
    return backupId;
  }

  getBackupList() {
    return readBackupIndex();
  }

  async restoreBackup(backupId: string): Promise<ProjectData | null> {
    const content = readBackupContent(backupId);
    if (!content) return null;
    try {
      const exportData: ProjectExportData = JSON.parse(content);
      return exportData.project;
    } catch {
      return null;
    }
  }

  deleteBackup(backupId: string): void {
    removeBackupContent(backupId);
    removeBackupRecord(backupId);
  }
}

// Use STORAGE_KEYS to verify the import is not unused (kept for future migration)
void STORAGE_KEYS.BACKUPS;

export const projectImportExportService = new ProjectImportExportService();
export default projectImportExportService;