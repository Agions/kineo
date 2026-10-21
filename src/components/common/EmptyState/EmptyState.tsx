/**
 * EmptyState — cross-domain reusable empty state component.
 *
 * Consolidates the duplicated empty-state patterns found across features:
 *   - `src/shared/components/ui/empty.tsx` (primitive — type-based icons + action)
 *   - `src/features/project/components/ProjectListView.tsx` (uses shared EmptyState)
 *   - `src/features/home/components/ProjectGrid.tsx` (inline text + button)
 *   - `src/features/storyboard/components/SceneRenderer/components/SceneList.tsx`
 *     (uses shared Empty with custom className)
 *   - `src/features/notification/components/NotificationCenter.tsx` (uses shared EmptyState)
 *   - `src/features/storyboard/components/StoryboardEditor.tsx` (inline canvas/property empties)
 *
 * Improvements over the scattered versions:
 *   - Single `icon` slot (ReactNode) instead of a closed `type` enum — consumers
 *     can pass any icon or illustration without being limited to project/file presets.
 *   - Optional `action` button renders the shared Button primitive for a consistent look.
 *   - Optional `children` slot keeps flexibility for extra content (lists, links, etc.).
 *   - Fully Tailwind-driven with `cn` for class merging.
 */

import { Plus } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/common/utils/class-names';

export interface EmptyStateProps {
  /** Main heading. Defaults to "暂无内容". */
  title?: string;
  /** Secondary description text. */
  description?: string;
  /** Custom icon / illustration slot. Overrides the default icon area when provided. */
  icon?: React.ReactNode;
  /** When false, no icon (default or custom) is rendered. Defaults to true. */
  showIcon?: boolean;
  /** Preset icon style when no custom `icon` is supplied. */
  variant?: 'default' | 'project' | 'file';
  /** Optional action button rendered below the description. */
  action?: {
    text: string;
    onClick: () => void;
  };
  /** Extra content rendered between description and action (e.g. extra links, lists). */
  children?: React.ReactNode;
  /** Additional className merged onto the root container. */
  className?: string;
}

const DEFAULT_TITLE = '暂无内容';

export function EmptyState({
  title = DEFAULT_TITLE,
  description,
  icon,
  showIcon = true,
  variant = 'default',
  action,
  children,
  className,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!showIcon) return null;
    if (icon) return icon;

    // Preset icons per variant (replaces the closed enum in shared/empty.tsx).
    switch (variant) {
      case 'project':
        return (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
          </div>
        );
      case 'file':
        return (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center gap-4 px-4 py-12 text-center',
        className
      )}
    >
      {renderIcon()}
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
      {action && (
        <Button onClick={action.onClick} className="mt-1">
          <Plus className="h-4 w-4" />
          {action.text}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
