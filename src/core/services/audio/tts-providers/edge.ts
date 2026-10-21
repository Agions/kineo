/**
 * Edge TTS 提供商实现
 *
 * Edge TTS 是微软免费在线 TTS，无需 API Key，是当前 6 个 provider
 * 中唯一真正有实现的；其余 5 个（azure/aliyun/baidu/iflytek/cosyvoice）
 * 在缺少 API Key 时降级到 Edge TTS 并 toast 警告——见 stubs.ts。
 *
 * 提供能力：
 *   - synthesize()  一次性同步合成（HTTP POST + arrayBuffer）
 *   - synthesizeStream()  伪流式（按 500 字符分段多次同步合成）
 */

import type { TTSConfig, TTSResponse, TTSStreamChunk } from '@/core/types';

import { estimateDuration, escapeSSML, splitText } from '../tts-utils';

const EDGE_TTS_ENDPOINT =
  'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';

/** Edge TTS 的伪流式分块长度（字符数）。超过则按句号切块 */
const EDGE_STREAM_CHUNK_MAX_CHARS = 500;

/** Edge TTS 默认音色 style（当 voice.style 字段未填时使用） */
const EDGE_DEFAULT_VOICE_STYLE = 'newscast';

/**
 * 构造 Edge TTS 的 SSML 请求体
 *
 * 结构：
 *   <speak>
 *     <voice name="...">
 *       <prosody rate="..." pitch="..."%>
 *         <express-as style="..." styledegree="1">
 *           [escaped text]
 *
 * 注意：
 *   - rate 是相对值（0 表示 1.0 倍速），所以减 1
 *   - pitch 是百分比偏移，所以 (pitch - 1) * 50
 *   - styledegree 固定为 1（情感强度中位）
 */
function buildEdgeSSML(text: string, config: TTSConfig, voiceStyle: string): string {
  return `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
  <voice name="${config.voice}">
    <prosody rate="${config.speed - 1}" pitch="${(config.pitch - 1) * 50}%">
      <express-as style="${voiceStyle}" styledegree="1">
        ${escapeSSML(text)}
      </express-as>
    </prosody>
  </voice>
</speak>`;
}

/**
 * Edge TTS 一次性合成
 *
 * @param text   待合成文本
 * @param config TTS 配置（provider/voice/speed/pitch/volume/format）
 * @param signal AbortSignal 用于请求级取消
 * @param resolveVoiceStyle  由调用方提供"id→style"的查找函数（避免本模块依赖 voices 表）
 */
export async function synthesizeEdge(
  text: string,
  config: TTSConfig,
  signal: AbortSignal | undefined,
  resolveVoiceStyle: (voiceId: string) => string | undefined
): Promise<TTSResponse> {
  const voiceStyle = resolveVoiceStyle(config.voice) ?? EDGE_DEFAULT_VOICE_STYLE;
  const ssml = buildEdgeSSML(text, config, voiceStyle);

  const response = await fetch(EDGE_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/ssml+xml',
      'X-Timestamp': new Date().toISOString(),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: ssml,
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Edge TTS 请求失败: ${response.status} - ${errorText}`);
  }

  const audio = await response.arrayBuffer();

  return {
    audio,
    duration: estimateDuration(text, config.speed),
    size: audio.byteLength,
    format: config.format,
  };
}

/**
 * Edge TTS 流式合成（实际是"分段同步合成"）
 *
 * Edge TTS 服务端不支持真正的 chunked streaming，所以我们在客户端把
 * 长文本按 EDGE_STREAM_CHUNK_MAX_CHARS 切块，逐块调 synthesizeEdge，
 * 最后一个 chunk 标记 isFinal=true。
 *
 * 保留原始 generator 语义以便未来切换到真正的流式端点时无需改调用方。
 */
export async function* synthesizeEdgeStream(
  text: string,
  config: TTSConfig,
  signal: AbortSignal | undefined,
  resolveVoiceStyle: (voiceId: string) => string | undefined
): AsyncGenerator<TTSStreamChunk> {
  const chunks = splitText(text, EDGE_STREAM_CHUNK_MAX_CHARS);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isFinal = i === chunks.length - 1;

    const response = await synthesizeEdge(chunk, config, signal, resolveVoiceStyle);

    yield {
      audio: response.audio,
      isFinal,
    };
  }
}
