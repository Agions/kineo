/**
 * 渲染队列运行循环与单任务处理
 * @module core/services/project/render-queue-runner
 *
 * 提取自原 RenderQueueService.run / processJob / tickProgress + 重试 / 失败回退逻辑。
 * 集中"取出 pending 任务 → 跑进度点 → 调图生服务 → 成功 / 重试 / 兜底"主流程。
 */

import { delay } from '@/core/utils/timing';
import { imageGenerationService } from '@/core/services/ai/image/image-generation-service';
import { costService } from '@/core/services/project/cost-service';

import { createLog, pushLog } from './render-queue-logger';
import {
  JOB_START_PROGRESS,
  FALLBACK_IMAGE_FONT_SIZE,
  FALLBACK_IMAGE_SIZE,
  TICK_INTERVAL_MS,
  TICK_PROGRESS_POINTS,
  type FrameRenderJob,
  type RenderQueueState,
} from './render-queue-types';

/** 状态更新器签名（避免在子模块里直接 setState） */
export type StateUpdater = (patch: Partial<RenderQueueState>) => void;

/** 把字符串转义为 SVG 安全内容 */
function sanitizeForSvg(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 构造占位 SVG data URI（与原 buildFallbackImage 字节级一致） */
function buildFallbackImage(title: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${FALLBACK_IMAGE_SIZE}' height='${FALLBACK_IMAGE_SIZE}'>
      <defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop stop-color='#0ea5e9' offset='0'/><stop stop-color='#2563eb' offset='1'/></linearGradient></defs>
      <rect width='100%' height='100%' fill='url(#g)'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='${FALLBACK_IMAGE_FONT_SIZE}' font-family='sans-serif'>${sanitizeForSvg(title)}</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** 进度点 tick
 *
 * 行为与原 `tickProgress` 字节级一致：
 *   - 每个点 await sleep(TICK_INTERVAL_MS) 后更新 progress
 *   - 暂停时立即返回
 */
async function tickProgress(
  jobId: string,
  points: readonly number[],
  isPaused: () => boolean,
  patchJob: (jobId: string, patch: Partial<FrameRenderJob>) => void,
  intervalMs: number = TICK_INTERVAL_MS
): Promise<void> {
  for (const value of points) {
    if (isPaused()) return;
    await delay(intervalMs);
    patchJob(jobId, { progress: value });
  }
}

/** ISO 时间戳辅助 */
function nowIso(): string {
  return new Date().toISOString();
}

/**
 * 单任务处理
 *
 * 行为与原 `processJob` 字节级一致：
 *   1. status=running, progress=5, startedAt=now
 *   2. 跑进度点 [20, 45, 70]
 *   3. 调 imageGenerationService.generateImage
 *   4. 成功 → status=completed, imageUrl=result.url, costService.recordVideoCost
 *   5. 失败 + retries<maxRetries → status=pending, retries+1
 *   6. 失败 + 重试耗尽 → status=completed + 占位图 + 错误信息
 */
export async function processRenderJob(
  state: RenderQueueState,
  job: FrameRenderJob,
  deps: {
    patchJob: (jobId: string, patch: Partial<FrameRenderJob>) => void;
    isPaused: () => boolean;
    updateState: StateUpdater;
  }
): Promise<void> {
  deps.patchJob(job.id, {
    status: 'running',
    progress: JOB_START_PROGRESS,
    startedAt: nowIso(),
    error: undefined,
  });
  deps.updateState({
    logs: pushLog(state.logs, createLog('info', `开始渲染：${job.frameTitle}`, job.id)),
  });

  try {
    await tickProgress(job.id, TICK_PROGRESS_POINTS, deps.isPaused, deps.patchJob);

    const result = await imageGenerationService.generateImage(job.prompt, {
      model: job.model,
      size: '1K',
      style: 'anime',
      quality: 'standard',
    });

    deps.patchJob(job.id, {
      status: 'completed',
      progress: 100,
      imageUrl: result.url,
      finishedAt: nowIso(),
    });
    costService.recordVideoCost(job.model, 5, '1K', {
      operation: 'frame_render',
      frameId: job.frameId,
      projectId: job.projectId,
    });
    deps.updateState({
      logs: pushLog(state.logs, createLog('info', `渲染完成：${job.frameTitle}`, job.id)),
    });
  } catch (error) {
    // 回退为占位图，保障流程可继续演示
    const fallbackUrl = buildFallbackImage(job.frameTitle);
    const errorMessage = error instanceof Error ? error.message : '渲染失败';

    if (job.retries < job.maxRetries) {
      deps.patchJob(job.id, {
        status: 'pending',
        progress: 0,
        retries: job.retries + 1,
        error: errorMessage,
      });
      deps.updateState({
        logs: pushLog(
          state.logs,
          createLog(
            'warning',
            `渲染失败，自动重试(${job.retries + 1}/${job.maxRetries})：${job.frameTitle}`,
            job.id
          )
        ),
      });
      return;
    }

    deps.patchJob(job.id, {
      status: 'completed',
      progress: 100,
      imageUrl: fallbackUrl,
      error: errorMessage,
      finishedAt: nowIso(),
    });
    deps.updateState({
      logs: pushLog(
        state.logs,
        createLog('warning', `渲染失败，已使用占位图：${job.frameTitle}`, job.id)
      ),
    });
  }
}

/**
 * 运行循环：拉取 pending 任务逐个处理
 *
 * 行为与原 `run` 字节级一致：
 *   - 循环：暂停 break；无 pending 任务 break；否则 processJob
 *   - 注意：isRunning 守卫由调用方（service.run()）负责，不在本函数内
 *
 * @param getState 获取最新 state 的闭包（避免缓存旧 state 引用——类内 updateState 会创建新 state 对象）
 * @param processJob 处理单任务的函数
 */
export async function runRenderLoop(
  getState: () => RenderQueueState,
  processJob: (job: FrameRenderJob) => Promise<void>
): Promise<void> {
  while (true) {
    const current = getState();
    if (current.isPaused) break;
    const nextJob = current.jobs.find((job) => job.status === 'pending');
    if (!nextJob) break;
    await processJob(nextJob);
  }
}
