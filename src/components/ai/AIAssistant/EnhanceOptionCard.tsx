import React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EnhanceOptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onApply?: () => void;
  applyLabel?: string;
}

/**
 * One-card "AI enhance" action tile used in AIAssistant's enhance tab.
 *
 * Encapsulates the `<enhanceOption>` wrapper + `<enhanceCard>` + icon/title/desc/apply button
 * pattern that was duplicated 4 times (画质提升 / 色彩优化 / 音频降噪 / 智能特效).
 */
export function EnhanceOptionCard({
  icon,
  title,
  description,
  onApply,
  applyLabel = '应用',
}: EnhanceOptionCardProps) {
  return (
    <div className="enhanceOption">
      <Card className="enhanceCard">
        {icon}
        <div className="enhanceTitle">{title}</div>
        <div className="enhanceDesc">{description}</div>
        <Button size="sm" className="enhanceButton" onClick={onApply}>
          {applyLabel}
        </Button>
      </Card>
    </div>
  );
}
