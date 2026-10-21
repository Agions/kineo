/**
 * 成本面板
 * 包含导出评审记录按钮 + CostDashboard
 */

import { Download } from 'lucide-react';
import React, { Suspense } from 'react';

import CostDashboard from '@/common/components/business/CostDashboard';
import { Button } from '@/components/ui/button';
import { Spin } from '@/components/ui/spin';

export interface CostPanelProps {
  projectId: string | undefined;
  /** 触发导出评审记录的回调 */
  onExportReviewNotes: () => void;
}

export const CostPanel: React.FC<CostPanelProps> = ({ projectId, onExportReviewNotes }) => {
  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Button icon={<Download />} onClick={onExportReviewNotes}>
          导出评审记录
        </Button>
      </div>
      <Suspense fallback={<Spin />}>
        <CostDashboard projectId={projectId} />
      </Suspense>
    </>
  );
};
