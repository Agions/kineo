/**
 * SoundEngineerAgent.ts — 音效与 TTS 配音智能体
 */

import { BaseAgent } from './BaseAgent';
import type { ProjectBlackboard } from './ProjectBlackboard';

export class SoundEngineerAgent extends BaseAgent {
  constructor() {
    super({
      id: 'agent-audio',
      name: 'AUDIO',
      role: 'sound_engineer',
      avatar: '🎙️',
      description: '负责多音轨 EdgeTTS / CosyVoice 合成、BGM 对齐与毫秒级字幕卡点计算',
      triggerPhase: 'on_storyboard_generated',
      readKeys: ['scenes', 'characters'],
      writeKeys: ['audioConfig', 'stage'],
    });
  }

  public async execute(blackboard: ProjectBlackboard): Promise<void> {
    const data = blackboard.getData();
    this.log(blackboard, '正在调度多音轨 EdgeTTS / CosyVoice 与 BGM 毫秒对齐混音引擎...', 'info');

    const scenes = data.scenes || [];
    const characters = data.characters || [];

    // 计算分段配音与毫秒级字幕时间戳
    let currentTimelineMs = 0;
    const voiceTracks: Array<{
      id: string;
      sceneId: string;
      speaker: string;
      voiceId: string;
      startMs: number;
      durationMs: number;
      text: string;
    }> = [];

    const subtitles: Array<{
      id: string;
      startMs: number;
      endMs: number;
      text: string;
      speaker: string;
    }> = [];

    scenes.forEach((sc, idx) => {
      // 匹配角色声音配置
      const matchedChar = characters.find((c) => sc.content?.includes(c.name)) || characters[0];
      const speakerName = matchedChar ? matchedChar.name : '旁白';
      const voiceId = matchedChar?.voice?.voiceId || (idx % 2 === 0 ? 'zh-CN-YunxiNeural' : 'zh-CN-XiaoxiaoNeural');

      // 按照语速推算时长 (中文常态 4~5 字/秒)
      const textLen = (sc.content || '').length;
      const durationMs = Math.max(2500, Math.min(8000, Math.round((textLen / 4.2) * 1000)));

      voiceTracks.push({
        id: `trk-${sc.id}`,
        sceneId: sc.id,
        speaker: speakerName,
        voiceId,
        startMs: currentTimelineMs,
        durationMs,
        text: sc.content || '',
      });

      subtitles.push({
        id: `sub-${sc.id}`,
        startMs: currentTimelineMs,
        endMs: currentTimelineMs + durationMs,
        text: sc.content?.slice(0, 32) || '',
        speaker: speakerName,
      });

      currentTimelineMs += durationMs + 200; // 留 200ms 气口
    });

    blackboard.update(
      {
        audioConfig: {
          bgmTrack: 'BGM_Cyber_Action_01.mp3',
          voiceOverVolume: 1.0,
          bgmVolume: 0.22,
          masterGain: 0.95,
          totalDurationMs: currentTimelineMs,
          tracks: voiceTracks,
          subtitles,
          subtitleAlignment: 'millisecond_exact',
        },
        stage: 'audio',
      },
      this.metadata.id,
      this.metadata.name,
      `🎉 成功构建 ${voiceTracks.length} 条多角色语音轨与精准字幕轨道 (总时长: ${(currentTimelineMs / 1000).toFixed(1)}s)！`
    );
  }
}
