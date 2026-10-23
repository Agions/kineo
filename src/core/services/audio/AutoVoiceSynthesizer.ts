/**
 * AutoVoiceSynthesizer.ts — 多角色自动配音、剧场级音效 (SFX) 与音频持久化管线
 *
 * 核心功能：
 * 1. 自动根据角色性别与性格动态分配 Edge-TTS 音色（男主: zh-CN-YunxiNeural, 女主: zh-CN-XiaoxiaoNeural, 旁白: zh-CN-YunjianNeural）。
 * 2. 情绪感知语速与音调自适应调节（感叹号/战斗/咆哮词句动态加速与重音）。
 * 3. 剧场级物理动作音效 (SFX) 程序化合成与混流（拔剑金铁鸣响、雷霆震爆、重拳冲击、赛博全息扫频）。
 * 4. 离线/弱网自动平滑降级生成标准 PCM 音频并持久化，保障 FFmpeg 混流零中断。
 */

import { assetPersistenceBridge } from '@/core/services/data-bus/AssetPersistenceBridge';
import { ttsService } from '@/core/services/audio/tts-service';
import { logger } from '@/core/utils/logger';

export interface VoiceSynthesisResult {
  audioDiskPath: string; // 本地物理磁盘绝对路径，供 FFmpeg -i 使用
  audioUri: string;      // asset:// 或 blob: URL，供前端 <audio> 试听
  duration: number;      // 实际音频时长（秒）
  sfxPath?: string;      // 伴随动作音效物理路径（若触发）
}

export interface MangaVoiceProfile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  style: string;
  previewSample: string;
}

