/**
 * AutoVoiceSynthesizer.ts — 多角色自动配音与音频持久化管线
 *
 * 核心功能：
 * 1. 自动根据角色性别与性格动态分配 Edge-TTS 音色（男主: zh-CN-YunxiNeural, 女主: zh-CN-XiaoxiaoNeural, 旁白: zh-CN-YunjianNeural）。
 * 2. 调用免 Key 的 Edge-TTS 进行真实语音合成（若脱机则平滑降级生成标准 PCM 音频）。
 * 3. 通过 AssetPersistenceBridge 将音频 ArrayBuffer 持久化至工程本地磁盘沙箱，输出物理绝对路径供 Rust 原生 FFmpeg 压制。
 */

import { assetPersistenceBridge } from '@/core/services/data-bus/AssetPersistenceBridge';
import { ttsService } from '@/core/services/audio/tts-service';
import { logger } from '@/core/utils/logger';

export interface VoiceSynthesisResult {
  audioDiskPath: string; // 本地物理磁盘绝对路径，供 FFmpeg -i 使用
  audioUri: string;      // asset:// 或 blob: URL，供前端 <audio> 试听
  duration: number;      // 实际音频时长（秒）
}

export class AutoVoiceSynthesizer {
  /**
   * 根据角色信息推荐最佳音色
   */
  public static selectVoiceForCharacter(characterName: string, gender?: 'male' | 'female' | 'unknown'): string {
    const lower = characterName.toLowerCase();
    if (lower.includes('旁白') || lower.includes('解说') || lower.includes('系统') || lower.includes('narrator')) {
      return 'zh-CN-YunjianNeural'; // 沉稳旁白男声
    }

    if (gender === 'female' || lower.includes('女') || lower.includes('妹') || lower.includes('姐') || lower.includes('晴') || lower.includes('雪')) {
      return 'zh-CN-XiaoxiaoNeural'; // 活泼/清丽女声
    }

    return 'zh-CN-YunxiNeural'; // 阳光/坚毅男声
  }

  /**
   * 合成单条对白音频并落盘
   */
  public static async synthesizeDialogue(
    projectId: string,
    sceneId: string,
    speaker: string,
    text: string,
    gender?: 'male' | 'female' | 'unknown'
  ): Promise<VoiceSynthesisResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      // 空对白生成 2 秒空白占位音频
      return this.generateSilentAudio(projectId, sceneId, 2.0);
    }

    const voice = this.selectVoiceForCharacter(speaker, gender);

    try {
      logger.info(`[AutoVoiceSynthesizer] 正在合成角色 [${speaker}] 对白 (音色: ${voice}): "${trimmed.slice(0, 20)}..."`);
      const response = await ttsService.synthesize({
        text: trimmed,
        config: {
          provider: 'edge',
          voice,
          speed: 1.0,
          pitch: 1.0,
          volume: 1.0,
          format: 'audio-24khz-48kbitrate-mono-mp3',
        },
      });

      const audioBuffer = new Uint8Array(response.audio);
      const assetMeta = await assetPersistenceBridge.persistAsset(
        projectId,
        `tts_${sceneId}_${Date.now()}`,
        audioBuffer,
        {
          fileName: `tts_${sceneId}.mp3`,
          mimeType: 'audio/mpeg',
        }
      );

      return {
        audioDiskPath: assetMeta.localDiskPath || assetMeta.uri,
        audioUri: assetMeta.uri,
        duration: Math.max(1.5, response.duration),
      };
    } catch (err) {
      logger.warn(`[AutoVoiceSynthesizer] 在线 TTS 合成异常，回退生成保底音频:`, err);
      const estimatedDuration = Math.max(2.0, trimmed.length * 0.28);
      return this.generateSilentAudio(projectId, sceneId, estimatedDuration);
    }
  }

  /**
   * 生成标准静音/白噪占位 WAV 音频文件（确保离线或无网时 FFmpeg 混流零报错）
   */
  public static async generateSilentAudio(
    projectId: string,
    sceneId: string,
    durationSeconds: number
  ): Promise<VoiceSynthesisResult> {
    const sampleRate = 44100;
    const numChannels = 2;
    const totalSamples = Math.floor(sampleRate * durationSeconds);
    const dataSize = totalSamples * numChannels * 2; // 16-bit
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF 标识符
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    // fmt 子块
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    // data 子块
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);

    const assetMeta = await assetPersistenceBridge.persistAsset(
      projectId,
      `silent_${sceneId}_${Date.now()}`,
      new Uint8Array(buffer),
      {
        fileName: `silent_${sceneId}.wav`,
        mimeType: 'audio/wav',
      }
    );

    return {
      audioDiskPath: assetMeta.localDiskPath || assetMeta.uri,
      audioUri: assetMeta.uri,
      duration: durationSeconds,
    };
  }

  /**
   * 生成标准赛博朋克氛围 BGM 音频
   */
  public static async generateAmbientBgm(projectId: string): Promise<string> {
    const durationSeconds = 30.0;
    const sampleRate = 22050;
    const totalSamples = Math.floor(sampleRate * durationSeconds);
    const dataSize = totalSamples * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    view.setUint32(0, 0x52494646, false);
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false);
    view.setUint32(12, 0x666d7420, false);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false);
    view.setUint32(40, dataSize, true);

    // 生成平缓的 110Hz / 220Hz 低频赛博暗黑弦乐氛围音
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const wave = Math.sin(2 * Math.PI * 110 * t) * 0.3 + Math.sin(2 * Math.PI * 220 * t + 0.5) * 0.15;
      const sample = Math.floor(wave * 32767 * 0.15);
      view.setInt16(44 + i * 2, sample, true);
    }

    const meta = await assetPersistenceBridge.persistAsset(
      projectId,
      `bgm_ambient_${projectId}`,
      new Uint8Array(buffer),
      {
        fileName: 'bgm_ambient.wav',
        mimeType: 'audio/wav',
      }
    );

    return meta.localDiskPath || meta.uri;
  }
}
