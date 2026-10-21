/**
 * OffscreenRenderer.ts — 离屏多线程渲染器控制器
 *
 * 负责与 render-canvas.worker 通信，管理 OffscreenCanvas 的控制权转移与主线程回退。
 */

import { logger } from '@/core/utils/logger';
import type { RenderWaveformPayload, RenderSubtitlePayload } from '@/core/workers/render-canvas.worker';

export class OffscreenRenderer {
  private worker: Worker | null = null;
  private isInitialized = false;
  private fallbackCanvas: HTMLCanvasElement | null = null;
  private fallbackCtx: CanvasRenderingContext2D | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(
          new URL('../../workers/render-canvas.worker.ts', import.meta.url),
          { type: 'module' }
        );
        this.worker.onmessage = (e) => {
          if (e.data.type === 'INIT_SUCCESS') {
            this.isInitialized = true;
          }
        };
      } catch (err) {
        logger.warn('[OffscreenRenderer] Worker 初始化失败，回退到主线程渲染:', err);
      }
    }
  }

  /**
   * 将 HTMLCanvasElement 转移到 Worker 离屏渲染
   */
  public attachCanvas(canvas: HTMLCanvasElement): boolean {
    if (this.worker && 'transferControlToOffscreen' in canvas) {
      try {
        const offscreen = canvas.transferControlToOffscreen();
        this.worker.postMessage(
          {
            type: 'INIT_OFFSCREEN_CANVAS',
            payload: { canvas: offscreen },
          },
          [offscreen]
        );
        return true;
      } catch (err) {
        logger.warn('[OffscreenRenderer] transferControlToOffscreen 失败，使用主线程回退:', err);
      }
    }

    // 回退到主线程 2D Context
    this.fallbackCanvas = canvas;
    this.fallbackCtx = canvas.getContext('2d');
    return false;
  }

  /**
   * 异步触发波形渲染
   */
  public renderWaveform(payload: RenderWaveformPayload): void {
    if (this.isInitialized && this.worker) {
      this.worker.postMessage({
        type: 'RENDER_WAVEFORM',
        payload,
      });
      return;
    }

    // 主线程回退渲染
    if (this.fallbackCtx && this.fallbackCanvas) {
      const ctx = this.fallbackCtx;
      const { samples, playheadProgress, width, height, themeColor = '#00f5d4' } = payload;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(5, 8, 16, 0.9)';
      ctx.fillRect(0, 0, width, height);

      const count = samples.length;
      if (count === 0) return;
      const barWidth = Math.max(2, width / count - 1);
      const halfHeight = height / 2;

      for (let i = 0; i < count; i++) {
        const x = i * (barWidth + 1);
        const amp = Math.min(1.0, Math.max(0.05, samples[i]));
        const barHeight = amp * (halfHeight - 4);
        ctx.fillStyle = x / width <= playheadProgress ? themeColor : 'rgba(100, 116, 139, 0.4)';
        ctx.fillRect(x, halfHeight - barHeight, barWidth, barHeight * 2);
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(playheadProgress * width - 1, 0, 2, height);
    }
  }

  /**
   * 异步触发字幕渲染
   */
  public renderSubtitle(payload: RenderSubtitlePayload): void {
    if (this.isInitialized && this.worker) {
      this.worker.postMessage({
        type: 'RENDER_SUBTITLE',
        payload,
      });
      return;
    }

    if (this.fallbackCtx && this.fallbackCanvas) {
      const ctx = this.fallbackCtx;
      const { text, translation, fontSize = 24, color = '#ffffff', width, height } = payload;
      ctx.clearRect(0, 0, width, height);
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = color;

      const textY = height - 28;
      ctx.strokeText(text, width / 2, textY);
      ctx.fillText(text, width / 2, textY);

      if (translation) {
        ctx.font = `normal ${Math.round(fontSize * 0.7)}px sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(translation, width / 2, height - 8);
      }
    }
  }

  /**
   * 销毁并释放 Worker 资源
   */
  public destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.fallbackCanvas = null;
    this.fallbackCtx = null;
    this.isInitialized = false;
  }
}
