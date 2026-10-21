/**
 * Step 7: 镜头动效与运镜轨迹合成工坊 (StepComposition)
 * Cyber Midnight Zoom/Pan Keyframe 运镜与转场 Filter 选择
 */

import { Video, Sliders, ArrowRight, ArrowLeft } from 'lucide-react';
import React, { Suspense, lazy } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProject } from '@/core/hooks/useProject';

import { useStepCompositionContext } from '../context/selectors';

const CompositionStudio = lazy(() => import('@/features/composition/components/CompositionStudio'));

function StepComposition() {
  const { frames, onCompositionChange } = useStepCompositionContext();
  const { setCurrentStep } = useProject();

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 m-0">
                阶段 3: 动态合成与镜头运镜轨迹 (Pan/Zoom/Tilt)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                为静态分镜添加 Zoom/Pan (平移与推进) 运镜 Filter 图，注入 Crossfade 与 Wipe 影视转场
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-xs px-3 py-1">
            <Sliders className="w-3.5 h-3.5 mr-1" /> Keyframe Motion Vector 2.0
          </Badge>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <CompositionStudio frames={frames} onCompositionChange={onCompositionChange} />
          </div>
        </Suspense>
      </Card>

      {/* 底部步骤导航 */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-1.5 font-bold cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> 上一步: 阶段 2 画面生成
        </Button>
        <Button variant="primary" onClick={() => setCurrentStep(3)} className="gap-1.5 font-bold cursor-pointer">
          下一步: 阶段 4 声音后期 (TTS与导出) <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default StepComposition;
