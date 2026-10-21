/**
 * 通用计时工具：防抖、节流、延迟、重试
 * shared 层自建，零外部依赖
 */

type GenericFunction = (...args: unknown[]) => unknown;

/** 防抖函数 */
export function debounce<T extends GenericFunction>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/** 节流函数 */
export function throttle<T extends GenericFunction>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/** 流水线处理延时常量（模拟真实操作耗时） */
export const PROCESSING_DELAY_MS = {
  FFMPEG_INIT: 800,
  FFMPEG_STREAM_MUX: 1200,
  FFMPEG_ENCODE: 1000,
  FFMPEG_AUDIO_MIX: 800,
  FFMPEG_MUX_MP4: 600,
  FFMPEG_FILE_WRITE: 500,
  EXPORT_VIDEO: 2000,
  CLIP_VIDEO: 1000,
  MERGE_VIDEO: 2000,
  ADD_SUBTITLE: 1500,
  REVIEW_RECHECK: 1000,
} as const;

/** 延迟 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 重试选项 */
export interface RetryOptions {
  /** 最大重试次数（默认 3） */
  maxRetries?: number;
  /** 基础延迟（ms，默认 1000） */
  delay?: number;
  /** 退避策略（默认 'exponential'） */
  backoff?: 'linear' | 'exponential' | 'none';
  /** 重试条件（默认：网络/5xx/429 错误） */
  retryCondition?: (error: unknown) => boolean;
  /** 重试回调 */
  onRetry?: (attempt: number, error: unknown) => void;
}

const defaultRetryCondition = (error: unknown): boolean => {
  if (error instanceof TypeError) return true;
  if (error instanceof Response) return error.status >= 500 || error.status === 429;
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('econnrefused')
    );
  }
  return false;
};

/**
 * 重试（支持两种调用签名）
 * - 简单：retry(fn, attempts, delayMs)
 * - 完整：retry(fn, { maxRetries, delay, backoff, retryCondition, onRetry })
 */
export async function retry<T>(
  fn: () => Promise<T>,
  optionsOrAttempts: RetryOptions | number = 3,
  delayMs: number = 1000
): Promise<T> {
  let opts: RetryOptions;
  if (typeof optionsOrAttempts === 'number') {
    opts = { maxRetries: optionsOrAttempts, delay: delayMs };
  } else {
    opts = { ...optionsOrAttempts };
  }

  const {
    maxRetries = 3,
    delay: baseDelay = 1000,
    backoff = 'exponential',
    retryCondition = defaultRetryCondition,
    onRetry,
  } = opts;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries && retryCondition(error)) {
        let actualDelay = baseDelay;
        if (backoff === 'exponential') actualDelay = baseDelay * Math.pow(2, attempt);
        else if (backoff === 'linear') actualDelay = baseDelay * (attempt + 1);

        if (onRetry) onRetry(attempt + 1, error);
        await delay(actualDelay);
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

/**
 * @deprecated 使用 `retry` 替代（retryRequest 已合并至 timing.ts）
 */
export const retryRequest = retry;
