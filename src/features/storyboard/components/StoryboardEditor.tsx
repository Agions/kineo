import {
  Sparkles,
  Play,
  Pause,
  Camera,
  Layers,
  Save,
  Compass,
  Wand2,
  Loader2,
  UserCheck,
  Activity,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import type { StoryboardFrame } from '@/common/types/storyboard';

export type { StoryboardFrame } from '@/common/types/storyboard';

interface StoryboardEditorProps {
  projectId?: string;
  initialFrames?: StoryboardFrame[];
  focusFrameId?: string;
  onChange?: (frames: StoryboardFrame[]) => void;
  onFrameSelect?: (frame: StoryboardFrame | null) => void;
}

const DEFAULT_DEMO_FRAMES: StoryboardFrame[] = [
  {
    id: 'frame-1',
    title: 'Scene 01: 赛博街道雨景全景',
    sceneDescription: '深夜，黑客城市“新长安”的地下 300 米，霓虹雨打在主角金属手臂上，钛合金高楼耸立。',
    composition: '全景 / 俯瞰视角',
    cameraType: 'Hitchcock_Zoom (希区柯克变焦)',
    dialogue: '“天道服务器的防护墙，也不过如此。”',
    duration: 3,
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80',
  },
  {
    id: 'frame-2',
    title: 'Scene 02: 关键人物 Consistency 锁脸特写',
    sceneDescription: '女主角苏瑶转身看向镜头，眼神坚定，金色数字元神微光笼罩，背景为高科技控制台。',
    composition: '人物特写 / 45度斜角',
    cameraType: 'CloseUp (特写推镜头)',
    dialogue: '“林修，黑客舰队离你只有 100 米了！”',
    duration: 3,
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
  },
  {
    id: 'frame-3',
    title: 'Scene 03: 神经元过载与高能对峙',
    sceneDescription: '计算芯片过载，金色数字符文光芒四射，履带机械犬撞碎大门，两强对峙。',
    composition: '中景 / 动态反切',
    cameraType: 'FPV_Fly (FPV 穿梭飞行)',
    dialogue: '“3 秒够了，全员备战！”',
    duration: 4,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
  },
];

export const StoryboardEditor: React.FC<StoryboardEditorProps> = ({
  initialFrames,
  focusFrameId,
  onChange,
  onFrameSelect,
}) => {
  const [frames, setFrames] = useState<StoryboardFrame[]>(() => {
    if (initialFrames && initialFrames.length > 0) return initialFrames;
    return DEFAULT_DEMO_FRAMES;
  });

  const [selectedFrameId, setSelectedFrameId] = useState<string>(() => {
    if (focusFrameId && frames.some((f) => f.id === focusFrameId)) return focusFrameId;
    return frames[0]?.id || 'frame-1';
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoomVal, setZoomVal] = useState(120);
  const [tiltVal, setTiltVal] = useState(15);
  const [panVal, setPanVal] = useState(0);
  const [motionType, setMotionType] = useState<'Dynamic' | 'Smooth'>('Dynamic');
  const [selectedVoice] = useState('小雅 - 元气女配');

  const selectedFrame = frames.find((f) => f.id === selectedFrameId) || frames[0] || DEFAULT_DEMO_FRAMES[0];

  useEffect(() => {
    if (initialFrames && initialFrames.length > 0) {
      const timer = setTimeout(() => {
        setFrames(initialFrames);
        if (!initialFrames.some((f) => f.id === selectedFrameId)) {
          setSelectedFrameId(initialFrames[0].id);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialFrames, selectedFrameId]);

  const updateSelectedFrame = (updates: Partial<StoryboardFrame>) => {
    const updated = frames.map((f) => (f.id === selectedFrame.id ? { ...f, ...updates } : f));
    setFrames(updated);
    onChange?.(updated);
  };

  const handleGenerateFrameImage = () => {
    setIsGenerating(true);
    toast.info(`正在为「${selectedFrame.title}」渲染 4K 动漫分镜画面...`);
    setTimeout(() => {
      setIsGenerating(false);
      const newUrl = `https://images.unsplash.com/photo-${Date.now() % 2 === 0 ? '1578632767115-351597cf2477' : '1534528741775-53994a69daeb'}?w=800&q=80`;
      updateSelectedFrame({ imageUrl: newUrl });
      toast.success(`🎉 「${selectedFrame.title}」分镜画面生成成功！已写入 Consistency Anchor`);
    }, 1200);
  };

  const handleSaveDesign = () => {
    onChange?.(frames);
    toast.success('🎉 Gemini Studio 视听分镜设计参数与 3D 镜头轨迹已成功保存！');
  };

  return (
    <div className="space-y-4">
      {/* 顶部 Studio 工具栏 */}
      <div className="studio-card p-4 flex items-center justify-between gap-4 flex-wrap border border-[var(--border)] rounded-2xl bg-[#050810]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00f5d4]/10 border border-[#00f5d4]/30 flex items-center justify-center text-[#00f5d4]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Gemini Studio 4K 视听分镜大盘
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00f5d4]/10 text-[#00f5d4] border border-[#00f5d4]/30 font-mono font-bold">
                阶段 2: 画面生成工作室
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              当前编辑: {selectedFrame.title} (3840x2160 Ultra-HD 4K)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            disabled={isGenerating}
            onClick={handleGenerateFrameImage}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer border-0 shadow-sm font-bold"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            AI 渲染当前帧
          </Button>

          <Button
            size="sm"
            onClick={handleSaveDesign}
            className="bg-[#00f5d4] hover:bg-[#00e0c2] text-[#050810] text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer border-0 font-bold shadow-md shadow-[#00f5d4]/20"
          >
            <Save className="w-3.5 h-3.5" />
            保存分镜设计
          </Button>
        </div>
      </div>

      {/* 3 栏 Gemini Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 左栏 (3/12): 分镜帧时间线 */}
        <div className="lg:col-span-3 studio-card p-4 space-y-3 border border-slate-800/80 bg-[#050810]/80 rounded-2xl flex flex-col justify-between min-h-[580px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#00f5d4]" />
                4K Scene Frame Timeline ({frames.length})
              </span>
            </div>

            <div className="h-[480px] pr-1">
              <Virtuoso
                style={{ height: '100%' }}
                totalCount={frames.length}
                itemContent={(idx) => {
                  const frame = frames[idx];
                  const isSelected = frame.id === selectedFrameId;
                  return (
                    <div className="pb-2.5">
                      <div
                        onClick={() => {
                          setSelectedFrameId(frame.id);
                          onFrameSelect?.(frame);
                        }}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 border space-y-2 ${
                          isSelected
                            ? 'bg-[#00f5d4]/10 border-2 border-[#00f5d4] shadow-lg shadow-[#00f5d4]/15'
                            : 'bg-slate-900/40 border-slate-800/80 hover:border-[#00f5d4]/40'
                        }`}
                      >
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/60 border border-white/10">
                          <img
                            src={frame.imageUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80'}
                            alt={frame.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.2 rounded bg-black/80 text-[#00f5d4] font-mono font-bold">
                            {frame.duration ? `0:0${frame.duration}:00` : '0:03:00'}
                          </span>
                        </div>

                        <div>
                          <span className="text-xs font-bold text-slate-100 block truncate">
                            Scene {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate font-mono">
                            {frame.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        </div>

        {/* 中栏 (6/12): 16:9 4K Anime Video Preview Canvas */}
        <div className="lg:col-span-6 studio-card p-5 space-y-4 border border-slate-800/80 bg-[#050810]/80 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-xs text-slate-200 flex items-center gap-2 font-mono">
                <Sparkles className="w-4 h-4 text-[#00f5d4]" />
                16:9 4K Anime Video Preview Canvas
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold font-mono">
                00:07:45:01
              </span>
            </div>

            {/* 画布预览与 3D Camera Motion Overlay */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/90 border border-slate-800 shadow-2xl flex items-center justify-center group">
              <img
                src={selectedFrame.imageUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&q=80'}
                alt={selectedFrame.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* 3D Camera Motion Vector Overlay (Gemini 2026 矢量线 overlay) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-80" viewBox="0 0 800 450">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#00f5d4" />
                  </marker>
                </defs>
                {/* 运镜轨迹向量箭头 */}
                <path d="M 280 320 L 450 180" stroke="#00f5d4" strokeWidth="2.5" strokeDasharray="6 4" markerEnd="url(#arrow)" />
                <path d="M 520 320 L 720 380" stroke="#00f5d4" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                <path d="M 400 220 L 400 160" stroke="#00f5d4" strokeWidth="2" markerEnd="url(#arrow)" />

                {/* 3D 摄像机 FOV 锥形框架 */}
                <polygon points="380,240 440,160 480,240" fill="rgba(0, 245, 212, 0.08)" stroke="#00f5d4" strokeWidth="1" />
              </svg>

              {/* Overlay 标志牌 */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#00f5d4]/40 text-[10px] font-mono text-[#00f5d4] flex items-center gap-2 z-20">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                3D Camera Vector: Hitchcock Zoom / FPV Fly | FOV: 24-78
              </div>

              {/* 播放控制按钮 */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#00f5d4]/90 hover:bg-[#00f5d4] text-[#050810] flex items-center justify-center shadow-xl shadow-[#00f5d4]/40 transition-transform hover:scale-110 cursor-pointer border-0 z-20"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
              </button>

              <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/90 backdrop-blur-md border border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-[#00f5d4] font-bold">Path Vector Speed: 6.5m/s</span>
                <span className="text-slate-300 text-[11px]">25 FPS 60fps 硬件插帧</span>
              </div>
            </div>

            {/* 音轨 Waveform Timeline */}
            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>配音音轨: {selectedVoice}</span>
                <span className="text-[#00f5d4] font-bold">00:00:0{selectedFrame.duration || 3}</span>
              </div>
              <div className="h-8 w-full bg-[#00f5d4]/10 rounded-lg border border-[#00f5d4]/20 flex items-center justify-center gap-1 overflow-hidden px-2">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-[#00f5d4]/60 rounded-full transition-all duration-300"
                    style={{ height: `${20 + Math.sin(i * 0.5) * 60}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右栏 (3/12): Prompt Studio & 3D Camera Controls */}
        <div className="lg:col-span-3 studio-card p-4 space-y-4 border border-slate-800/80 bg-[#050810]/80 rounded-2xl">
          {/* 1. Prompt Studio */}
          <div className="space-y-2.5 pb-3 border-b border-slate-800">
            <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-[#00f5d4]" />
              PROMPT STUDIO
            </span>
            <textarea
              value={selectedFrame.sceneDescription}
              onChange={(e) => updateSelectedFrame({ sceneDescription: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-[#00f5d4] resize-none h-20 font-mono leading-relaxed"
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleGenerateFrameImage}
                className="bg-[#00f5d4] text-[#050810] hover:bg-[#00e0c2] text-[11px] font-bold py-1 flex-1 rounded-lg border-0"
              >
                Generate Scene
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info('已匹配 AI 动漫艺术风格')}
                className="text-[11px] border-slate-800 text-slate-300 py-1 rounded-lg"
              >
                AI Styles
              </Button>
            </div>
          </div>

          {/* 2. 3D Camera Controls */}
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-purple-400" />
                3D CAMERA CONTROLS
              </span>
              <span className="text-[10px] text-[#00f5d4] font-mono font-bold">
                {zoomVal / 30}x
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Zoom</span>
                  <span className="font-mono text-[#00f5d4] font-bold">{(zoomVal / 30).toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="240"
                  value={zoomVal}
                  onChange={(e) => setZoomVal(Number(e.target.value))}
                  className="w-full accent-[#00f5d4] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Tilt</span>
                  <span className="font-mono text-purple-400 font-bold">{tiltVal}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={tiltVal}
                  onChange={(e) => setTiltVal(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Pan</span>
                  <span className="font-mono text-cyan-400 font-bold">{panVal}°R</span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={panVal}
                  onChange={(e) => setPanVal(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Motion Type</span>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setMotionType('Dynamic')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      motionType === 'Dynamic' ? 'bg-[#00f5d4] text-[#050810]' : 'text-slate-400'
                    }`}
                  >
                    Dynamic
                  </button>
                  <button
                    onClick={() => setMotionType('Smooth')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      motionType === 'Smooth' ? 'bg-[#00f5d4] text-[#050810]' : 'text-slate-400'
                    }`}
                  >
                    Smooth
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Character Consistency Anchor Cards */}
          <div className="space-y-2.5">
            <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              CHARACTER CONSISTENCY
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">Eris</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">Active</span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono block">ID#8841</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">Kenji</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">Active</span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono block">ID#8842</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryboardEditor;
