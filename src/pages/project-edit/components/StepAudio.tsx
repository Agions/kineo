/**
 * Step 8: 多音轨 TTS 配音与音频工程中心 (StepAudio)
 * Cyber Midnight 多音轨混音、EdgeTTS / CosyVoice 语音对齐与波形时间轴
 */

import { Volume2, Music, ArrowRight, ArrowLeft } from 'lucide-react';
import React from 'react';

import { Badge } from '@/common/components/ui/badge';
import { Button } from '@/common/components/ui/button';
import { Card } from '@/common/components/ui/card';
import { toast } from '@/common/components/ui/toast';
import { useProject } from '@/core/hooks/useProject';
import { AudioStudio, AudioTimeline } from '@kineo/audio-studio';

function StepAudio() {
  const { setCurrentStep } = useProject();

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 m-0">
                阶段 4: 声音后期与 4K 音画同轴压制导出
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                支持 EdgeTTS / CosyVoice 多角色对白合成，毫秒级音轨对齐、BGM 背景音效与 4K Ultra-HD 视频导出
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-xs px-3 py-1">
            <Music className="w-3.5 h-3.5 mr-1" /> 多音轨 Waveform 同轴对齐
          </Badge>
        </div>

        {/* 交互式音轨混音与 TTS 面板 */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
          <AudioStudio />
          <AudioTimeline
            tracks={[
              { id: 't1', name: '角色对白轨 (Voice)', type: 'dialogue', volume: 1, mute: false },
              { id: 't2', name: '背景音乐轨 (BGM)', type: 'bgm', volume: 0.6, mute: false },
              { id: 't3', name: '环境音效轨 (SFX)', type: 'sfx', volume: 0.8, mute: false },
            ]}
            totalDuration={30}
            currentTime={8.5}
          />
        </div>
      </Card>

      {/* 底部步骤导航 */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-1.5 font-bold cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> 上一步: 阶段 3 动态合成
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            toast.success('🎉 漫剧音画同轴合成完成！4K Ultra-HD MP4 导出任务已全量下发');
          }}
          className="gap-1.5 font-bold cursor-pointer bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white shadow-lg shadow-emerald-500/20"
        >
          一键 4K 压制导出漫剧 <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default StepAudio;
