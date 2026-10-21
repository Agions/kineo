/**
 * TTS Stub 提供商（Azure / Aliyun / Baidu / Iflytek / CosyVoice）
 *
 * 这 5 个 provider 在原代码里全是相同模板：
 *   toast.warning('XXX TTS 需要配置 API Key，当前使用 Edge TTS');
 *   return this.edgeTTS(text, config, signal);
 *
 * 提取动机：消除 5 段几乎一字不差的重复代码，新增 stub provider
 * 只需调用 createStubProvider({providerName, displayName, fallbackEdge})。
 *
 * 当用户后续接入真实 SDK 时，只需把对应 stub 函数替换为真实实现，
 * 对外接口（参数/返回类型）保持完全一致。
 */

import { toast } from '@/components/ui/toast';
import type { TTSConfig, TTSResponse } from '@/core/types';

import { synthesizeEdge } from './edge';

/**
 * 构造一个 stub provider 的合成函数。
 * 行为：弹一个 toast 警告 → 调用 Edge TTS → 返回相同 TTSResponse。
 *
 * @param displayName 中文显示名（用于 toast 提示文案）
 */
function createStubSynthesize(displayName: string) {
  return async function stubSynthesize(
    text: string,
    config: TTSConfig,
    signal: AbortSignal | undefined,
    resolveVoiceStyle: (voiceId: string) => string | undefined
  ): Promise<TTSResponse> {
    toast.warning(`${displayName} TTS 需要配置 API Key，当前使用 Edge TTS`);
    return synthesizeEdge(text, config, signal, resolveVoiceStyle);
  };
}

// 5 个 stub provider 的合成函数全部由 createStubSynthesize 工厂生成，
// 原代码 5 个方法体完全相同——只剩 displayName 一个变量。

export const synthesizeAzure = createStubSynthesize('Azure');
export const synthesizeAliyun = createStubSynthesize('阿里云');
export const synthesizeBaidu = createStubSynthesize('百度');
export const synthesizeIflytek = createStubSynthesize('讯飞');
export const synthesizeCosyvoice = createStubSynthesize('CosyVoice');
