/**
 * Kineo Shared Utils - Format UI Utilities
 *
 * Provides UI-specific formatting utilities including status config,
 * relative time formatting, and date formatting.
 */

/**
 * Project status types
 */
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

/**
 * Status configuration for project display
 */
export interface StatusConfig {
  variant:
    | 'secondary'
    | 'default'
    | 'success'
    | 'destructive'
    | 'outline'
    | 'warning'
    | 'info'
    | 'gold'
    | 'error'
    | 'processing'
    | null
    | undefined;
  text: string;
}

/**
 * Status configuration mapping
 */
export const STATUS_CONFIG: Record<ProjectStatus, StatusConfig> = {
  draft: {
    variant: 'secondary',
    text: '草稿',
  },
  processing: {
    variant: 'default',
    text: '处理中',
  },
  completed: {
    variant: 'success',
    text: '已完成',
  },
  failed: {
    variant: 'destructive',
    text: '失败',
  },
};

/**
 * Get status configuration by status value
 */
export function getStatusConfig(status: ProjectStatus): StatusConfig {
  return STATUS_CONFIG[status] || STATUS_CONFIG.draft;
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string | number,
  options?: { format?: 'date' | 'datetime' | 'time' }
): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');

  const fmt = options?.format || 'date';
  if (fmt === 'datetime') return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  if (fmt === 'time') return `${hours}:${minutes}:${seconds}`;
  return `${year}-${month}-${day}`;
}

/**
 * Format date in short format (e.g., "1月1日")
 */
export function formatDateShort(date: Date | string | number): string {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}月${day}日`;
}
