import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [activeRole, setActiveRole] = useState<RoleType>('writer');

  const { currentStep, setCurrentStep } = useProject();
  const { data: loaderData } = useProjectLoader(projectId);

  const latestAudit = (loaderData?.auditReports as any[])?.slice(-1)[0];

  // 响应 URL 参数中的 ?step= 自动同步至对应分镜大盘与步骤
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam !== null) {
      const parsed = parseInt(stepParam, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) {
        setCurrentStep(parsed);
      }
    }
  }, [searchParams, setCurrentStep]);

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
          {latestAudit && (
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-bold flex items-center gap-1 ${
                latestAudit.passed
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              AUDIT: {latestAudit.overallScore}分 ({latestAudit.passed ? '达标' : '优化中'})
            </span>
          )}
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
