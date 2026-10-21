/**
 * TTS Provider 注册表（Provider 策略模式）
 *
 * 把原 TTSService.synthesize() 和 streamSynthesize() 中的两个巨型
 * switch-case 提取为路由表：
 *   - 每个 provider 暴露一个 "synthesize" 函数（一次性）
 *   - 可流式 provider 额外暴露 "streamSynthesize" 函数
 *
 * 单一职责：根据 provider 名 → 挑选实现。注册表本身不持有任何
 * 状态，是纯函数风格的策略模式实现。
 *
 * 注意：synthesize 路由表的函数签名是统一的 4 参
 *   (text, config, signal, resolveVoiceStyle) → Promise<TTSResponse>
 * streamSynthesize 路由表是 3 参
 *   (text, config, signal) → AsyncGenerator<TTSStreamChunk>
 */

import type { TTSProvider, TTSConfig, TTSResponse } from '@/core/types';

import { synthesizeEdge } from './tts-providers/edge';
import {
  synthesizeAliyun,
  synthesizeAzure,
  synthesizeBaidu,
  synthesizeCosyvoice,
  synthesizeIflytek,
} from './tts-providers/stubs';

/** 一次性合成函数签名（4 参：text/config/signal/resolveVoiceStyle） */
type SynthesizeFn = (
  text: string,
  config: TTSConfig,
  signal: AbortSignal | undefined,
  resolveVoiceStyle: (voiceId: string) => string | undefined
) => Promise<TTSResponse>;

/** 一次性合成的 provider 路由表 */
export const SYNTHESIZE_REGISTRY: Record<TTSProvider, SynthesizeFn> = {
  edge: synthesizeEdge,
  azure: synthesizeAzure,
  aliyun: synthesizeAliyun,
  baidu: synthesizeBaidu,
  iflytek: synthesizeIflytek,
  cosyvoice: synthesizeCosyvoice,
};

/**
 * 校验请求文本非空。
 * 原代码两个 switch 各自都重复写了相同 if (!text || text.trim().length===0)
 * 抽出来避免重复。
 */
export function ensureNonEmptyText(text: string): void {
  if (!text || text.trim().length === 0) {
    throw new Error('文本内容不能为空');
  }
}
