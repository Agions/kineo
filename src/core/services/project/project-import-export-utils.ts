/**
 * Project import/export pure utility functions — extracted
 */

import type { ProjectData } from '@/core/types';

import type {
  BackupRecord,
  DiffBuilder,
  ExportFormat,
  ProjectComparison,
} from './project-import-export-types';

/** 解析版本号 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major: major ?? 0, minor: minor ?? 0, patch: patch ?? 0 };
}

/** 当前 ISO 时间戳 */
export function nowIso(): string {
  return new Date().toISOString();
}

/** 生成导出文件名 */
export function generateExportFilename(projectName: string, format: ExportFormat): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  const safe = projectName.replace(/[^a-zA-Z0-9一-龥]/g, '_');
  return `kineo_${safe}_${timestamp}.${format}`;
}

/** 生成备份文件名 */
export function generateBackupFilename(projectName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `backup_${projectName}_${timestamp}.json`;
}

/** 比较两个项目的差异 */
export function compareProjects(
  project1: ProjectData,
  project2: ProjectData,
  diffBuilders: DiffBuilder[]
): ProjectComparison {
  const differences: string[] = [];
  for (const builder of diffBuilders) {
    const diff = builder(project1, project2);
    if (diff) differences.push(diff);
  }
  return { identical: differences.length === 0, differences };
}

/** 默认差分构造器集 */
export const DIFF_BUILDERS: DiffBuilder[] = [
  (a, b) => (a.name !== b.name ? `名称: "${a.name}" -> "${b.name}"` : null),
  (a, b) => (a.status !== b.status ? `状态: "${a.status}" -> "${b.status}"` : null),
  (a, b) => (a.description !== b.description ? '描述已修改' : null),
  (a, b) =>
    a.videos!.length !== b.videos!.length
      ? `视频数量: ${a.videos!.length} -> ${b.videos!.length}`
      : null,
  (a, b) =>
    a.scripts!.length !== b.scripts!.length
      ? `脚本数量: ${a.scripts!.length} -> ${b.scripts!.length}`
      : null,
];

/** 构造一条备份索引条目 */
export function buildBackupRecord(
  id: string,
  filename: string,
  projectId: string,
  projectName: string,
  content: string
): BackupRecord {
  return { id, filename, projectId, projectName, createdAt: nowIso(), size: content.length };
}
