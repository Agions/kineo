/**
 * GenerationResult — standardized wrapper for AI generation output.
 *
 * Provides a consistent "result card" look across steps that show generated
 * content (script generation, analysis results, render output, etc.):
 *   - a header bar with a status icon + title + optional extra actions
 *   - an inner content area for the generated payload
 *   - optional footer actions (save / regenerate / edit)
 */

import type { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/common/utils/class-names';

export type GenerationResultStatus = 'idle' | 'generating' | 'done' | 'error';

export interface GenerationResultProps {
  title: string;
  /** Status icon shown beside the title (defaults to a check circle when done). */
  icon?: LucideIcon;
  status?: GenerationResultStatus;
  /** Optional node rendered at the right of the header (e.g. action buttons). */
  extra?: React.ReactNode;
  /** Footer actions rendered below the content. */
  footer?: React.ReactNode;
  /** Generating-state loading spinner/text override. */
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}

export function GenerationResult({
  title,
  icon: Icon,
  status = 'idle',
  extra,
  footer,
  loadingText = '正在生成...',
  children,
  className,
}: GenerationResultProps) {
  const renderIcon = () => {
    if (Icon) return <Icon className="h-5 w-5" />;
    if (status === 'done')
      return <span className="inline-block h-2 w-2 rounded-full bg-green-500" />;
    return null;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {renderIcon()}
          {title}
        </CardTitle>
        {extra}
      </CardHeader>
      <CardContent>
        {status === 'generating' && (
          <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            {loadingText}
          </div>
        )}
        {children}
        {footer && <div className="mt-4 flex gap-2">{footer}</div>}
      </CardContent>
    </Card>
  );
}

export default GenerationResult;
