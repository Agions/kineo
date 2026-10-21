/**
 * Project import/export types — extracted from project-import-export-service.ts
 */

import type { ProjectData } from '@/core/types';

/** 导出格式 */
export type ExportFormat = 'json' | 'zip';

/** 项目导出数据包 */
export interface ProjectExportData {
  version: string;
  exportedAt: string;
  project: ProjectData;
  metadata: {
    appVersion: string;
    format: ExportFormat;
    includesMedia: boolean;
  };
}

/** 导入选项 */
export interface ImportOptions {
  merge?: boolean;
  overwrite?: boolean;
  validate?: boolean;
}

/** 导出选项 */
export interface ExportOptions {
  format: ExportFormat;
  includeMedia?: boolean;
  compress?: boolean;
  includeHistory?: boolean;
}

/** 备份元信息 */
export interface BackupRecord {
  id: string;
  filename: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  size: number;
}

/** 项目比较结果 */
export interface ProjectComparison {
  identical: boolean;
  differences: string[];
}

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** 字段差分构造器签名 */
export type DiffBuilder = (a: ProjectData, b: ProjectData) => string | null;