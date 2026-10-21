/**
 * 小说分析器门面
 *
 * 把原 456 行单类（9 个方法，4 类职责，2 处与 novel-helpers 重复实现）
 * 拆为 5 个子模块：
 *   - novel-analyze-config.ts         resolveAnalyzeConfig 工厂 + 默认值
 *   - novel-analyze-metadata.ts       extractNovelMetadata（AI 优先 + 兜底）
 *   - novel-analyze-chapter-segments.ts segmentChapters（pattern + 段落均分）
 *   - novel-analyze-scene-segments.ts segmentScenes（AI 并发 + 规则兜底）
 *   - novel-analyze-statistics.ts     calculateAnalyzeStatistics 纯函数
 *
 * 关键修复：
 *   原代码类私有 ruleBasedSegmentation + extractCharacterNames 两个方法
 *   与 novel-helpers 公开函数完全重复（实现字节级一致）——本轮全部
 *   走 novel-helpers 公开函数，类不再持有重复实现。
 *
 * 业务行为完全不变：
 *   - parseNovelContent 7 步编排顺序 1:1 保留
 *   - segmentChapters 第一个匹配上的 pattern 优先 + 段落均分兜底 1:1
 *   - segmentScenes 失败 fallback 调 novel-helpers.ruleBasedSegmentation
 *     （原代码调类私有方法，行为字节级一致）
 *   - extractMetadata 失败 fallback 返回"未命名小说"+ wordCount=content.length
 *   - calculateStatistics 11 个字段 1:1 保留
 *   - exportToScript 委托给 scriptAnalyzer 1:1
 */

import type { AnalyzeConfig, AnalyzeResult } from '@/core/types';
import { scriptAnalyzer } from '@/core/services/ai/text/script-analyzer-service';
import { sceneAnalyzer } from '@/core/services/video/scene-analyzer-service';

import { segmentChapters } from './novel-analyze-chapter-segments';
import { resolveAnalyzeConfig, type ResolvedAnalyzeConfig } from './novel-analyze-config';
import { extractNovelMetadata } from './novel-analyze-metadata';
import { segmentScenes } from './novel-analyze-scene-segments';
import { calculateAnalyzeStatistics } from './novel-analyze-statistics';

class NovelAnalyzer {
  private config: ResolvedAnalyzeConfig;

  constructor(config: AnalyzeConfig = {}) {
    this.config = resolveAnalyzeConfig(config);
  }

  /**
   * 解析小说内容
   * 7 步主流程编排：
   *   1. 提取元数据
   *   2. 分割章节
   *   3. 分割场景
   *   4. 提取角色（委托 sceneAnalyzer）
   *   5. 提取对话（委托 sceneAnalyzer）
   *   6. （预留）情感分析
   *   7. 生成图像提示词（委托 sceneAnalyzer，条件性）
   *   8. 计算统计信息
   */
  async parseNovelContent(content: string): Promise<AnalyzeResult> {
    const novelId = `novel_${Date.now()}`;

    // 1. 提取元数据
    const metadata = await extractNovelMetadata(content, novelId, this.config);

    // 2. 分割章节
    const chapters = segmentChapters(content, novelId, metadata.chapterCount, this.config);

    // 3. 分割场景
    const scenes = await segmentScenes(chapters, this.config);

    // 4. 提取角色（委托给 sceneAnalyzer）
    const characters = await sceneAnalyzer.extractCharacters(content);

    // 5. 提取对话（委托给 sceneAnalyzer）
    for (const scene of scenes) {
      sceneAnalyzer.extractDialogues(scene, characters);
    }

    // 6. 情感分析（注释占位：emotionDetector.detectEmotions(scenes)）

    // 7. 生成图像提示词（委托给 sceneAnalyzer，条件性）
    if (this.config.generatePrompts) {
      await sceneAnalyzer.generateSceneDescriptions(scenes);
    }

    // 8. 计算统计信息
    const statistics = calculateAnalyzeStatistics(metadata, chapters, scenes, characters);

    return {
      metadata,
      chapters,
      scenes,
      characters,
      statistics,
    };
  }

  /**
   * 导出为剧本格式（委托给 scriptAnalyzer）
   */
  exportToScript(
    result: AnalyzeResult,
    format: 'screenplay' | 'comic' | 'manga' = 'manga'
  ): string {
    return scriptAnalyzer.exportToScript(result, format);
  }
}

// 导出单例
export const novelAnalyzer = new NovelAnalyzer();
export default NovelAnalyzer;
