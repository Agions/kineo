/**
 * episode-types.ts — 漫剧多集连载架构与短剧节奏卡点数据模型
 */

import { NovelScene, Character } from '@/core/script/types/novel';

export type HookType = 'visual_shock' | 'conflict_clash' | 'suspense_question';
export type CliffhangerType = 'plot_twist' | 'life_death' | 'revelation' | 'suspense_cut';

export interface EpisodeHookCue {
  type: HookType;
  description: string;
  suggestedPrompt: string;
  intensity: number; // 0.0 ~ 1.0
  targetSceneId: string;
}

export interface EpisodeCliffhangerCue {
  type: CliffhangerType;
  description: string;
  suspenseText: string;
  retentionScore: number; // 0.0 ~ 1.0
  targetSceneId: string;
}

export interface PacingPill {
  sceneId: string;
  tensionLevel: number; // 0.0 ~ 1.0
  pacingTag: 'hook' | 'exposition' | 'conflict' | 'climax' | 'cliffhanger';
}

export interface MangaEpisode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  synopsis: string;
  scenes: NovelScene[];
  hookCue?: EpisodeHookCue;
  cliffhangerCue?: EpisodeCliffhangerCue;
  pacingCurve: PacingPill[];
  targetDurationSeconds: number;
  estimatedDuration: number;
  status: 'draft' | 'ready' | 'rendering' | 'completed';
  videoPath?: string;
  videoUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MangaSeriesProject {
  id: string;
  title: string;
  description?: string;
  episodes: MangaEpisode[];
  characters: Character[];
  globalPacing: 'fast_paced' | 'dramatic' | 'cinematic';
  totalEpisodes: number;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeSplitOptions {
  targetDurationPerEpisode?: number; // 默认 60~90 秒
  scenesPerEpisode?: number;        // 默认 12~16 镜
  characters?: Character[];
  pacingMode?: 'fast_paced' | 'dramatic' | 'cinematic';
}
