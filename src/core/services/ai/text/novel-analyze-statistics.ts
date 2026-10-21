/**
 * 小说统计信息计算
 *
 * 从 novel-analyze-service.ts 提取的 calculateStatistics 私有方法。
 * 纯函数：无副作用、无外部依赖，便于单元测试。
 *
 * 单一职责：聚合 metadata + chapters + scenes + characters
 * 输出 NovelStatistics：字数/章节数/场景数/角色分类/对话数/平均长度/
 * 地点数/时间段/主导情感/题材。
 */

import type {
  Character,
  Chapter,
  EmotionType,
  NovelMetadata,
  NovelScene,
  NovelStatistics,
} from '@/core/types';

/**
 * 统计每个 emotion 出现的次数。
 */
function countEmotions(scenes: NovelScene[]): Map<EmotionType, number> {
  const counts = new Map<EmotionType, number>();
  for (const scene of scenes) {
    for (const emotion of scene.emotions) {
      counts.set(emotion.type, (counts.get(emotion.type) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * 统计时间段/地点/对话数。
 */
function aggregateSceneMeta(scenes: NovelScene[]) {
  const timePeriods = new Set<string>();
  const locations = new Set<string>();
  let dialogueCount = 0;

  for (const scene of scenes) {
    if (scene.time) timePeriods.add(scene.time);
    if (scene.location) locations.add(scene.location);
    dialogueCount += scene.dialogues.length;
  }

  return { timePeriods, locations, dialogueCount };
}

/**
 * 角色按 role 分类计数。
 */
function classifyCharacters(characters: Character[]) {
  return {
    main: characters.filter((c) => c.role === 'main').length,
    supporting: characters.filter((c) => c.role === 'supporting').length,
    minor: characters.filter((c) => c.role === 'minor').length,
  };
}

/**
 * 聚合所有 NovelStatistics 字段
 */
export function calculateAnalyzeStatistics(
  metadata: NovelMetadata,
  chapters: Chapter[],
  scenes: NovelScene[],
  characters: Character[]
): NovelStatistics {
  const emotionCounts = countEmotions(scenes);
  const { timePeriods, locations, dialogueCount } = aggregateSceneMeta(scenes);
  const { main, supporting, minor } = classifyCharacters(characters);

  return {
    totalWords: metadata.wordCount,
    totalChapters: chapters.length,
    totalScenes: scenes.length,
    totalCharacters: characters.length,
    mainCharacters: main,
    supportingCharacters: supporting,
    minorCharacters: minor,
    dialogueCount,
    avgChapterLength:
      chapters.length > 0 ? chapters.reduce((sum, c) => sum + c.wordCount, 0) / chapters.length : 0,
    avgSceneLength:
      scenes.length > 0 ? scenes.reduce((sum, s) => sum + s.content.length, 0) / scenes.length : 0,
    locationCount: locations.size,
    timePeriods: Array.from(timePeriods),
    dominantEmotions: Object.fromEntries(emotionCounts) as Record<EmotionType, number>,
    genre: metadata.genre,
  };
}
