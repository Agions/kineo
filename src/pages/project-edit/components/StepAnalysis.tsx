/**
 * Step 2: AI 角色与故事结构分析 (StepAnalysis)
 * 真实的 AI 角色与剧情三幕式提炼，无硬编码 Mock 假数据
 */

import { User, Sparkles, Wand2, ArrowRight, ArrowLeft, Layers } from 'lucide-react';
import React, { useState } from 'react';

import ModelConfigGuardModal from '@/common/components/model/ModelConfigGuardModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { hasAnyConfiguredModelProvider } from '@/core/config/model-providers';
import { useProject } from '@/core/hooks/useProject';

import { useStepAnalysisContext } from '../context/selectors';

function StepAnalysis() {
  const { content, storyAnalysis, onAnalyze } = useStepAnalysisContext();
  const { setCurrentStep } = useProject();
  const [analyzing, setAnalyzing] = useState(false);
  const [isModelGuardOpen, setIsModelGuardOpen] = useState(false);

  const handleStartAnalysis = async () => {
    if (!content || content.trim().length === 0) {
      toast.error('⚠️ 当前项目尚未导入任何小说/剧本文本，请先在步骤 1 中输入或导入素材。');
      setCurrentStep(0);
      return;
    }

    if (!hasAnyConfiguredModelProvider()) {
      toast.error('⚠️ 未检测到有效 AI 模型 API Key！无法调用大模型进行实体提炼。');
      setIsModelGuardOpen(true);
      return;
    }

    setAnalyzing(true);
    try {
      if (onAnalyze) {
        await onAnalyze();
        toast.success('🎉 真实 AI 剧本与角色提炼完成！');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '请检查 AI Key 是否配置正确。';
      toast.error(`❌ 提炼失败: ${message}`);
      setIsModelGuardOpen(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const displayCharacters = storyAnalysis?.characters || [];
  const chapters = storyAnalysis?.chapters || [];

  return (
    <div className="space-y-6">
      {/* 头部介绍 */}
      <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 m-0">
                Step 2: AI 角色与剧情结构提炼
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                基于深度 LLM 大模型自动从导入的小说文本中抽离主要角色、性格特征、性别音色与视听镜头节点
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            disabled={analyzing}
            onClick={handleStartAnalysis}
            className="gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            <Wand2 className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? '智能分析推演中...' : '开始 AI 智能提炼'}
          </Button>
        </div>

        {/* 提炼的主要角色卡片列表 */}
        {displayCharacters.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-400" />
                提取到的核心角色 ({displayCharacters.length} 位)
              </span>
              <Badge variant="outline" className="text-[11px] border-indigo-500/40 text-indigo-300">
                Master Consistency Protocol 准备就绪
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {displayCharacters.map((char, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-indigo-500/50 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-100">{char.name}</span>
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]">
                      {char.role || '主要角色'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    <span className="text-slate-500">性格特征: </span>
                    {char.traits ? char.traits.join(', ') : '二次元风格, 专属质感'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 space-y-3">
            <User className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs text-slate-400">
              暂无已提炼的角色实体。请确保步骤 1 已导入小说文本，并点击右上角【开始 AI 智能提炼】。
            </div>
          </div>
        )}
      </Card>

      {/* 剧情脉络纲要 */}
      {chapters.length > 0 && (
        <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            推导章节与剧情节点列表 ({chapters.length} 个节点)
          </span>

          <div className="space-y-2 text-xs">
            {chapters.slice(0, 5).map((chap, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3"
              >
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold text-[10px]">
                  {chap.title || `节点 ${idx + 1}`}
                </span>
                <span className="text-slate-300 flex-1">{chap.summary}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 底部步骤导航 */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" onClick={() => setCurrentStep(0)} className="gap-1.5 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> 上一步: 剧本导入
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            if (displayCharacters.length === 0 && chapters.length === 0) {
              toast.error('⚠️ 尚未进行 AI 提炼，请先点击【开始 AI 智能提炼】');
              return;
            }
            setCurrentStep(2);
          }}
          className="gap-1.5 cursor-pointer"
        >
          下一步: 剧本审阅 <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <ModelConfigGuardModal
        isOpen={isModelGuardOpen}
        onClose={() => setIsModelGuardOpen(false)}
      />
    </div>
  );
}

export default StepAnalysis;
