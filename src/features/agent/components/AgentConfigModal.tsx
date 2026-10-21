/**
 * AgentConfigModal.tsx — 用户自定义扩展 Agent 配置与创建 Modal (Business Component)
 *
 * 允许用户扩展定义自定义 Agent：自定义 Agent 名称、图标、触发阶段、系统 LLM Prompt 与特定黑板规则。
 */

import { Bot, Plus } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { agentRegistry } from '@/core/services/agent/AgentRegistry';
import type { TriggerPhase } from '@/core/services/agent/BaseAgent';

export interface AgentConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgentAdded?: () => void;
}

const TRIGGER_PHASES: { key: TriggerPhase; label: string; desc: string }[] = [
  { key: 'on_input_submitted', label: '1. 内容提交时', desc: '用户刚上传/粘贴剧本、小说或提示词时触发' },
  { key: 'on_script_parsed', label: '2. 剧本解析后', desc: '在剧本大纲与章节场景拆解完成时触发' },
  { key: 'on_character_anchored', label: '3. 角色锚定后', desc: '在 Master Consistency 锁脸 Anchor 生成时触发' },
  { key: 'on_storyboard_generated', label: '4. 分镜生成后', desc: '在运镜与二次元分镜画幅提示词构建后触发' },
  { key: 'on_audio_synthesized', label: '5. 音频合成后', desc: '在多音轨 TTS 与 BGM 字幕卡点完成后触发' },
];

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  open,
  onOpenChange,
  onAgentAdded,
}) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🤖');
  const [description, setDescription] = useState('');
  const [triggerPhase, setTriggerPhase] = useState<TriggerPhase>('on_script_parsed');
  const [systemPrompt, setSystemPrompt] = useState('');

  const resetForm = () => {
    setName('');
    setAvatar('🤖');
    setDescription('');
    setTriggerPhase('on_script_parsed');
    setSystemPrompt('');
  };

  const handleCreateAgent = () => {
    if (!name.trim()) {
      toast.error('请填写 Agent 名称');
      return;
    }
    if (!systemPrompt.trim()) {
      toast.error('请填写 Agent 系统提示词 (System Prompt)');
      return;
    }

    agentRegistry.registerCustomAgent({
      name,
      avatar: avatar || '⚡',
      description: description || '自定义 Agent 扩展插件',
      triggerPhase,
      systemPrompt,
      readKeys: ['rawInput', 'scenes', 'characters'],
      writeKeys: ['storyAnalysis'],
    });

    toast.success(`🎉 已成功扩展注册自定义 Agent: 「${name}」！`);
    onAgentAdded?.();
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-100 rounded-2xl shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <span>扩展注册自定义智能体 (Custom Agent)</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            声明式的 Agent 扩展插件体系：定义智能体触发阶段、自定义 LLM Prompt 规则与 Blackboard 共享黑板干预逻辑
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
          {/* Agent 名称与图标 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1">
              <label className="font-bold text-slate-200 block mb-1">图标 Emoji</label>
              <Input
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="🤖"
                className="bg-slate-950 border-slate-800 text-slate-100 text-center font-mono text-base"
              />
            </div>
            <div className="col-span-3">
              <label className="font-bold text-slate-200 block mb-1">
                智能体名称 <span className="text-indigo-400">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如: 润色审阅智能体 或 二次方言翻译 Agent"
                className="bg-slate-950 border-slate-800 text-slate-100"
              />
            </div>
          </div>

          {/* Agent 职责描述 */}
          <div>
            <label className="font-bold text-slate-200 block mb-1">职责描述</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简述该 Agent 在多智能体协作链条中的专职角色..."
              className="bg-slate-950 border-slate-800 text-slate-100"
            />
          </div>

          {/* 触发阶段选卡 */}
          <div>
            <label className="font-bold text-slate-200 block mb-1.5">
              介入触发阶段 (Trigger Phase)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {TRIGGER_PHASES.map((ph) => {
                const isSelected = triggerPhase === ph.key;
                return (
                  <div
                    key={ph.key}
                    onClick={() => setTriggerPhase(ph.key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setTriggerPhase(ph.key);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className={isSelected ? 'text-indigo-300' : 'text-slate-200'}>
                        {ph.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{ph.key}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{ph.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 系统 System Prompt */}
          <div>
            <label className="font-bold text-slate-200 block mb-1">
              自定义 Agent 系统 Prompt 指令 <span className="text-indigo-400">*</span>
            </label>
            <Textarea
              rows={3}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="例如: 你是一个专业的剧本润色专家，请检查故事冲突点并丰富台词情绪..."
              className="bg-slate-950 border-slate-800 text-slate-100 font-mono resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-800 bg-slate-950 text-slate-300 text-xs px-4"
          >
            取消
          </Button>
          <Button
            onClick={handleCreateAgent}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            保存注册 Agent
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentConfigModal;
