/**
 * render-canvas.worker.ts — 离屏多线程渲染 WebWorker
 *
 * 负责音频波形（Waveform）、动态字幕（Subtitles）的高并发离屏绘制，
 * 解耦主线程 React DOM 树，确保 60FPS 丝滑不卡顿。
 */

export interface RenderWaveformPayload {
  samples: number[]; // 峰值采样数据 0.0 - 1.0
  playheadProgress: number; // 0.0 - 1.0
  width: number;
  height: number;
  themeColor?: string; // 赛博青 #00f5d4
}

export interface RenderSubtitlePayload {
  text: string;
  translation?: string;
  fontSize?: number;
  color?: string;
  strokeColor?: string;
  highlightWord?: string;
  width: number;
  height: number;
}

let offscreenCanvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT_OFFSCREEN_CANVAS': {
      offscreenCanvas = payload.canvas;
      if (offscreenCanvas) {
        ctx = offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
      }
      self.postMessage({ type: 'INIT_SUCCESS' });
      break;
    }

    case 'RENDER_WAVEFORM': {
      if (!ctx || !offscreenCanvas) return;
      const { samples, playheadProgress, width, height, themeColor = '#00f5d4' } = payload as RenderWaveformPayload;

      // 调整画布物理尺寸
      if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // 背景微透网格
      ctx.fillStyle = 'rgba(5, 8, 16, 0.9)';
      ctx.fillRect(0, 0, width, height);

      const sampleCount = samples.length;
      if (sampleCount === 0) return;

      const barWidth = Math.max(2, width / sampleCount - 1);
      const halfHeight = height / 2;

      // 绘制波形条带
      for (let i = 0; i < sampleCount; i++) {
        const x = i * (barWidth + 1);
        const amp = Math.min(1.0, Math.max(0.05, samples[i]));
        const barHeight = amp * (halfHeight - 4);

        const isPastPlayhead = x / width <= playheadProgress;

        if (isPastPlayhead) {
          ctx.fillStyle = themeColor; // 当前播放进度内青光高亮
          ctx.shadowColor = themeColor;
          ctx.shadowBlur = 4;
        } else {
          ctx.fillStyle = 'rgba(100, 116, 139, 0.4)'; // 未播放部分暗灰
          ctx.shadowBlur = 0;
        }

        // 上下对称双向柱状图
        ctx.fillRect(x, halfHeight - barHeight, barWidth, barHeight * 2);
      }

      // 绘制播放指针 Playhead
      const playheadX = playheadProgress * width;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(playheadX - 1, 0, 2, height);

      self.postMessage({ type: 'RENDER_WAVEFORM_COMPLETE' });
      break;
    }

    case 'RENDER_SUBTITLE': {
      if (!ctx || !offscreenCanvas) return;
      const { text, translation, fontSize = 24, color = '#ffffff', width, height } = payload as RenderSubtitlePayload;

      if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // 字幕阴影与描边
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = color;

      const textY = height - 28;
      ctx.strokeText(text, width / 2, textY);
      ctx.fillText(text, width / 2, textY);

      // 译文副字幕
      if (translation) {
        ctx.font = `normal ${Math.round(fontSize * 0.7)}px sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(translation, width / 2, height - 8);
      }

      self.postMessage({ type: 'RENDER_SUBTITLE_COMPLETE' });
      break;
    }

    default:
      break;
  }
};
