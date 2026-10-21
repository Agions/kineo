/**
 * Video analysis constants — extracted from video-analysis-service.ts
 *
 * Pure data: scene types, emotion labels, object categories, descriptions.
 */

import type { VideoAnalysis } from '@/core/types';

export interface VideoAnalysisConfig {
  enableSceneDetection: boolean;
  enableObjectDetection: boolean;
  enableEmotionAnalysis: boolean;
  enableContentSummary: boolean;
  enableKeyframeExtraction: boolean;
  sceneThreshold: number;
  maxKeyframes: number;
}

export const DEFAULT_ANALYSIS_CONFIG: VideoAnalysisConfig = {
  enableSceneDetection: true,
  enableObjectDetection: true,
  enableEmotionAnalysis: true,
  enableContentSummary: true,
  enableKeyframeExtraction: true,
  sceneThreshold: 0.3,
  maxKeyframes: 10,
};

export const SCENE_TYPES = [
  'intro',
  'dialogue',
  'action',
  'narration',
  'transition',
  'explanation',
  'demo',
  'conclusion',
  'background',
  'highlight',
] as const;

export type SceneType = (typeof SCENE_TYPES)[number];

export const SCENE_DESCRIPTIONS: Record<SceneType, string> = {
  intro: '视频开场部分，通常用于介绍主题',
  dialogue: '对话场景，包含人物交流',
  action: '动作场景，展示具体行为',
  narration: '叙述场景，画外音或旁白',
  transition: '转场过渡',
  explanation: '讲解说明，解释内容',
  demo: '演示展示，操作示范',
  conclusion: '结尾总结，回顾要点',
  background: '背景画面',
  highlight: '精彩高光时刻',
};

export const UNKNOWN_SCENE_DESCRIPTION = '未知场景类型';

export const EMOTION_LABELS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fear'] as const;

export const OBJECT_CATEGORIES = ['人物', '物品', '文字', '背景', '动物', '车辆'] as const;

export const COMMON_OBJECTS = [
  '人物',
  '人脸',
  '文字',
  '手机',
  '电脑',
  '书本',
  '桌子',
  '椅子',
  '窗户',
  '门',
  '杯子',
  '衣服',
] as const;

export const SCENE_AVG_DURATION_SECONDS = 30;

export type SuggestionBuilder = (analysis: VideoAnalysis) => string | null;

export const SUGGESTION_BUILDERS: SuggestionBuilder[] = [
  (a) => (Object.keys(a.stats?.sceneTypes ?? {}).includes('intro') ? null : '建议添加开场场景来吸引观众'),
  (a) => (Object.keys(a.stats?.sceneTypes ?? {}).includes('conclusion') ? null : '建议添加结尾总结来强化内容'),
  (a) => ((a.stats?.dominantEmotions ?? {})['neutral'] > 0.7 ? '情感比较单一，可以增加情感变化' : null),
  (a) =>
    Object.keys(a.stats?.objectCategories ?? {}).length < 3 ? '画面元素较少，可以增加更多视觉元素' : null,
];