export const MANGA_VOICE_CATALOG: MangaVoiceProfile[] = [
  // 男声库
  { id: 'zh-CN-YunxiNeural', name: '云希', gender: 'male', style: '热血少年 / 青年主角', previewSample: '只要还有一口气在，我就绝不会放弃！' },
  { id: 'zh-CN-YunyangNeural', name: '云扬', gender: 'male', style: '沉稳剑客 / 冷静智囊', previewSample: '局势已定，接下来看我的动作。' },
  { id: 'zh-CN-YunjianNeural', name: '云健', gender: 'male', style: '苍劲老者 / 反派首脑 / 旁白', previewSample: '宿命的轮盘一旦启动，谁也无法逃脱。' },
  { id: 'zh-CN-YunxiaNeural', name: '云夏', gender: 'male', style: '元气正太 / 少年师弟', previewSample: '师兄！等等我，我也要去！' },
  { id: 'zh-CN-liaoning-XiaobeiNeural', name: '东北小北', gender: 'male', style: '幽默豪爽 / 义气兄弟', previewSample: '哎呀妈呀，兄弟你这招也太狠了吧！' },
  { id: 'zh-TW-YunJheNeural', name: '云哲', gender: 'male', style: '温润儒雅 / 深情男二', previewSample: '无论前路如何，我都愿意陪你走下去。' },
  { id: 'zh-HK-WanLungNeural', name: '云龙 (粤语)', gender: 'male', style: '港风枭雄 / 狠厉决绝', previewSample: '出得嚟行，预咗要还！' },

  // 女声库
  { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓', gender: 'female', style: '清丽活泼 / 甜美女主', previewSample: '快看！天边的晨光已经亮起来了！' },
  { id: 'zh-CN-XiaoyiNeural', name: '晓伊', gender: 'female', style: '清冷出尘 / 冷酷女刺客', previewSample: '退后，不要妨碍我拔剑。' },
  { id: 'zh-CN-YunjieNeural', name: '云洁', gender: 'female', style: '成熟干练 / 霸气御姐', previewSample: '在本宫面前，还轮不到你来指手画脚。' },
  { id: 'zh-CN-XiaomengNeural', name: '晓梦', gender: 'female', style: '软萌可爱 / 元气萝莉', previewSample: '哇！这个真的好神奇呀，教教我嘛！' },
  { id: 'zh-TW-HsiaoChenNeural', name: '晓臻', gender: 'female', style: '温柔体贴 / 邻家师姐', previewSample: '累了吧，先喝杯热茶休息一下吧。' },
  { id: 'zh-HK-HiuGaaiNeural', name: '晓佳 (粤语)', gender: 'female', style: '傲娇飒爽 / 现代女强', previewSample: '讲多无谓，手底下见真章啦！' },
];

export type SfxType = 'sword_clash' | 'thunder_strike' | 'impact_hit' | 'cyber_chime';

export class AutoVoiceSynthesizer {
  // TTS 并发限流队列与缓存
  private static activeRequests = 0;
  private static readonly MAX_CONCURRENT_REQUESTS = 3;
  private static readonly REQUEST_QUEUE: Array<() => void> = [];
  private static readonly MEMORY_CACHE = new Map<string, VoiceSynthesisResult>();

  private static async acquireSlot(): Promise<void> {
    if (this.activeRequests < this.MAX_CONCURRENT_REQUESTS) {
      this.activeRequests++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.REQUEST_QUEUE.push(() => {
        this.activeRequests++;
        resolve();
      });
    });
  }

  private static releaseSlot(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.REQUEST_QUEUE.length > 0) {
      const next = this.REQUEST_QUEUE.shift();
      next?.();
    }
  }

  private static getCacheKey(text: string, voice: string, speed: number, pitch: number): string {
    return `${voice}_s${speed}_p${pitch}_${text}`;
  }
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

    return 'zh-CN-YunxiNeural'; // 坚毅青年男声
  }

  /**
   * 合成单条对白音频并落盘 (含情绪感应与动作音效联动，支持角色指定专属音色)
   */
  public static async synthesizeDialogue(
    projectId: string,
    sceneId: string,
    speaker: string,
    text: string,
    genderOrVoiceId?: 'male' | 'female' | 'unknown' | string,
    customTuning?: { pitch?: number; speed?: number }
  ): Promise<VoiceSynthesisResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return this.generateSilentAudio(projectId, sceneId, 2.0);
    }

    // 若传入具体音色 ID 则直接使用，否则根据角色名字和性别智能推荐
    let voice = 'zh-CN-YunxiNeural';
    if (genderOrVoiceId && genderOrVoiceId.includes('Neural')) {
      voice = genderOrVoiceId;
    } else {
      voice = this.selectVoiceForCharacter(speaker, genderOrVoiceId as any);
    }

    // 情绪感知与语调自适应
    const hasExclamation = trimmed.includes('!') || trimmed.includes('！');
    const isActionCue = /拔剑|斩|死|杀|爆|战|冲|逃|混蛋|绝不/.test(trimmed);
    const speed = customTuning?.speed ?? (hasExclamation || isActionCue ? 1.08 : 1.0);
    const pitch = customTuning?.pitch ?? (isActionCue ? 1.05 : 1.0);

    let sfxPath: string | undefined;
    const detectedSfx = this.detectSfxCue(trimmed);
    if (detectedSfx) {
      try {
        sfxPath = await this.generateDramaticSfx(projectId, sceneId, detectedSfx);
      } catch (err) {
        logger.warn('[AutoVoiceSynthesizer] 伴随 SFX 生成异常:', err);
      }
    }

    const cacheKey = this.getCacheKey(trimmed, voice, speed, pitch);
    if (this.MEMORY_CACHE.has(cacheKey)) {
      const cached = this.MEMORY_CACHE.get(cacheKey)!;
      logger.info(`[AutoVoiceSynthesizer] 命中文本配音缓存 [${speaker}]: "${trimmed.slice(0, 16)}..."`);
      return {
        ...cached,
        sfxPath: sfxPath || cached.sfxPath,
      };
    }

    await this.acquireSlot();
    try {
      logger.info(`[AutoVoiceSynthesizer] 排队准入，正在合成角色 [${speaker}] 对白 (音色: ${voice}, 情绪张力: ${isActionCue ? '战斗' : '日常'}): "${trimmed.slice(0, 20)}..."`);
      
      let lastErr: unknown;
      let response: { audio: ArrayBuffer; duration: number } | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((r) => setTimeout(r, 600 * attempt));
          }
          response = await ttsService.synthesize({
            text: trimmed,
            config: {
              provider: 'edge',
              voice,
              speed,
              pitch,
              volume: 1.0,
              format: 'audio-24khz-48kbitrate-mono-mp3',
            },
          });
          break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (!response) {
        throw lastErr || new Error('TTS 合成重试失败');
      }

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

      const res: VoiceSynthesisResult = {
        audioDiskPath: assetMeta.localDiskPath || assetMeta.uri,
        audioUri: assetMeta.uri,
        duration: Math.max(1.5, response.duration),
        sfxPath,
      };

      this.MEMORY_CACHE.set(cacheKey, res);
      return res;
    } catch (err) {
      logger.warn(`[AutoVoiceSynthesizer] 在线 TTS 合成异常，回退生成保底音频:`, err);
      const estimatedDuration = Math.max(2.0, trimmed.length * 0.28);
      return this.generateSilentAudio(projectId, sceneId, estimatedDuration);
    } finally {
      this.releaseSlot();
    }
  }

  /**
   * 角色音色实时试听合成 (Audition Preview)
   */
  public static async auditionVoice(
    voiceId: string,
    sampleText?: string,
    speed: number = 1.0,
    pitch: number = 1.0
  ): Promise<{ audioUri: string; duration: number }> {
    const textToSpeak = sampleText || '这就是我的漫剧配音，听起来怎么样？';
    const cacheKey = `audition_${voiceId}_s${speed}_p${pitch}_${textToSpeak}`;

    if (this.MEMORY_CACHE.has(cacheKey)) {
      const cached = this.MEMORY_CACHE.get(cacheKey)!;
      return { audioUri: cached.audioUri, duration: cached.duration };
    }

    await this.acquireSlot();
    try {
      const response = await ttsService.synthesize({
        text: textToSpeak,
        config: {
          provider: 'edge',
          voice: voiceId,
          speed,
          pitch,
          volume: 1.0,
          format: 'audio-24khz-48kbitrate-mono-mp3',
        },
      });

      const audioBuffer = new Uint8Array(response.audio);
      const assetMeta = await assetPersistenceBridge.persistAsset(
        'temp_audition',
        `audition_${voiceId}_${Date.now()}`,
        audioBuffer,
        {
          fileName: `audition_${voiceId}.mp3`,
          mimeType: 'audio/mpeg',
        }
      );

      const res = {
        audioUri: assetMeta.uri,
        duration: Math.max(1.0, response.duration),
      };

      this.MEMORY_CACHE.set(cacheKey, {
        audioDiskPath: assetMeta.localDiskPath || assetMeta.uri,
        audioUri: assetMeta.uri,
        duration: res.duration,
      });

      return res;
    } catch (err) {
      logger.warn('[AutoVoiceSynthesizer] 试听语音合成失败:', err);
      // Fallback: 构造简短的提示音
      const silentRes = await this.generateSilentAudio('temp_audition', `audition_${Date.now()}`, 1.5);
      return { audioUri: silentRes.audioUri, duration: 1.5 };
    } finally {
      this.releaseSlot();
    }
  }

  /**
   * 自动探测文本中蕴含的动作音效线索 (SFX Trigger)
   */
  public static detectSfxCue(text: string): SfxType | null {
    if (/剑|刃|斩|刀|刺|锋/.test(text)) return 'sword_clash';
    if (/雷|电|震|炸|爆|天罚/.test(text)) return 'thunder_strike';
    if (/撞|倒|拳|击|砸|破/.test(text)) return 'impact_hit';
    if (/系统|芯片|算力|数据|光纤|扫描/.test(text)) return 'cyber_chime';
    return null;
  }

  /**
   * 程序化合成剧场级动作音效 (16-bit PCM WAV)
   */
  public static async generateDramaticSfx(
    projectId: string,
    sceneId: string,
    sfxType: SfxType
  ): Promise<string> {
    const duration = sfxType === 'thunder_strike' ? 2.5 : 1.2;
    const sampleRate = 22050;
    const totalSamples = Math.floor(sampleRate * duration);
    const dataSize = totalSamples * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // WAV Header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      switch (sfxType) {
        case 'sword_clash': {
          // 金铁相交撞击清鸣 (2400Hz + 1800Hz 快速指数衰减)
          const env = Math.exp(-t * 6.0);
          sample = (Math.sin(2 * Math.PI * 2400 * t) * 0.6 + Math.sin(2 * Math.PI * 1820 * t) * 0.4) * env;
          break;
        }
        case 'thunder_strike': {
          // 低频滚雷与爆炸衰减 (55Hz 扫频 + 衰减白噪)
          const env = Math.exp(-t * 2.2);
          const noise = (Math.random() * 2 - 1) * 0.35 * Math.exp(-t * 8.0);
          const rumble = Math.sin(2 * Math.PI * Math.max(35, 65 - t * 15) * t) * 0.65;
          sample = (rumble + noise) * env;
          break;
        }
        case 'impact_hit': {
          // 重拳/落地冲击沉闷声 (从 120Hz 骤降到 35Hz)
          const freq = Math.max(35, 120 - t * 300);
          const env = Math.exp(-t * 7.5);
          sample = Math.sin(2 * Math.PI * freq * t) * env;
          break;
        }
        case 'cyber_chime': {
          // 赛博全息音 (上升扫频 880Hz -> 1760Hz)
          const freq = 880 + t * 900;
          const env = Math.exp(-t * 3.5);
          sample = Math.sin(2 * Math.PI * freq * t) * env * 0.5;
          break;
        }
      }

      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(44 + i * 2, Math.floor(clamped * 32767), true);
    }

    const meta = await assetPersistenceBridge.persistAsset(
      projectId,
      `sfx_${sceneId}_${sfxType}`,
      new Uint8Array(buffer),
      {
        fileName: `sfx_${sceneId}_${sfxType}.wav`,
        mimeType: 'audio/wav',
      }
    );

    return meta.localDiskPath || meta.uri;
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
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false);
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
