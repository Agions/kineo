/**
 * TTS (Text-to-Speech) 服务门面
 *
 * 把原 473 行单文件拆为：
 *   - tts-types.ts               默认配置 + 类型
 *   - tts-voices.ts              6 provider × 23 音色映射表
 *   - tts-utils.ts               escapeSSML / estimateDuration / splitText / saveAudio
 *   - tts-providers/edge.ts      Edge TTS 真实实现（HTTP + 流式分块）
 *   - tts-providers/stubs.ts     5 个 stub provider 工厂（warning + fallback）
 *   - tts-provider-registry.ts   Provider 路由表 + ensureNonEmptyText
 *
 * 本文件作为对外门面：
 *   - 保留类 TTSService 暴露原方法（getVoices/getAllVoices/getVoiceById/
 *     synthesize/streamSynthesize/cancelRequest/saveAudio）
 *   - 委托到上述子模块
 *   - 顶层 export {ttsService, DEFAULT_TTS_CONFIG, TTS_VOICES} 完全兼容
 *
 * 业务行为零变化：所有方法签名、错误消息、toast 文案、调用顺序、
 * URL、SSML 模板、chunks 切分逻辑 1:1 保留。
 */

import type {
  TTSProvider,
  TTSVoice,
  TTSRequest,
  TTSResponse,
  TTSStreamChunk,
} from '@/core/types';

import { SYNTHESIZE_REGISTRY, ensureNonEmptyText } from './tts-provider-registry';
import { synthesizeEdgeStream } from './tts-providers/edge';
import { DEFAULT_TTS_CONFIG } from './tts-types';
import { saveAudio } from './tts-utils';
import { TTS_VOICES } from './tts-voices';

// 顶层常量导出（保持外部 import 路径不变）
export { DEFAULT_TTS_CONFIG, TTS_VOICES };

class TTSService {
  private abortControllers: Map<string, AbortController> = new Map();

  /**
   * 把 voiceId 解析为对应的 style 字符串（Edge SSML 用）
   * 私有，避免外部误用。
   */
  private resolveVoiceStyle(voiceId: string): string | undefined {
    return this.getAllVoices().find((v) => v.id === voiceId)?.style;
  }

  /** 获取指定 provider 的所有音色 */
  getVoices(provider: TTSProvider): TTSVoice[] {
    return TTS_VOICES[provider] || [];
  }

  /** 获取所有 provider 的全部音色（flat） */
  getAllVoices(): TTSVoice[] {
    return Object.values(TTS_VOICES).flat();
  }

  /** 按 ID 查找音色 */
  getVoiceById(id: string): TTSVoice | undefined {
    return this.getAllVoices().find((v) => v.id === id);
  }

  /**
   * 一次性合成语音（按 provider 路由到对应实现）
   */
  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    const { text, config, signal } = request;
    ensureNonEmptyText(text);

    const impl = SYNTHESIZE_REGISTRY[config.provider];
    if (!impl) {
      throw new Error(`不支持的 TTS 提供商: ${config.provider}`);
    }
    return impl(text, config, signal, (voiceId) => this.resolveVoiceStyle(voiceId));
  }

  /**
   * 流式合成语音
   *
   * 原行为严格保留：
   *   - edge / azure：走真正的流式生成器（azure 流式 = edge 流式）
   *   - 其余 provider：调一次 synthesize()，yield {audio, isFinal: true}
   */
  async *streamSynthesize(request: TTSRequest): AsyncGenerator<TTSStreamChunk> {
    const { text, config, signal } = request;
    ensureNonEmptyText(text);

    switch (config.provider) {
      case 'edge':
        yield* synthesizeEdgeStream(text, config, signal, (voiceId) =>
          this.resolveVoiceStyle(voiceId)
        );
        break;
      case 'azure':
        // 原代码 azure 流式 = edge 流式（保持完全一致）
        yield* synthesizeEdgeStream(text, config, signal, (voiceId) =>
          this.resolveVoiceStyle(voiceId)
        );
        break;
      default: {
        // 其他 provider 用非流式兜底
        const response = await this.synthesize(request);
        yield { audio: response.audio, isFinal: true };
      }
    }
  }

  /**
   * 取消指定请求（按 requestId abort fetch）
   */
  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * 保存音频到本地（浏览器下载）
   * 委托给 tts-utils.saveAudio
   */
  async saveAudio(audio: ArrayBuffer, filename: string): Promise<void> {
    saveAudio(audio, filename);
  }
}

export const ttsService = new TTSService();
export default ttsService;
