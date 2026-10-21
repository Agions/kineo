/**
 * VideoEditor — 视频编辑器核心引擎
 * ==================================
 * 负责：片段管理、转场计算、字幕轨道、音频混音、帧预览。
 *
 * 设计为纯内存状态机，不涉及 Pipeline Step 接口。
 */

import { RESOLUTION_1080P } from '@/core/constants/media-presets';

import type {
  VideoClip,
  Transition,
  SubtitleBlock,
  AudioTrack,
  VideoEditingConfig,
} from './video-editing-types';

// ========== 辅助函数 ==========

/** 缓动函数：ease-in-out quadratic */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ========== VideoEditor 核心引擎 ==========

export class VideoEditor {
  private clips: VideoClip[] = [];
  private transitions: Map<string, Transition> = new Map();
  private subtitles: SubtitleBlock[] = [];
  private audioTracks: AudioTrack[] = [];
  private config: VideoEditingConfig;

  constructor(config?: VideoEditingConfig) {
    this.config = config ?? {
      resolution: RESOLUTION_1080P,
      fps: 30,
      videoBitrate: '8M',
      audioBitrate: '192k',
      outputFormat: 'mp4',
      enableHardwareAccel: true,
    };
  }

  // ========== 链式构建 API ==========

  addClip(clip: VideoClip): this {
    this.clips.push(clip);
    this.clips.sort((a, b) => a.startTime - b.startTime);
    return this;
  }

  setTransition(clipId1: string, clipId2: string, transition: Transition): this {
    this.transitions.set(`${clipId1}->${clipId2}`, transition);
    return this;
  }

  addSubtitleTrack(subtitles: SubtitleBlock[]): this {
    this.subtitles = subtitles.sort((a, b) => a.startTime - b.startTime);
    return this;
  }

  addAudioTrack(track: AudioTrack): this {
    this.audioTracks.push(track);
    return this;
  }

  // ========== 查询 API ==========

  getDuration(): number {
    if (this.clips.length === 0) return 0;
    const lastClip = this.clips[this.clips.length - 1];
    return lastClip.startTime + lastClip.duration;
  }

  getTransitionPoints(): Array<{
    clipId1: string;
    clipId2: string;
    transition: Transition;
    time: number;
  }> {
    const points: Array<{
      clipId1: string;
      clipId2: string;
      transition: Transition;
      time: number;
    }> = [];

    for (let i = 0; i < this.clips.length - 1; i++) {
      const clip1 = this.clips[i];
      const clip2 = this.clips[i + 1];
      const key = `${clip1.id}->${clip2.id}`;
      const transition = this.transitions.get(key);

      if (transition) {
        // 转场时间点 = 前一个片段结束时间
        const time = clip1.startTime + clip1.duration - transition.duration / 2;
        points.push({ clipId1: clip1.id, clipId2: clip2.id, transition, time });
      }
    }

    return points;
  }

  getSubtitlesAtTime(time: number): SubtitleBlock[] {
    return this.subtitles.filter((s) => time >= s.startTime && time < s.endTime);
  }

  getMixedAudioVolumeAtTime(time: number): number {
    let totalVolume = 0;
    let activeTracks = 0;

    for (const track of this.audioTracks) {
      const inRange = time >= track.startTime && time < track.startTime + track.duration;
      if (inRange) {
        let vol = track.volume;

        // 淡入淡出
        if (track.fadeIn && time < track.startTime + track.fadeIn) {
          vol *= (time - track.startTime) / track.fadeIn;
        }
        if (track.fadeOut && time > track.startTime + track.duration - track.fadeOut) {
          vol *= (track.startTime + track.duration - time) / track.fadeOut;
        }

        totalVolume += vol;
        activeTracks++;
      }
    }

    return Math.min(1.0, totalVolume / (activeTracks || 1));
  }

  renderFrame(time: number): {
    clipId: string | null;
    opacity: number;
    subtitles: SubtitleBlock[];
    audioVolume: number;
  } {
    // 找到当前时间对应的片段（最后一个 startTime <= time 的片段）
    let activeClip: VideoClip | null = null;
    for (let i = this.clips.length - 1; i >= 0; i--) {
      if (time >= this.clips[i].startTime) {
        activeClip = this.clips[i];
        break;
      }
    }

    let opacity = 1.0;

    // 处理转场效果
    const transitions = this.getTransitionPoints();
    for (const tp of transitions) {
      const t = tp.time;
      const td = tp.transition.duration;

      if (time >= t - td && time < t + td) {
        const localTime = (time - (t - td)) / (td * 2);
        const eased = easeInOut(localTime);

        if (tp.transition.type === 'fade') {
          opacity = time < t ? eased : 1 - eased;
        } else if (tp.transition.type === 'dissolve') {
          opacity = time < t ? (1 - eased) * 0.5 + 0.5 : eased * 0.5 + 0.5;
        }
        break;
      }
    }

    return {
      clipId: activeClip?.id ?? null,
      opacity,
      subtitles: this.getSubtitlesAtTime(time),
      audioVolume: this.getMixedAudioVolumeAtTime(time),
    };
  }

  exportConfig(): {
    clips: VideoClip[];
    transitions: Array<{ from: string; to: string; transition: Transition }>;
    subtitles: SubtitleBlock[];
    audioTracks: AudioTrack[];
    config: VideoEditingConfig;
  } {
    const transitionList: Array<{ from: string; to: string; transition: Transition }> = [];
    this.transitions.forEach((transition, key) => {
      const [from, to] = key.split('->');
      transitionList.push({ from, to, transition });
    });

    return {
      clips: this.clips,
      transitions: transitionList,
      subtitles: this.subtitles,
      audioTracks: this.audioTracks,
      config: this.config,
    };
  }
}
