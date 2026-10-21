/**
 * StepActions — shared prev/next action buttons for pipeline steps.
 *
 * Canonical home for the prev/next footer that every step component was
 * re-implementing by hand (see `StepImport`, `StepAnalysis`, `StepAudio`,
 * `StepExport`, and the local `pages/project-edit/components/StepActions`).
 *
 * Features over the legacy local version:
 *  - `nextDisabled` support (e.g. prerequisite not met)
 *  - optional `secondary` node for a left-aligned action area
 *  - hides a button entirely when its handler is omitted
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/common/utils/class-names';

export interface StepActionsProps {
  /** Prev-button handler. When omitted the prev button is hidden. */
  onPrev?: () => void;
  /** Next-button handler. When omitted the next button is hidden. */
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  /** Disable the next button (e.g. prerequisite not met). */
  nextDisabled?: boolean;
  /** Optional node rendered in the left action area (e.g. a danger button). */
  secondary?: React.ReactNode;
  /** Additional className merged onto the footer wrapper. */
  className?: string;
}

export function StepActions({
  onPrev,
  onNext,
  prevLabel = '上一步',
  nextLabel = '下一步',
  nextDisabled = false,
  secondary,
  className,
}: StepActionsProps) {
  // Render nothing if there is nothing to do.
  if (!onPrev && !onNext && !secondary) return null;

  return (
    <div
      className={cn(
        'mt-6 flex items-center justify-between border-t border-border/60 pt-4',
        className
      )}
    >
      <div>{secondary}</div>
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
  );
}

export default StepActions;
