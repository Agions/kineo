/**
 * 小说分析辅助工具函数
 * 从 novel-analyze-service.ts 中提取的纯函数，不依赖实例状态
 */

import type { NovelScene } from '@/core/types';

// ========== 文本提取工具 ==========

/**
 * 从文本中提取人名
 */
export function extractCharacterNames(text: string): string[] {
  const names = new Set<string>();

  // 中文名模式
  const cnPattern = /[\u4e00-\u9fa5]{2,4}(?=(说|道|问|答|喊|叫|回答|告诉))/g;
  const cnMatches = text.match(cnPattern) ?? [];
  cnMatches.forEach((n) => names.add(n));

  // 英文名模式
  const enPattern = /[A-Z][a-z]+(?=\s+says|\s+asks|\s+answered)/g;
  const enMatches = text.match(enPattern) ?? [];
  enMatches.forEach((n) => names.add(n));

  return Array.from(names).slice(0, 5);
}

/**
 * 从文本中提取地点
 */
export function extractLocations(text: string): string[] {
  const locationKeywords = [
    '学校',
    '医院',
    '商场',
    '公园',
    '图书馆',
    '办公室',
    '家',
    '房间',
    '教室',
    '餐厅',
    '咖啡厅',
    '街道',
    '城市',
    '乡村',
    '山',
    '海',
    '河',
    '湖',
    '森林',
    '花园',
    '广场',
    '车站',
    '机场',
  ];

  return locationKeywords.filter((keyword) => text.includes(keyword));
}

/**
 * 从文本中提取时间段
 */
export function extractTimePeriod(text: string): string | undefined {
  const timeKeywords = [
    { pattern: /早上|清晨|黎明|早晨/, value: '清晨' },
    { pattern: /中午|正午|午间/, value: '中午' },
    { pattern: /下午|午后/, value: '下午' },
    { pattern: /傍晚|黄昏|夕阳/, value: '黄昏' },
    { pattern: /晚上|夜间|深夜|午夜/, value: '夜晚' },
  ];

  for (const { pattern, value } of timeKeywords) {
    if (pattern.test(text)) return value;
  }
  return undefined;
}

/**
 * 生成默认图像提示词
 */
export function generateDefaultPrompt(scene: NovelScene): string {
  const elements: string[] = [];

  if (scene.location) elements.push(scene.location);
  if (scene.time) elements.push(scene.time);
  if (scene.characters.length > 0) elements.push(scene.characters.slice(0, 2).join(', '));

  return `${elements.join(', ')}, manga style, high quality, detailed`;
}

// ========== 对话提取模式 ==========

/** 对话提取正则模式（导出供复用） */
export const DIALOGUE_PATTERNS: RegExp[] = [
  /「([^」]+)」/g, // 中文引号
  /『([^』]+)』/g, // 中文双引号
  /"([^"]+)"/g, // 英文双引号
  /"([^"]+)"/g, // 英文双引号
  /([A-Z][a-z]+)\s*:\s*([^。]+。?)/g, // 英文名:对话
  /([\u4e00-\u9fa5]{2,4})[：:]\s*([^。]+。?)/g, // 中文名:对话
];

/** 章节标题检测正则模式 */
export const CHAPTER_PATTERNS: RegExp[] = [
  /^第[一二三四五六七八九十百千\d]+章[：:\s]*(.+)$/gm,
  /^第[一二三四五六七八九十百千\d]+节[：:\s]*(.+)$/gm,
  /^Chapter\s+\d+[：:\s]*(.+)$/gim,
  /^第[一二三四五六七八九十百千\d]+卷.*$/gm,
];

/**
 * 构造 NovelScene 对象。
 * 内部 helper — 消除 ruleBasedSegmentation 内 15L scenes.push({...}) 模板重复。
 */
function createScene(chapterId: string, sceneNumber: number, content: string): NovelScene {
  return {
    id: `scene_${chapterId}_${sceneNumber}`,
    chapterId,
    sceneNumber,
    content: content.trim(),
    characters: extractCharacterNames(content),
    startPosition: 0,
    endPosition: content.length,
    dialogues: [],
    emotions: [],
    tags: [],
  };
}

/**
 * 基于规则的场景分割（备用方案）
 */
export function ruleBasedSegmentation(
  chapter: { id: string; content: string },
  sceneMinLength: number
): NovelScene[] {
  const scenes = [];
  const content = chapter.content;

  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim());

  let currentSceneContent = '';
  let sceneNumber = 0;

  for (const paragraph of paragraphs) {
    currentSceneContent += paragraph + '\n\n';

    if (
      currentSceneContent.length >= sceneMinLength &&
      (paragraph.includes('。') || paragraph.includes('！') || paragraph.includes('？'))
    ) {
      sceneNumber++;
      scenes.push(createScene(chapter.id, sceneNumber, currentSceneContent));
      currentSceneContent = '';
    }
  }

  // 处理剩余内容
  if (currentSceneContent.trim()) {
    sceneNumber++;
    scenes.push(createScene(chapter.id, sceneNumber, currentSceneContent));
  }

  return scenes;
}
