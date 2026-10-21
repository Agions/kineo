/**
 * StepLayout — layout wrapper for pipeline step components.
 *
 * Consolidates the repeated card-shell pattern found in every step component
 * under `src/pages/project-edit/components/Step*.tsx` (StepImport, StepScript,
 * StepCharacter, StepRender, StepComposition, StepAudio, StepExport, …):
 *
 *   <Card>
 *     <CardHeader>
 *       <CardTitle><Icon /> Title</CardTitle>
 *     </CardHeader>
 *     <CardContent>
 *       <p>Description</p>
 *       {children}
 *       <StepActions onPrev onNext />
 *     </CardContent>
 *   </Card>
 *
 * Each step was re-implementing this shell (including the prev/next footer) by
 * hand. StepLayout provides it once with a clean prop API so step components
 * only supply their unique content.
 */

import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/common/utils/class-names';

export interface StepLayoutProps {
  /** Icon shown beside the title (e.g. a lucide icon node). */
  icon?: React.ReactNode;
  /** Step title text. */
  title: string;
  /** Optional description rendered between the title and the content. */
  description?: React.ReactNode;
  /** Step-specific content. */
  children: React.ReactNode;
  /** Optional extra node rendered at the right of the header (e.g. a badge or button). */
  headerExtra?: React.ReactNode;
  /** Show the prev/next footer. Defaults to true. */
  showActions?: boolean;
  /** Prev-button handler. When omitted the prev button is hidden. */
  onPrev?: () => void;
  /** Next-button handler. When omitted the next button is hidden. */
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  /** Disable the next button (e.g. prerequisite not met). */
  nextDisabled?: boolean;
  /** Additional className merged onto the root Card. */
  className?: string;
}

export function StepLayout({
  icon,
  title,
  description,
  children,
  headerExtra,
  showActions = true,
  onPrev,
  onNext,
  prevLabel = '上一步',
  nextLabel = '下一步',
  nextDisabled = false,
  className,
}: StepLayoutProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </CardTitle>
        {headerExtra}
      </CardHeader>
      <CardContent>
        {description && <p className="mb-4 text-sm text-muted-foreground">{description}</p>}
        {children}
        {showActions && (onPrev || onNext) && (
          <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
            <div>{/* left spacer — reserved for future secondary actions */}</div>
            <div className="flex gap-2">
              {onPrev && (
                <Button variant="outline" onClick={onPrev}>
                  {prevLabel}
                </Button>
              )}
              {onNext && (
                <Button variant="default" onClick={onNext} disabled={nextDisabled}>
                  {nextLabel}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StepLayout;
