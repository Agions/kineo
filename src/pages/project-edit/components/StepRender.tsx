/**
 * Step 6: 硬件加速场景渲染中心 (StepRender)
 * Cyber Midnight GPU 显卡编解码监视器与批量渲染队列
 */

import { Cpu, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import React, { Suspense, lazy } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProject } from '@/core/hooks/useProject';

import { useStepRenderContext } from '../context/selectors';

const RenderCenter = lazy(() => import('@/features/rendering/components/RenderCenter'));

function StepRender() {
  const { frames, onApplyRenderedFrame } = useStepRenderContext();
  const { setCurrentStep } = useProject();

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 m-0">
                Step 6: FFmpeg 硬件加速场景渲染大厅
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                调用 macOS VideoToolbox / NVENC GPU 原生编解码芯片，完成全集镜头光影与景深合成
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs px-3 py-1">
              <Zap className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Apple VideoToolbox (8 线程)
            </Badge>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <RenderCenter frames={frames} onApplyRenderedFrame={onApplyRenderedFrame} />
          </div>
        </Suspense>
      </Card>

      {/* 底部步骤导航 */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" onClick={() => setCurrentStep(4)} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> 上一步: 角色锁定
        </Button>
        <Button variant="primary" onClick={() => setCurrentStep(6)} className="gap-1.5">
          下一步: 镜头动效合成 <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default StepRender;
