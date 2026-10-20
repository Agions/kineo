import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MangaCard, MangaButton } from '@kineo/ui';

export interface RenderJobConfig {
  resolution: '1080p' | '4k';
  fps: number;
  hardwareAcceleration: boolean;
  outputPath: string;
}

export function defaultRenderConfig(): RenderJobConfig {
  return {
    resolution: '1080p',
    fps: 30,
    hardwareAcceleration: true,
    outputPath: '',
  };
}

export interface RenderPipelinePanelProps {
  activeEncoder?: string;
  onStartRender?: (config: RenderJobConfig) => void;
}

export const RenderPipelinePanel: React.FC<RenderPipelinePanelProps> = ({
  activeEncoder = 'h264_videotoolbox (Hardware Accelerated)',
  onStartRender,
}) => {
  const [config, setConfig] = useState<RenderJobConfig>(defaultRenderConfig());
  const [isBuild, setIsBuild] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRender = () => {
    setIsBuild(true);
    setProgress(10);
    onStartRender?.(config);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBuild(false);
          return 100;
        }
        return prev + 15;
      });
    }, 400);
  };

  return (
    <MangaCard title="FFmpeg 硬件加速渲染导出引擎" className="w-full">
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mb-4 flex items-center justify-between">
        <span className="text-xs text-slate-400">当前硬件编码器:</span>
        <span className="text-xs font-semibold text-emerald-400">{activeEncoder}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">导出分辨率</label>
          <select
            value={config.resolution}
            onChange={(e) => setConfig({ ...config, resolution: e.target.value as '1080p' | '4k' })}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200"
          >
            <option value="1080p">1080p (FHD - 高清漫剧)</option>
            <option value="4k">4K (Ultra HD - 影院级漫剧)</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">帧率 (FPS)</label>
          <select
            value={config.fps}
            onChange={(e) => setConfig({ ...config, fps: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200"
          >
            <option value={30}>30 FPS (流畅动画)</option>
            <option value={60}>60 FPS (极致平滑动态)</option>
          </select>
        </div>
      </div>

      {isBuild && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>渲染中...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <MangaButton
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleRender}
        disabled={isBuild}
      >
        {isBuild ? '正在导出漫剧视频...' : '开始硬件加速渲染导出'}
      </MangaButton>
    </MangaCard>
  );
};
export interface RenderProgress {
  currentFrame: number;
  totalFrames: number;
  progressPercentage: number;
  status: 'idle' | 'preparing' | 'rendering' | 'encoding' | 'completed' | 'error';
  eta?: string;
}

export function useRenderPipeline() {
  const [config, setConfig] = useState<RenderJobConfig>(defaultRenderConfig());
  const [progress, setProgress] = useState<RenderProgress | null>(null);
  const [isBuild, setIsBuild] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hardwareInfo, setHardwareInfo] = useState<any>(null);

  const startRender = async (projectId: string) => {
    setIsBuild(true);
    setError(null);
    try {
      await invoke('execute_advanced_pipeline', { projectId, config });
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setIsBuild(false);
    }
  };

  const cancelRender = async () => {
    try {
      await invoke('cancel_render');
    } catch (e: any) {
      console.error(e);
    }
  };

  const detectHardware = async () => {
    try {
      const info = await invoke('detect_hardware_accel');
      setHardwareInfo(info);
    } catch (e: any) {
      console.error(e);
    }
  };

  return {
    config,
    setConfig,
    progress,
    isBuild,
    error,
    startRender,
    cancelRender,
    detectHardware,
    hardwareInfo,
  };
}
