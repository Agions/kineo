/**
 * BaseAIService — AI 服务抽象基类
 * ================================
 * 所有 AI 服务（文字生成、图像生成、语音合成、视频生成）继承此基类。
 *
 * 统一能力：
 * - API Key 注入（从环境变量或配置中心）
 * - 超时控制（默认 30s，可 override）
 * - 自动重试（指数退避，默认 2 次）
 * - 错误包装（统一的 ServiceError）
 * - 请求日志（入参、出参、耗时）
 * - 流式支持（SSE/Stream）
 *
 * 使用方式：
 * ```typescript
 * // 创建具体服务
 * class MyTextService extends BaseAIService<TextRequest, TextResponse> {
 *   readonly serviceName = 'my-text';
 *   readonly defaultModel = 'gpt-4o';
 *
 *   protected async doRequest(endpoint: string, params: TextRequest): Promise<TextResponse> {
 *     // 实现具体协议
 *   }
 * }
 * ```
 */

import { getErrorMessage, retryRequest } from '@/core/utils';
import { logger } from '@/core/utils/logger';


export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly serviceName: string,
    public readonly model: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'ServiceError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      serviceName: this.serviceName,
      model: this.model,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

export type ErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'AUTH_FAILED'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'INVALID_PARAMS'
  | 'MODEL_NOT_FOUND'
  | 'CONTENT_FILTERED'
  | 'UNKNOWN';


export interface RequestOptions {
  signal?: AbortSignal;
  timeout?: number;
  maxRetries?: number;
  onProgress?: (chunk: string) => void;
}

export interface StreamChunk {
  delta?: string;
  done?: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}


export abstract class BaseAIService<TParams, TResult> {
  /**
   * 服务名称（用于日志和错误分类）
   */
  abstract readonly serviceName: string;

  /**
   * 默认模型 ID
   */
  abstract readonly defaultModel: string;

  /**
   * 默认超时（毫秒）
   */
  protected readonly defaultTimeout = 30_000;

  /**
   * 默认最大重试次数
   */
  protected readonly defaultMaxRetries = 2;

  /**
   * 执行请求的核心方法 — 子类实现具体 HTTP/协议细节
   */
  protected abstract doRequest(
    endpoint: string,
    params: TParams,
    options: RequestOptions
  ): Promise<TResult>;

  /**
   * 将响应数据转换为标准结果（可选，用于统一格式化）
   */
  protected transformResponse?(raw: unknown): TResult;

  // ========== Public API ==========

  /**
   * 同步请求（自动重试 + 超时 + 错误包装）
   */
  async request(endpoint: string, params: TParams, options: RequestOptions = {}): Promise<TResult> {
    const { signal, timeout = this.defaultTimeout, maxRetries = this.defaultMaxRetries } = options;

    const requestFn = () => this.doRequest(endpoint, params, { signal, timeout });

    try {
      logger.debug(`[${this.serviceName}] → request`, { endpoint, model: this.defaultModel });

      const result = await retryRequest(requestFn, {
        maxRetries,
        delay: 1000,
        backoff: 'exponential',
        retryCondition: (error) => this.isRetryable(error),
        onRetry: (attempt, error) => {
          logger.warn(`[${this.serviceName}] attempt ${attempt} failed: ${error}`);
        },
      });

      logger.debug(`[${this.serviceName}] ✓ response received`, {
        endpoint,
        model: this.defaultModel,
        resultSize: JSON.stringify(result).length,
      });

      return this.transformResponse ? this.transformResponse(result) : result;
    } catch (error) {
      throw this.wrapError(error, endpoint);
    }
  }

  /**
   * 流式请求（适用于 SSE/Server-Sent-Events）
   */
  async *streamRequest(
    endpoint: string,
    params: TParams,
    options: RequestOptions = {}
  ): AsyncGenerator<StreamChunk> {
    const { signal, timeout = this.defaultTimeout } = options;

    logger.debug(`[${this.serviceName}] → stream request`, { endpoint, model: this.defaultModel });

    try {
      yield* this.doStreamRequest(endpoint, params, { signal, timeout });
    } catch (error) {
      throw this.wrapError(error, endpoint);
    }
  }

  /**
   * 流式请求的核心实现 — 子类 override
   */
  protected async *doStreamRequest(
    endpoint: string,
    params: TParams,
    options: RequestOptions
  ): AsyncGenerator<StreamChunk> {
    // 默认实现：调用普通 request 然后分块返回（fallback）
    const response = await this.doRequest(endpoint, params, options);
    const text = typeof response === 'string' ? response : JSON.stringify(response);
    const chunkSize = 10;
    for (let i = 0; i < text.length; i += chunkSize) {
      yield { delta: text.slice(i, i + chunkSize), done: i + chunkSize >= text.length };
    }
  }

  /**
   * 健康检查 — 子类必须实现
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * 获取可用模型列表 — 子类 override
   */
  getAvailableModels(): string[] {
    return [this.defaultModel];
  }

  // ========== Protected Helpers ==========

  /**
   * 判断错误是否可重试
   */
  protected isRetryable(error: unknown): boolean {
    if (error instanceof ServiceError) {
      return ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT', 'SERVER_ERROR'].includes(error.code);
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return false; // 用户取消不重试
    }
    return true;
  }

  /**
   * 判断是否需要认证失败
   */
  protected isAuthError(statusCode?: number): boolean {
    return statusCode === 401 || statusCode === 403;
  }

  /**
   * 判断是否速率限制
   */
  protected isRateLimit(statusCode?: number): boolean {
    return statusCode === 429;
  }

  /**
   * 统一错误包装
   */
  protected wrapError(error: unknown, endpoint: string): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }

    let code: ErrorCode = 'UNKNOWN';
    let statusCode: number | undefined;

    if (error instanceof DOMException) {
      if (error.name === 'AbortError') {
        code = 'TIMEOUT';
      } else {
        code = 'NETWORK_ERROR';
      }
    } else if (error instanceof TypeError) {
      // network error
      code = 'NETWORK_ERROR';
    }

    const message = getErrorMessage(error);

    logger.error(`[${this.serviceName}] request failed`, {
      endpoint,
      code,
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new ServiceError(
      `[${this.serviceName}] ${message}`,
      this.serviceName,
      this.defaultModel,
      code,
      statusCode
    );
  }

  /**
   * 构建带超时的 AbortSignal
   */
  protected buildTimeoutSignal(timeout: number, signal?: AbortSignal): AbortSignal {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    if (signal) {
      signal.addEventListener('abort', () => {
        controller.abort();
        clearTimeout(timer);
      });
    }

    return controller.signal;
  }
}


export type { RetryOptions } from '@/core/utils';
