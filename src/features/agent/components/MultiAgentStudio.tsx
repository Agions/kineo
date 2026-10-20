/**
 * MultiAgentStudio.tsx — 门面级 Multi-Agent 多智能体协作工作台
 *
 * 彻底重构为 Gemini Studio 2026 统一设计语言：
 * 采用冰川黑 (#050810) 背景、亮青色 (#00f5d4) 核心按钮与 Swarm 高感光卡片。
 */

import {
  Bot,
  Zap,
  Plus,
  FileText,
  Clapperboard,
  Terminal,
  Activity,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import AgentConfigModal from '@/common/components/business/AgentConfigModal';
import ModelConfigGuardModal from '@/common/components/model/ModelConfigGuardModal';
import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { Textarea } from '@/common/components/ui/textarea';
import { toast } from '@/common/components/ui/toast';
import { useProjectStore } from '@/common/stores/project-store';
import { hasAnyConfiguredModelProvider } from '@/core/config/model-providers';
import { agentRegistry } from '@/core/services/agent/AgentRegistry';
import type { BaseAgent } from '@/core/services/agent/BaseAgent';
import { MasterDirectorAgent } from '@/core/services/agent/MasterDirectorAgent';
import type { BlackboardData, InputContentType } from '@/core/services/agent/ProjectBlackboard';

export const MultiAgentStudio: React.FC = () => {
  const navigate = useNavigate();
  const store = useProjectStore();

  const [rawInput, setRawInput] = useState<string>('');
  const [inputType, setInputType] = useState<InputContentType>('novel_text');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isModelGuardOpen, setIsModelGuardOpen] = useState(false);
  const [isAgentConfigModalOpen, setIsAgentConfigModalOpen] = useState(false);

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

  // 校验模型 Key
  const checkModelConfigGate = (): boolean => {
    if (!hasAnyConfiguredModelProvider()) {
      toast.error('⚠️ 未检测到有效 AI 模型 Key！无法启动 Multi-Agent 智能体协作推导。');
      setIsModelGuardOpen(true);
      return false;
    }
    return true;
  };

  // 启动多智能体协作循环 (Multi-Agent Dispatch Cycle)
  const handleStartMultiAgentPipeline = async () => {
    if (!rawInput.trim()) {
      toast.error('⚠️ 请先在输入框中填入或上传小说文本、剧本文件或 AI 提示词！');
      return;
    }
    if (!checkModelConfigGate()) return;

    setIsExecuting(true);
    toast.info('🎬 正在调起 MasterDirectorAgent 主控导演智能体...');

    try {
      // 1. 初始化黑板数据
      director.getBlackboard().update(
        {
          rawInput,
          scriptContent: rawInput,
          inputType,
          stage: 'planning',
        },
        'system',
        'System',
        '用户提交全新输入，黑板状态拉起...'
      );

      // 2. 执行 Hub-and-Spoke 智能体协同推导
      await director.execute();

      toast.success('🎉 多智能体 (Multi-Agent) 协同推导与视听分镜拆解全量完成！');
    } catch (err: any) {
      toast.error(`❌ Multi-Agent 推导异常: ${err?.message || '协作中断'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  // 无缝保存并进入分镜 Studio (跳过重复上传)
  const handleEnterStudio = () => {
    const data = director.getBlackboard().getData();
    if (!data.scriptContent || data.scenes.length === 0) {
      toast.error('⚠️ 尚未完成 Multi-Agent 智能体推导，请先点击【启动 Multi-Agent 协同推导】！');
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
              Kineo Multi-Agent 智能体协作中心
              <Badge className="bg-[#00f5d4]/15 text-[#00f5d4] border-[#00f5d4]/30 font-mono text-[10px]">
                Auto-Swarm 引擎
              </Badge>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              去除线性 SOP 限制 · 由主控导演 Agent 调起专门智能体与自定义 Agent 共享 Blackboard 协作
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            className="bg-[#00f5d4] hover:bg-[#00e0c2] text-[#050810] text-xs px-4 py-2 rounded-xl border-0 shadow-lg shadow-[#00f5d4]/20 flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <Clapperboard className="w-3.5 h-3.5" />
            进入分镜 Studio
          </Button>
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
                素材内容输入 (支持三类输入)
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
                小说文本
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
                AI 提示词
              </button>
            </div>

            <Textarea
              rows={8}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={
                inputType === 'script_file'
                  ? '粘贴或拖入现成剧本文件内容（包含场景格式 INT./EXT. 及角色对白）...'
                  : inputType === 'ai_prompt'
                    ? '输入 AI 创作灵感提示词（例如：“创作一部 12 集赛博修仙漫剧，主角叫李云霄...”）'
                    : '粘贴或拖入小说原文章节段落...'
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
              {isExecuting ? '多智能体 (Multi-Agent) 协同推导中...' : '启动 Multi-Agent 协同推导'}
            </Button>
          </div>
        </div>

        {/* 右栏：智能体集群 (Agent Swarm Grid) 与 Blackboard 共享黑板 Live 控制台 */}
        <div className="lg:col-span-2 space-y-5">
          {/* Multi-Agent Swarm 状态卡片网格 */}
          <div className="studio-card p-5 space-y-4 border border-slate-800 bg-slate-950/60 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-xs text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                协作智能体集群 (Agent Swarm - {registeredAgents.length} 位 Agent 就绪)
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">
                当前阶段: {blackboardData.stage}
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
                ProjectBlackboard 共享黑板通信日志 (Live Log)
              </span>
              <span className="text-[10px] font-mono text-purple-400 font-bold">
                {blackboardData.logs.length} 条通信事件
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-2 h-44 overflow-y-auto">
              {blackboardData.logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 text-[10px]">[{log.timestamp.slice(11, 19)}]</span>
                  <span className="text-[#00f5d4] font-bold min-w-[110px]">[{log.agentName.split(' ')[0]}]</span>
                  <span className={log.level === 'error' ? 'text-rose-400 font-bold' : log.level === 'success' ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
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
    </div>
  );
};

export default MultiAgentStudio;
