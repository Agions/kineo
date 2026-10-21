/**
 * Step 3: 剧本镜头拆解与切分工坊 (StepScript)
 * Cyber Midnight 极客镜头切分与运镜/构图 Preset 交互
 */

import { Film, Plus, Trash2, ArrowRight, ArrowLeft, Camera } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useProject } from '@/core/hooks/useProject';

const INITIAL_SHOTS = [
  {
    id: 'shot-1',
    camera: '特写 (Close-up)',
    composition: '中心构图',
    character: '萧炎',
    dialogue: '“三十年河东，三十年河西，莫欺少年穷！”',
    prompt:
      'masterpiece, 8k, xianxia anime style, close-up shot, 1person, Xiao Yan, angry expression, highly detailed face',
  },
  {
    id: 'shot-2',
    camera: '全景 (Wide)',
    composition: '三分法',
    character: '无',
    dialogue: '',
    prompt:
      'masterpiece, 8k, wide panoramic establishing shot, ancient sect hall, stormy sky, dramatic lighting',
  },
  {
    id: 'shot-3',
    camera: '中景 (Medium)',
    composition: '黄金螺旋',
    character: '药老',
    dialogue: '“好小子，有老夫当年的脾气！”',
    prompt:
      'masterpiece, 8k, medium shot, Yao Lao, old floating spirit, smiling, glowing eyes, ethereal aura',
  },
];

function StepScript() {
  const { setCurrentStep } = useProject();
  const [shots, setShots] = useState(INITIAL_SHOTS);

  const handleAddShot = () => {
    const newS = {
      id: `shot-${shots.length + 1}`,
      camera: '中景 (Medium)',
      composition: '三分法',
      character: '未知角色',
      dialogue: '',
      prompt: 'masterpiece, 8k, anime style, highly detailed',
    };
    setShots([...shots, newS]);
  };

  const handleDeleteShot = (id: string) => {
    setShots(shots.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/90 border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 m-0">
                Step 3: 剧本镜头拆解与运镜标注
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                将文本剧本自动按运镜逻辑拆分为独立镜头 (Shot)，标注景别、构图法则与提示词 Prompt
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={handleAddShot}
            className="gap-1.5 shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> 添加新镜头
          </Button>
        </div>

        {/* 镜头拆解列表 */}
        <div className="space-y-3">
          {shots.map((shot, index) => (
            <div
              key={shot.id}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-mono text-[11px]">
                    SHOT #{index + 1}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                    <Camera className="w-3 h-3 mr-1 text-indigo-400" />
                    {shot.camera}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                    {shot.composition}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteShot(shot.id)}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* 台词与 Prompt 编辑 */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">角色台词 / 独白</label>
                  <Input
                    defaultValue={shot.dialogue}
                    placeholder="输入对白或旁白字幕..."
                    className="bg-slate-900 border-slate-800 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    AI 画面渲染 Prompt
                  </label>
                  <Input
                    defaultValue={shot.prompt}
                    className="bg-slate-900 border-slate-800 text-indigo-300 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 导航导航 */}
      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> 上一步: 角色分析
        </Button>
        <Button variant="primary" onClick={() => setCurrentStep(3)} className="gap-1.5">
          下一步: 漫剧分镜绘制 <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default StepScript;
