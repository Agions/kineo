/**
 * MultiAgentStudio.tsx — Multi-Agent Director 2.0 工业级智能体协同与质检工作台
 *
 * 特性：
 * 1. 动态 DAG 拓扑执行流进度感知与节点状态追踪 (Pending / Running / Healing / Completed)。
 * 2. 独立质量审计总监 (Quality Auditor) 四维记分卡与批评自愈回环可视化。
 * 3. 全息角色 DNA 与机位空间防穿帮矩阵监控。
 * 4. 共享黑板 ProjectBlackboard 实时通信与思考流。
 */

import {
  Bot,
  Zap,
  Plus,
  FileText,
  Clapperboard,
  Terminal,
  Activity,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Film,
  FolderOpen,
  Loader2,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import AgentConfigModal from './AgentConfigModal';
import ModelConfigGuardModal from '@/features/model-selector/components/ModelConfigGuardModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { useProjectStore } from '@/stores';
import { hasAnyConfiguredModelProvider } from '@/core/config/model-providers';
import { agentRegistry } from '@/core/services/agent/AgentRegistry';
import type { BaseAgent } from '@/core/services/agent/BaseAgent';
import { MasterDirectorAgent } from '@/core/services/agent/MasterDirectorAgent';
import type { BlackboardData, InputContentType } from '@/core/services/agent/ProjectBlackboard';
import {
  PlayableMangaPipelineService,
  type PlayablePipelineProgress,
} from '@/core/services/pipeline/PlayableMangaPipelineService';
import { tauriService } from '@/infrastructure/tauri-bridge';

export const MultiAgentStudio: React.FC = () => {
  const navigate = useNavigate();
  const store = useProjectStore();

  const [rawInput, setRawInput] = useState<string>('');
  const [inputType, setInputType] = useState<InputContentType>('novel_text');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isModelGuardOpen, setIsModelGuardOpen] = useState(false);
  const [isAgentConfigModalOpen, setIsAgentConfigModalOpen] = useState(false);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderProgress, setRenderProgress] = useState<PlayablePipelineProgress | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [renderedVideoMeta, setRenderedVideoMeta] = useState<{
    videoPath: string;
    videoUri: string;
    duration: number;
    fileSize: number;
    encoderUsed?: string;
  } | null>(null);

  // 实例化 MasterDirectorAgent 调度中心
  const [director] = useState(() => new MasterDirectorAgent());
  const [blackboardData, setBlackboardData] = useState<BlackboardData>(() =>
    director.getBlackboard().getData()
  );

  // 获取所有已注册 Agent（包含原生 + 自定义）
  const [registeredAgents, setRegisteredAgents] = useState<BaseAgent[]>(() =>
    agentRegistry.getAll()
  );

  const refreshAgents = () => {
    setRegisteredAgents(agentRegistry.getAll());
  };

  useEffect(() => {
    // 订阅 Blackboard 共享黑板数据变更
    const unsubscribe = director.getBlackboard().subscribe((data) => {
      setBlackboardData(data);
    });
    return () => unsubscribe();
  }, [director]);

  // 校验模型配置
  const checkModelConfigGate = (): boolean => {
    if (!hasAnyConfiguredModelProvider()) {
      toast.error('⚠️ 未检测到有效 AI 模型配置！无法启动 Multi-Agent 智能体协作推导。');
      setIsModelGuardOpen(true);
      return false;
    }
    return true;
  };

  // 启动多智能体协作循环 (Multi-Agent Dispatch Cycle)
  const handleStartMultiAgentPipeline = async () => {
    if (!rawInput.trim()) {
      toast.error('⚠️ 请先在输入框中填入小说文本、剧本文件或 AI 提示词！');
      return;
    }
    if (!checkModelConfigGate()) return;

    setIsExecuting(true);
    toast.info('🎬 正在调起 Director 2.0 DAG 拓扑执行流...');

    try {
      director.getBlackboard().update(
        {
          rawInput,
          scriptContent: rawInput,
          inputType,
          stage: 'planning',
        },
        'system',
        'System',
        '用户提交全新输入，ACS-2.0 DAG 执行流已拉起...'
      );

      await director.execute();

      toast.success('🎉 ACS-2.0 多智能体 DAG 协同推导与质检审计全量通过！');
    } catch (err: any) {
      toast.error(`❌ Multi-Agent 推导异常: ${err?.message || '协作中断'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // 无缝保存并进入分镜 Studio
  const handleEnterStudio = () => {
    const data = director.getBlackboard().getData();
    if (!data.scriptContent || data.scenes.length === 0) {
      toast.error('⚠️ 尚未完成多智能体推导，请先点击【启动 ACS-2.0 智能体协同推导】！');
      return;
    }

    const projectPayload = {
      name: data.projectName || '漫剧工程 · 多 Agent 协作',
      description: data.scriptContent.slice(0, 60),
      status: 'processing',
      stage: 'In_Progress',
      content: data.scriptContent,
      novelText: data.scriptContent,
      script: data.scriptContent,
      parsedScenes: data.scenes,
      storyboardFrames: data.scenes,
      characters: data.characters,
      spatialMemory: data.spatialMemory,
      cameraDirectingPlans: data.cameraDirectingPlans,
      audioConfig: data.audioConfig,
      renderQueue: data.renderQueue,
      updatedAt: new Date().toISOString(),
    };

    const targetProject = store.createProject(projectPayload as any);
    store.setCurrentProject(targetProject);
    toast.success('🎉 已无缝打通多智能体推导数据，直接进入分镜编辑器！');
    void navigate(`/project/edit/${targetProject.id}?step=1`);
  };

  // 一键生成并压制完整 1080P 漫剧视频
  const handleOneClickRenderPlayableVideo = async () => {
    if (!rawInput.trim()) {
      toast.error('⚠️ 请先在输入框中填入小说文本、剧本文件或 AI 提示词！');
      return;
    }

    setIsRenderingVideo(true);
    toast.info('🚀 启动全自动漫剧工业化压制流水线 (声画合成 + Ken Burns 运镜 + FFmpeg 硬件加速)...');

    try {
      // 1. 如果黑板尚无数据，先触发一次 DAG 快速拆解
      let data = director.getBlackboard().getData();
      if (!data.scriptContent || data.scenes.length === 0) {
        director.getBlackboard().update(
          {
            rawInput,
            scriptContent: rawInput,
            inputType,
            stage: 'planning',
          },
          'system',
          'System',
          '全自动成片流水线：启动剧本与场景自适应解析...'
        );
        await director.execute();
        data = director.getBlackboard().getData();
      }

      // 2. 构造或查找目标 ProjectData
      let targetProject = store.currentProject;
      if (!targetProject) {
        const payload = {
          name: data.projectName || `漫剧成片_${new Date().toLocaleDateString()}`,
          description: data.scriptContent.slice(0, 80),
          status: 'processing' as const,
          stage: 'In_Progress',
          content: data.scriptContent,
          script: data.scriptContent,
          parsedScenes: data.scenes,
          characters: data.characters,
        };
        targetProject = store.createProject(payload);
        store.setCurrentProject(targetProject);
      } else {
        store.updateProject(targetProject.id, {
          parsedScenes: data.scenes.length > 0 ? data.scenes : targetProject.parsedScenes,
          characters: data.characters.length > 0 ? data.characters : targetProject.characters,
        });
      }

      // 3. 执行端到端真实视频压制
      const result = await PlayableMangaPipelineService.execute(targetProject, (progress) => {
        setRenderProgress(progress);
      });

      setRenderedVideoMeta(result);
      setIsVideoModalOpen(true);
      toast.success('🎉 1080P 漫剧成片已成功压制出片！');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`❌ 漫剧压制失败: ${msg}`);
    } finally {
      setIsRenderingVideo(false);
    }
  };

  const latestAudit = blackboardData.auditReports && blackboardData.auditReports.length > 0
    ? blackboardData.auditReports[blackboardData.auditReports.length - 1]
    : null;

  return (
    <div className="space-y-6 font-sans text-slate-100 bg-[#050810] min-h-[calc(100vh-5rem)] p-4 rounded-3xl border border-slate-800/80 shadow-2xl">
      {/* 顶部 Header Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex-wrap shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00f5d4]/10 border border-[#00f5d4]/30 flex items-center justify-center text-[#00f5d4]">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              Kineo Multi-Agent Director 2.0
              <Badge className="bg-[#00f5d4]/15 text-[#00f5d4] border-[#00f5d4]/30 font-mono text-[10px]">
                ACS-2.0 DAG Swarm
              </Badge>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              动态 DAG 拓扑编排 · 四级小说语义剖析 · 独立质检审计员批评自愈闭环
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleOneClickRenderPlayableVideo}
            disabled={isExecuting || isRenderingVideo}
            className="bg-gradient-to-r from-[#00f5d4] via-[#00e5ff] to-[#b44fff] text-black font-extrabold text-xs px-4 py-2 rounded-xl border-0 shadow-lg shadow-[#00f5d4]/20 flex items-center gap-1.5 cursor-pointer hover:opacity-95 transition-all"
          >
            {isRenderingVideo ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                <span>{renderProgress?.message || '漫剧压制中...'}</span>
              </>
            ) : (
              <>
                <Film className="w-3.5 h-3.5 text-black" />
                <span>🎬 一键生成完整漫剧视频 (1080P MP4)</span>
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAgentConfigModalOpen(true)}
            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer font-semibold"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            扩展自定义 Agent
          </Button>
          <Button
            size="sm"
            onClick={handleEnterStudio}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <Clapperboard className="w-3.5 h-3.5 text-[#00f5d4]" />
            进入分镜 Studio
          </Button>
        </div>
      </div>

      {/* 实时视频压制渲染进度条 */}
      {isRenderingVideo && renderProgress && (
        <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-[#00f5d4]/40 shadow-xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#00f5d4] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#00f5d4]" />
              {renderProgress.message}
            </span>
            <span className="font-mono font-bold text-slate-300">
              {renderProgress.percent}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-[#00f5d4] to-[#b44fff] h-full transition-all duration-300 rounded-full"
              style={{ width: `${renderProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* DAG 拓扑流水线全景状态条 */}
      <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold flex items-center gap-1.5 text-slate-200">
            <TrendingUp className="w-3.5 h-3.5 text-[#00f5d4]" />
            DAG 拓扑执行流进度 (Directed Acyclic Graph Stream)
          </span>
          {blackboardData.currentReflection && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] animate-pulse">
              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
              质检自愈中: {blackboardData.currentReflection.failedMetric} (重试 {blackboardData.currentReflection.retryCount}/{blackboardData.currentReflection.maxRetries})
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { id: 'task-script', name: '1. 原著四级剖析', role: 'STORY' },
            { id: 'task-character', name: '2. 全息 DNA 锁脸', role: 'ACTOR' },
            { id: 'task-storyboard', name: '3. 视效分镜矩阵', role: 'FRAME' },
            { id: 'task-auditor', name: '4. 四维质量审计', role: 'AUDIT' },
            { id: 'task-sound', name: '5. 情感声效混音', role: 'AUDIO' },
            { id: 'task-video', name: '6. 4K 视频压制', role: 'EDITOR' },
          ].map((step) => {
            const node = blackboardData.dagNodes?.[step.id];
            const status = node?.status || 'pending';

            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-xl border text-[11px] font-mono transition-all ${
                  status === 'completed'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : status === 'running'
                      ? 'bg-[#00f5d4]/15 border-[#00f5d4] text-[#00f5d4] shadow-md shadow-[#00f5d4]/10'
                      : status === 'healing'
                        ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 animate-pulse'
                        : 'bg-slate-900/50 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold truncate">{step.name}</span>
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : status === 'running' ? (
                    <RefreshCw className="w-3.5 h-3.5 text-[#00f5d4] animate-spin" />
                  ) : status === 'healing' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                <div className="text-[9px] text-slate-500 flex justify-between">
                  <span>[{step.role}]</span>
                  <span className="uppercase">{status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 两栏大格局：左侧输入与主控控制台，右侧 Multi-Agent Swarm 状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左栏：输入源选择与智能识别框 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="studio-card p-5 space-y-4 border border-slate-800 bg-slate-950/60 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-xs text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00f5d4]" />
                素材内容输入 (四级语义剖析)
              </span>
            </div>

            {/* 输入类型 Selector */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setInputType('novel_text')}
                className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  inputType === 'novel_text'
                    ? 'bg-[#00f5d4] text-[#050810] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                小说长文本
              </button>
              <button
                onClick={() => setInputType('script_file')}
                className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  inputType === 'script_file'
                    ? 'bg-[#00f5d4] text-[#050810] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                现成剧本
              </button>
              <button
                onClick={() => setInputType('ai_prompt')}
                className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  inputType === 'ai_prompt'
                    ? 'bg-[#00f5d4] text-[#050810] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                AI 灵感词
              </button>
            </div>

            <Textarea
              rows={8}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={
                inputType === 'script_file'
                  ? '粘贴现成剧本文件内容（包含场景格式 INT./EXT. 及角色对白）...'
                  : inputType === 'ai_prompt'
                    ? '输入 AI 创作灵感提示词（例如：“创作一部 12 集赛博修仙漫剧，主角叫李云霄...”）'
                    : '粘贴或拖入原著小说章节，ACS-2.0 将自动运行四级深度语义切分与镜头编译...'
              }
              className="w-full p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-[#00f5d4] resize-none font-mono leading-relaxed"
            />

            <Button
              size="lg"
              disabled={isExecuting}
              onClick={handleStartMultiAgentPipeline}
              className="bg-[#00f5d4] hover:bg-[#00e0c2] text-[#050810] font-bold w-full text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#00f5d4]/20 cursor-pointer border-0"
            >
              <Zap className={`w-4 h-4 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
              {isExecuting ? 'Director 2.0 DAG 推导中...' : '启动 ACS-2.0 智能体协同推导'}
            </Button>
          </div>

          {/* 独立质检审计记分卡 (Quality Auditor Scorecard) */}
          {latestAudit && (
            <div className="studio-card p-4 space-y-3 border border-slate-800 bg-slate-950/80 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-xs text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00f5d4]" />
                  质检审计记分卡 (Auditor Report)
                </span>
                <Badge
                  className={
                    latestAudit.passed
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px]'
                  }
                >
                  总分: {latestAudit.overallScore} / 100 {latestAudit.passed ? '合格' : '打回自愈'}
                </Badge>
              </div>

              <div className="space-y-2 text-[11px]">
                {latestAudit.metrics.map((m, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">{m.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{m.critique}</div>
                    </div>
                    <span className={`font-mono font-bold ${m.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {m.score}分
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右栏：智能体集群 (Agent Swarm Grid) 与 Blackboard 共享黑板 Live 控制台 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Multi-Agent Swarm 状态卡片网格 */}
          <div className="studio-card p-5 space-y-4 border border-slate-800 bg-slate-950/60 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-xs text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                协作智能体集群 (Agent Swarm - {registeredAgents.length} 位 Agent 待命)
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                阶段: {blackboardData.stage}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {registeredAgents.map((agent) => {
                const isActive = blackboardData.activeAgentId === agent.metadata.id;
                const isCompleted = blackboardData.completedAgentIds.includes(agent.metadata.id);
                return (
                  <div
                    key={agent.metadata.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-2 relative ${
                      isActive
                        ? 'bg-[#00f5d4]/15 border-[#00f5d4] shadow-lg shadow-[#00f5d4]/20 scale-[1.02]'
                        : isCompleted
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base">{agent.metadata.avatar || '🤖'}</span>
                        <span className="font-bold text-xs text-slate-100 truncate">
                          {agent.metadata.name.split(' ')[0]}
                        </span>
                      </div>
                      {agent.metadata.isCustom && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">
                      {agent.metadata.description}
                    </p>
                    <div className="flex items-center justify-between text-[9px] font-mono pt-1.5 border-t border-slate-800 text-slate-400">
                      <span>Phase:</span>
                      <span className="text-[#00f5d4] font-bold">{agent.metadata.triggerPhase.split('_')[1]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ProjectBlackboard 共享黑板实时控制台与 Agent 日志 */}
          <div className="studio-card p-5 space-y-3 border border-slate-800 bg-slate-950/60 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="font-bold text-xs text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                ProjectBlackboard 共享黑板思考与通信流 (Live Thought Stream)
              </span>
              <span className="text-[10px] font-mono text-purple-400 font-bold">
                {blackboardData.logs.length} 条推导演化记录
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-2 h-44 overflow-y-auto">
              {blackboardData.logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 text-[10px]">[{log.timestamp.slice(11, 19)}]</span>
                  <span className="text-[#00f5d4] font-bold min-w-[110px]">[{log.agentName.split(' ')[0]}]</span>
                  <span className={log.level === 'error' ? 'text-rose-400 font-bold' : log.level === 'success' ? 'text-emerald-400 font-bold' : log.level === 'warn' ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                    {log.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ModelConfigGuardModal
        isOpen={isModelGuardOpen}
        onClose={() => setIsModelGuardOpen(false)}
      />

      <AgentConfigModal
        open={isAgentConfigModalOpen}
        onOpenChange={setIsAgentConfigModalOpen}
        onAgentAdded={refreshAgents}
      />

      {/* 🎬 1080P/4K 成片交付弹窗 */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-4xl bg-[#090d18] border border-slate-800 text-slate-100 p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-[#00f5d4]">
              <Film className="w-5 h-5 text-[#00f5d4]" />
              🎉 漫剧成片已成功压制交付 (1080P Full HD)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              原生 FFmpeg 硬件加速压制 · Ken Burns 动态运镜 · Edge-TTS 多角色配音 · 动漫硬字幕
            </DialogDescription>
          </DialogHeader>

          {renderedVideoMeta && (
            <div className="space-y-4 my-2">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl flex items-center justify-center">
                <video
                  src={renderedVideoMeta.videoUri}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[11px]">
                    ⏱️ 时长: {Math.round(renderedVideoMeta.duration)} 秒
                  </Badge>
                  <Badge className="bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono text-[11px]">
                    📦 体积: {(renderedVideoMeta.fileSize / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                  <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono text-[11px]">
                    ⚡ 硬件加速: {renderedVideoMeta.encoderUsed || 'VideoToolbox/NVENC'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (renderedVideoMeta.videoPath) {
                        void tauriService.openFileLocation(renderedVideoMeta.videoPath);
                      }
                    }}
                    className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs flex items-center gap-1.5 cursor-pointer text-slate-200"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-[#00f5d4]" />
                    在文件夹中打开
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsVideoModalOpen(false);
                      if (store.currentProject?.id) {
                        void navigate(`/project/edit/${store.currentProject.id}?step=1`);
                      }
                    }}
                    className="bg-[#00f5d4] hover:bg-[#00e0c2] text-black font-extrabold text-xs px-4 cursor-pointer"
                  >
                    进入分镜精调
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MultiAgentStudio;
