/**
 * Kineo Shared Utils - Async Error Handling Utilities
 */

import { toast } from '@/components/ui/toast';

import { logger } from './logger';

/**
 * Standardized error handler: logs + shows toast.
 * Use inside catch blocks that need both logging and user feedback.
 *
 * @example
 * try { ... } catch (error) {
 *   handleAsyncError(error, '保存项目失败', { toastMessage: '保存失败，请稍后再试' });
 * }
 */
export function handleAsyncError(
  error: unknown,
  context: string,
  options?: { toastMessage?: string }
): void {
  logger.error(context, error);
  toast.error(options?.toastMessage ?? context);
}
