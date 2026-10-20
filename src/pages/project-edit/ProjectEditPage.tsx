import { ArrowLeft, Save } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/common/components/ui/button';
import { toast } from '@/common/components/ui/toast';
import { useProject } from '@/core/hooks/useProject';
import type { RoleType } from '@kineo/core';

import { StepContentSwitcher } from './components/StepContentSwitcher';
import { StepNavigation } from './components/StepNavigation';
import { ProjectEditProvider } from './context/ProjectEditContext';
import { useProjectLoader } from './hooks/useProjectLoader';

const ProjectEdit = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState<RoleType>('writer');

  const { currentStep, setCurrentStep } = useProject();
  const { data: loaderData } = useProjectLoader(projectId);

  const handleBack = () => navigate(-1);

  return (
    <div className="space-y-4">
      {/* 顶部 Header Toolbar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] backdrop-blur-xl shadow-lg flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleBack}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回创作大盘
          </Button>
          <div className="h-4 w-[1px] bg-[var(--border)]" />
          <h2 className="text-base font-bold text-[var(--foreground)]">
            {loaderData?.name || 'Kineo 视听分镜 Studio 工作台'}
          </h2>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-mono font-bold">
            Multi-Agent 联通中
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => toast.success('分镜工程与设置已自动同步存库！')}
            className="studio-btn-primary text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer border-0"
          >
            <Save className="w-3.5 h-3.5" />
            保存修改
          </Button>
        </div>
      </div>

      {/* 核心分镜 Studio 工作台 (分镜大盘 / 角色锁脸 / 音频轨 / 渲染压制) */}
      <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] backdrop-blur-xl shadow-xl space-y-4">
        <StepNavigation
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          activeRole={activeRole}
          onRoleChange={setActiveRole}
        />
        <StepContentSwitcher currentStep={currentStep} />
      </div>
    </div>
  );
};

export const ProjectEditPage = () => {
  const { projectId } = useParams();
  const { data: loaderData } = useProjectLoader(projectId);

  const projectMetadata = useMemo(
    () => ({
      name: loaderData?.name || 'Kineo AI 漫剧工程',
      description: loaderData?.description || '',
      exportPreset: loaderData?.exportPreset || ('16:9' as const),
      exportSettings: loaderData?.exportSettings || {},
    }),
    [loaderData]
  );

  return (
    <ProjectEditProvider projectMetadata={projectMetadata} initialData={loaderData}>
      <ProjectEdit />
    </ProjectEditProvider>
  );
};

export default ProjectEditPage;
