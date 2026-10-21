/**
 * StepActions — 步骤导航按钮（上一步/下一步）
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/common/utils/class-names';

interface StepActionsProps {
  onPrev?: () => void;
  onNext?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  className?: string;
}

export function StepActions({
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
  prevLabel = '上一步',
  nextLabel = '下一步',
  nextDisabled = false,
  className,
}: StepActionsProps) {
  return (
    <div className={cn('flex items-center justify-between border-t pt-4', className)}>
      {onPrev ? (
        <Button variant="outline" onClick={onPrev} disabled={!canPrev}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          {prevLabel}
        </Button>
      ) : (
        <div />
      )}
      {onNext ? (
        <Button onClick={onNext} disabled={!canNext || nextDisabled}>
          {nextLabel}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
