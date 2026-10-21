import {
  Image,
  User,
  Volume2,
  PenTool,
  Palette,
  Film,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import ModelConfigGuardModal from '@/features/model-selector/components/ModelConfigGuardModal';
import { toast } from '@/components/ui/toast';
import { hasAnyConfiguredModelProvider } from '@/core/config/model-providers';
import { secureStorage } from '@/core/services/project/secure-storage-service';
import { RoleType, WorkflowEngine } from '@kineo/core';
import { StatusBadge } from '@kineo/ui';

interface StepDefinition {
  key: string;
  title: string;
  role: RoleType;
  icon: LucideIcon;
}

const STEPS: StepDefinition[] = [
  { key: 'planning', title: '1. 策划设定 (角色锁脸)', role: 'writer', icon: User },
  { key: 'visuals', title: '2. 画面生成 (分镜大盘)', role: 'storyboarder', icon: Image },
  { key: 'motion', title: '3. 动态合成 (运镜与转场)', role: 'animator', icon: Film },
  { key: 'audio', title: '4. 声音后期 (TTS与导出)', role: 'animator', icon: Volume2 },
];

const ROLES: { key: RoleType; label: string; icon: LucideIcon; desc: string }[] = [
  { key: 'writer', label: '编剧', icon: PenTool, desc: '剧本拆解与大纲' },
  { key: 'storyboarder', label: '分镜师', icon: Palette, desc: '画面与角色设定' },
  { key: 'animator', label: '制作师', icon: Film, desc: '音画合成与渲染' },
  { key: 'auditor', label: '审核员', icon: ShieldCheck, desc: '质检评估与打回' },
];

const CHECKPOINTABLE_STEP_IDS = [
  'step-import',
  'step-analysis',
  'step-script',
  'step-storyboard',
  'step-character',
  'step-render',
  'step-video-editing',
  'step-export',
] as const;

interface StepNavigationProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  activeRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  projectId?: string;
}

interface CheckpointStatus {
  completed: boolean;
}

/** 项目编辑页角色导航与极简步骤指示器 */
export function StepNavigation({
  currentStep,
  onStepChange,
  activeRole,
  onRoleChange,
  projectId,
}: StepNavigationProps) {
  const [isModelGuardOpen, setIsModelGuardOpen] = useState(false);

  const [checkpointStatuses, setCheckpointStatuses] = useState<Map<string, CheckpointStatus>>(
    new Map()
  );

  useEffect(() => {
    if (!projectId) return;
    const statuses = new Map<string, CheckpointStatus>();
    CHECKPOINTABLE_STEP_IDS.forEach(async (stepId) => {
      const cp = await secureStorage.loadCheckpoint(stepId);
      statuses.set(stepId, { completed: cp?.completed ?? false });
      setCheckpointStatuses(new Map(statuses));
    });
  }, [projectId]);

  const handleStepClick = (index: number) => {
    // 门禁校验：进入 AI 步骤前检查 API Key 配置
    if (index >= 1 && !hasAnyConfiguredModelProvider()) {
      toast.error('⚠️ 未检测到有效 AI 模型 API Key！无法使用 AI 增强服务。');
      setIsModelGuardOpen(true);
      return;
    }

    onStepChange(index);
  };

  const roleStepIndices = WorkflowEngine.getRoleStepIndices(activeRole);

  return (
    <div className="mb-6 space-y-3">
      {/* 角色视角切换栏 Role Switcher */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isActive = activeRole === r.key;
            return (
              <button
                key={r.key}
                onClick={() => onRoleChange(r.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40'
                    : 'bg-slate-950/40 hover:bg-slate-800/80 text-slate-300 border border-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
        <StatusBadge
          status={activeRole === 'auditor' ? 'warning' : 'info'}
          label={`当前模式: ${WorkflowEngine.getRoleName(activeRole)}`}
          size="sm"
        />
      </div>

      {/* 极简步骤导航 Steps */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = index === currentStep;
          const isFinal = index < currentStep;
          const isRelevantToRole = roleStepIndices.includes(index);
          const isCheckpointed = checkpointStatuses.has(CHECKPOINTABLE_STEP_IDS[index]);
          const hasCheckpoint =
            isCheckpointed && checkpointStatuses.get(CHECKPOINTABLE_STEP_IDS[index])?.completed;

          return (
            <div
              key={step.key}
              onClick={() => handleStepClick(index)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all border text-xs font-medium relative ${
                isCurrent
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 font-semibold'
                  : isFinal
                    ? 'bg-slate-900/80 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60'
                    : isRelevantToRole
                      ? 'bg-slate-900/60 text-slate-200 border-indigo-500/30 hover:border-indigo-500/50'
                      : 'bg-slate-950/40 text-slate-500 border-slate-800/60 hover:text-slate-400'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : isFinal ? 'text-emerald-400' : ''}`}
              />
              <span>{step.title}</span>
              {hasCheckpoint && (
                <span
                  className="w-2 h-2 rounded-full bg-indigo-400 border border-slate-900"
                  title="断点已保存"
                />
              )}
            </div>
          );
        })}
      </div>

      <ModelConfigGuardModal
        isOpen={isModelGuardOpen}
        onClose={() => setIsModelGuardOpen(false)}
      />
    </div>
  );
}
