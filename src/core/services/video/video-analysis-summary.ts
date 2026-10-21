/**
 * Video analysis summary generation — extracted from video-analysis-service.ts
 *
 * AI-powered summary with fallback to default summary on failure.
 */

import type { VideoAnalysis, VideoInfo } from '@/core/types';
import { formatTime } from '@/core/utils';
import { aiService } from '@/core/services/ai/text/ai-service';
import { logger } from '@/core/utils/logger';

import { groupObjectsByCategory } from './video-analysis-utils';

/**
 * 构造 AI 摘要 prompt
 */
function buildSummaryPrompt(videoInfo: VideoInfo, analysis: Partial<VideoAnalysis>): string {
  const sceneLines = analysis.scenes?.map((s) => `- ${s.type}: ${s.description}`).join('\n') || '无';
  const objectLines =
    groupObjectsByCategory(analysis.objects ?? [])
      .map(([cat, objs]) => `- ${cat}: ${objs.length}个`)
      .join('\n') || '无';

  return `请为以下视频生成一个简洁的内容摘要：

视频信息：
- 时长：${formatTime(videoInfo.duration!)}
- 分辨率：${videoInfo.width}x${videoInfo.height}
- 格式：${videoInfo.format}

场景分析：
${sceneLines}

物体识别：
${objectLines}

请生成 2-3 句话的内容摘要。`;
}

/**
 * 生成默认摘要（当 AI 失败时回退）
 */
function generateDefaultSummary(videoInfo: VideoInfo, analysis: Partial<VideoAnalysis>): string {
  const sceneCount = analysis.scenes?.length ?? 0;
  const objectTypes = Object.keys(analysis.stats?.objectCategories ?? {});

  return (
    `视频时长 ${formatTime(videoInfo.duration!)}，分辨率 ${videoInfo.width}x${videoInfo.height}。` +
    `包含 ${sceneCount} 个场景${objectTypes.length > 0 ? `，主要元素包括 ${objectTypes.slice(0, 3).join('、')}` : ''}。`
  );
}

/**
 * AI 生成视频内容摘要（失败时回退到默认摘要）
 */
export async function generateSummary(
  videoInfo: VideoInfo,
  analysis: Partial<VideoAnalysis>,
  ai: typeof aiService = aiService
): Promise<string> {
  try {
    return await ai.generate(buildSummaryPrompt(videoInfo, analysis), {
      model: 'gpt-3.5-turbo',
      provider: 'openai',
    });
  } catch (error) {
    logger.error('生成摘要失败:', error);
    return generateDefaultSummary(videoInfo, analysis);
  }
}