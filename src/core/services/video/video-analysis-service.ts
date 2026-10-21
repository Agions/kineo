/**
 * AI 视频分析服务 - Video Analysis Service
 *
 * 拆分为：
 *   - video-analysis-constants.ts  常量与配置
 *   - video-analysis-types.ts     类型定义
 *   - video-analysis-utils.ts     纯函数工具（关键帧/场景/物体/情感/统计）
 *   - video-analysis-summary.ts   AI 摘要生成
 *   - 本文件                       服务类 + 编排
 */

import type { VideoAnalysis, VideoInfo } from '@/core/types';
import { aiService } from '@/core/services/ai/text/ai-service';

import {
  DEFAULT_ANALYSIS_CONFIG,
  SUGGESTION_BUILDERS,
  type VideoAnalysisConfig,
} from './video-analysis-constants';
import { generateSummary } from './video-analysis-summary';
import {
  calculateStats,
  createEmptyAnalysis,
  detectObjects,
  detectScenes,
  analyzeEmotions,
  extractKeyframes,
} from './video-analysis-utils';

export {
  DEFAULT_ANALYSIS_CONFIG,
  SCENE_TYPES,
  SCENE_DESCRIPTIONS,
  EMOTION_LABELS,
  OBJECT_CATEGORIES,
  COMMON_OBJECTS,
  SCENE_AVG_DURATION_SECONDS,
  UNKNOWN_SCENE_DESCRIPTION,
  type SceneType,
  type VideoAnalysisConfig,
} from './video-analysis-constants';

class AbortControllerRegistry {
  private controllers: Map<string, AbortController> = new Map();

  register(id: string): AbortController {
    const controller = new AbortController();
    this.controllers.set(id, controller);
    return controller;
  }

  cancel(id: string): boolean {
    const controller = this.controllers.get(id);
    if (!controller) return false;
    controller.abort();
    this.controllers.delete(id);
    return true;
  }

  get(id: string): AbortController | undefined {
    return this.controllers.get(id);
  }

  get size(): number {
    return this.controllers.size;
  }

  clear(): void {
    this.controllers.clear();
  }
}

/**
 * 基于视频分析结果生成改进建议
 */
function getSuggestions(analysis: VideoAnalysis): string[] {
  const suggestions: string[] = [];
  for (const builder of SUGGESTION_BUILDERS) {
    const suggestion = builder(analysis);
    if (suggestion) suggestions.push(suggestion);
  }
  return suggestions;
}

/**
 * AI 视频分析服务
 */
class VideoAnalysisService {
  private abortRegistry = new AbortControllerRegistry();

  extractKeyframes = extractKeyframes;
  detectScenes = detectScenes;
  detectObjects = detectObjects;
  analyzeEmotions = analyzeEmotions;
  generateSummary = generateSummary;

  async analyzeVideo(
    videoInfo: VideoInfo,
    config: Partial<VideoAnalysisConfig> = {}
  ): Promise<VideoAnalysis> {
    const finalConfig = { ...DEFAULT_ANALYSIS_CONFIG, ...config };
    const result = createEmptyAnalysis(videoInfo);

    if (finalConfig.enableKeyframeExtraction) {
      result.keyframes = await this.extractKeyframes(videoInfo, finalConfig.maxKeyframes);
    }
    if (finalConfig.enableSceneDetection) {
      result.scenes = await this.detectScenes(videoInfo, finalConfig.sceneThreshold);
    }
    if (finalConfig.enableObjectDetection) {
      result.objects = await this.detectObjects(videoInfo, result.scenes);
    }
    if (finalConfig.enableEmotionAnalysis) {
      result.emotions = await this.analyzeEmotions(videoInfo, result.scenes);
    }
    if (finalConfig.enableContentSummary) {
      result.summary = await this.generateSummary(videoInfo, result, aiService);
    }
    result.stats = calculateStats(result);

    return result;
  }

  cancelAnalysis(analysisId: string): void {
    this.abortRegistry.cancel(analysisId);
  }

  getSuggestions(analysis: VideoAnalysis): string[] {
    return getSuggestions(analysis);
  }
}

export const videoAnalysisService = new VideoAnalysisService();
export default videoAnalysisService;