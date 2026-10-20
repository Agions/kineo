/**
 * WorkflowPage.tsx — Kineo Multi-Agent 漫剧创作工作台
 * 移除基于 SOP 的旧版线性处理流程，使用基于黑板模式 (Blackboard / Shared State) 的多智能体 (Multi-Agent) 协作系统。
 */

import React from 'react';

import { MultiAgentStudio } from '@/features/agent/components/MultiAgentStudio';

export const WorkflowPage: React.FC = () => {
  return <MultiAgentStudio />;
};

export default WorkflowPage;
