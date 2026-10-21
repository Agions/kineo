/**
 * Video analysis utility functions — extracted from video-analysis-service.ts
 *
 * Pure helper functions for video analysis (no class state, no IO).
 * Split out to reduce the main service file size.
 */

import { v4 as uuidv4 } from 'uuid';

import type {
  EmotionAnalysis,
  Keyframe,
  ObjectDetection,
  VideoAnalysis,
  VideoInfo,
  VideoScene,
} from '@/core/types';
import { formatTime } from '@/core/utils';

import {
  COMMON_OBJECTS,
  EMOTION_LABELS,
  OBJECT_CATEGORIES,
  SCENE_AVG_DURATION_SECONDS,
  SCENE_DESCRIPTIONS,
  SCENE_TYPES,
  UNKNOWN_SCENE_DESCRIPTION,
} from './video-analysis-constants';
import type { SceneType } from './video-analysis-types';

// ========== Random generators ==========

export function generateObjectConfidence(): number {
  return 0.5 + Math.random() * 0.5;
}

export function generateRandomBbox(): { x: number; y: number; width: number; height: number } {
  return {
    x: Math.random() * 0.8,
    y: Math.random() * 0.8,
    width: 0.1 + Math.random() * 0.3,
    height: 0.1 + Math.random() * 0.3,
  };
}

export function generateSceneConfidence(): number {
  return 0.7 + Math.random() * 0.3;
}

// ========== Factory helpers ==========

export function pickSceneTypeByIndex(
  index: number,
  samples: readonly SceneType[] = SCENE_TYPES.slice(0, 5)
): SceneType {
  return samples[index % samples.length] as SceneType;
}

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickObjectCountForScene(): number {
  return Math.floor(Math.random() * 3) + 1;
}

export function createEmptyAnalysis(videoInfo: VideoInfo, analysisId?: string): VideoAnalysis {
  return {
    id: analysisId ?? uuidv4(),
    videoId: videoInfo.id,
    scenes: [],
    keyframes: [],
    objects: [],
    emotions: [],
    summary: '',
    stats: {
      sceneCount: 0,
      objectCount: 0,
      avgSceneDuration: 0,
      sceneTypes: {},
      objectCategories: {},
      dominantEmotions: {},
    },
    createdAt: new Date().toISOString(),
  };
}

// ========== Array helpers ==========

export function normalizeEmotionScores<T extends { score: number }>(emotions: T[]): T[] {
  const total = emotions.reduce((sum, e) => sum + e.score, 0);
  if (total > 0) {
    emotions.forEach((e) => (e.score = e.score / total));
  }
  return emotions;
}

export function findDominant<T extends { score: number }>(emotions: T[]): T {
  return emotions.reduce((max, e) => (e.score > max.score ? e : max), emotions[0]);
}

export function countBy<T>(items: T[], keyFn: (item: T) => string | undefined): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    const key = keyFn(item) ?? 'unknown';
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

export function groupObjectsByCategory(
  objects: ObjectDetection[]
): [string, ObjectDetection[]][] {
  const groups = new Map<string, ObjectDetection[]>();
  objects.forEach((obj) => {
    const list = groups.get(obj.category) ?? [];
    list.push(obj);
    groups.set(obj.category, list);
  });
  return Array.from(groups.entries());
}

// ========== Detection algorithms ==========

export function extractKeyframes(videoInfo: VideoInfo, count: number = 10): Keyframe[] {
  const keyframes: Keyframe[] = [];
  const duration = videoInfo.duration!;
  const interval = duration / (count + 1);

  for (let i = 1; i <= count; i++) {
    const timestamp = Math.round(interval * i);
    keyframes.push({
      id: uuidv4(),
      timestamp,
      thumbnail: '',
      description: `第 ${i} 个关键帧于 ${formatTime(timestamp)}`,
    });
  }
  return keyframes;
}

export function getSceneDescription(type: SceneType): string {
  return SCENE_DESCRIPTIONS[type] ?? UNKNOWN_SCENE_DESCRIPTION;
}

export function detectScenes(videoInfo: VideoInfo, _threshold: number = 0.3): VideoScene[] {
  const scenes: VideoScene[] = [];
  const duration = videoInfo.duration;
  const avgSceneDuration = SCENE_AVG_DURATION_SECONDS;
  const sceneCount = Math.max(1, Math.floor(duration! / avgSceneDuration));

  const sceneTypeSamples: readonly SceneType[] = SCENE_TYPES.slice(0, 5);

  for (let i = 0; i < sceneCount; i++) {
    const startTime = Math.round(i * avgSceneDuration);
    const endTime = Math.min(Math.round((i + 1) * avgSceneDuration), duration!);
    const sceneType = pickSceneTypeByIndex(i, sceneTypeSamples);

    scenes.push({
      id: uuidv4(),
      startTime,
      endTime,
      thumbnail: '',
      description: getSceneDescription(sceneType),
      tags: [sceneType, `场景${i + 1}`],
      type: sceneType,
      confidence: generateSceneConfidence(),
    });
  }
  return scenes;
}

export function detectObjects(_videoInfo: VideoInfo, scenes: VideoScene[]): ObjectDetection[] {
  const detections: ObjectDetection[] = [];
  for (const scene of scenes) {
    const objectCount = pickObjectCountForScene();
    for (let i = 0; i < objectCount; i++) {
      const category = pickRandom(OBJECT_CATEGORIES);
      const label = pickRandom(COMMON_OBJECTS);
      detections.push({
        id: uuidv4(),
        sceneId: scene.id,
        category,
        label,
        confidence: generateObjectConfidence(),
        bbox: generateRandomBbox(),
        timestamp: scene.startTime,
      });
    }
  }
  return detections;
}

export function analyzeEmotions(_videoInfo: VideoInfo, scenes: VideoScene[]): EmotionAnalysis[] {
  const analyses: EmotionAnalysis[] = [];
  for (const scene of scenes) {
    const emotions = EMOTION_LABELS.map((emotion) => ({
      id: uuidv4(),
      name: emotion,
      score: Math.random(),
    }));
    normalizeEmotionScores(emotions);
    const dominant = findDominant(emotions);
    analyses.push({
      id: uuidv4(),
      sceneId: scene.id,
      timestamp: scene.startTime,
      emotions,
      dominant: dominant.name,
      intensity: dominant.score,
    });
  }
  return analyses;
}

// ========== Stats & aggregation ==========

export function calculateStats(analysis: VideoAnalysis): VideoAnalysis['stats'] {
  const totalDuration = analysis.scenes.reduce((sum, s) => sum + (s.endTime - s.startTime), 0);
  const avgSceneDuration = analysis.scenes.length > 0 ? totalDuration / analysis.scenes.length : 0;
  return {
    sceneCount: analysis.scenes.length,
    objectCount: analysis.objects.length,
    avgSceneDuration,
    sceneTypes: countBy(analysis.scenes, (s) => s.type),
    objectCategories: countBy(analysis.objects, (o) => o.category),
    dominantEmotions: countBy(analysis.emotions, (e) => e.dominant),
  };
}