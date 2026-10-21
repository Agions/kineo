/**
 * 场景分析服务 - Scene Analyzer
 *
 * 合并自原 5 个子模块（types / prompt-builder / character-extractor /
 * dialogue-extractor / description-generator），保持对外 API 完全兼容。
 *
 * @module core/services/video/scene-analyzer-service
 */

import type { Character, NovelScene, SceneDescription } from '@/core/types';
import { aiService } from '@/core/services/ai/text/ai-service';
import { DIALOGUE_PATTERNS , generateDefaultPrompt } from '@/core/services/ai/text/novel-helpers';
import { concurrentLimit } from '@/core/utils/concurrency';
import { logger } from '@/core/utils/logger';


/** 场景分析器配置 */
export interface SceneAnalyzerConfig {
  provider?: string;
  model?: string;
}

/** 默认配置 */
export const DEFAULT_SCENE_ANALYZER_CONFIG: Required<SceneAnalyzerConfig> = {
  provider: 'alibaba',
  model: 'qwen-3.5',
};

/** 生成场景描述时的最大并发数 */
export const SCENE_DESCRIPTION_MAX_CONCURRENCY = 5;

/** 内容截断长度 */
export const CHARACTER_EXTRACTION_CONTENT_LIMIT = 5000;

/** 场景内容截断长度 */
export const SCENE_DESCRIPTION_CONTENT_LIMIT = 500;

/** 场景内容截断长度（fallback 路径） */
export const SCENE_DESCRIPTION_FALLBACK_CONTENT_LIMIT = 100;

/** 默认 negativePrompt */
export const DEFAULT_SCENE_NEGATIVE_PROMPT = 'low quality, blurry, distorted';

/** 旁白最小长度阈值 */
export const NARRATOR_MIN_PARAGRAPH_LENGTH = 20;

/** 角色 ID 前缀 */
export const CHARACTER_ID_PREFIX = 'char_';

/** 角色默认字段值 */
export const DEFAULT_CHARACTER_FIELDS = {
  name: '未知角色',
  role: 'minor',
  importance: 1,
} as const;

/**
 * 角色 id 生成
 */
export function generateCharacterId(index: number): string {
  return `${CHARACTER_ID_PREFIX}${Date.now()}_${index}`;
}

/**
 * 把 AI 返回的部分角色数据 + 序号归一为完整 Character
 */
export function createCharacterFromAiResponse(
  aiChar: Partial<Character>,
  index: number
): Character {
  return {
    id: generateCharacterId(index),
    name: aiChar.name ?? DEFAULT_CHARACTER_FIELDS.name,
    aliases: aiChar.aliases ?? [],
    description: aiChar.description ?? '',
    appearance: (aiChar.appearance ?? '') as Character['appearance'],
    personality: aiChar.personality ?? '',
    background: aiChar.background ?? '',
    role: aiChar.role ?? DEFAULT_CHARACTER_FIELDS.role,
    importance: aiChar.importance || DEFAULT_CHARACTER_FIELDS.importance,
    dialogues: [],
    relationships: [],
  };
}


/** 角色提取 prompt 模板 */
const CHARACTER_EXTRACTION_PROMPT = `
请从以下小说内容中提取所有角色信息。

小说内容（前${CHARACTER_EXTRACTION_CONTENT_LIMIT}字）：
__CONTENT__

请以 JSON 数组格式返回角色信息：
[
  {
    "name": "角色名",
    "aliases": ["别名1", "别名2"],
    "description": "角色描述",
    "appearance": "外貌特征",
    "personality": "性格特点",
    "background": "背景故事",
    "role": "main/supporting/minor",
    "importance": 重要性分数(1-10)
  }
]

注意：
1. 主角 importance 为 8-10
2. 配角 importance 为 4-7
3. 龙套 importance 为 1-3
4. 返回 JSON 数组格式
`;

/** 构造角色提取 prompt */
function buildCharacterExtractionPrompt(content: string): string {
  return CHARACTER_EXTRACTION_PROMPT.replace(
    '__CONTENT__',
    content.slice(0, CHARACTER_EXTRACTION_CONTENT_LIMIT)
  );
}

/** 场景描述 prompt 模板 */
const SCENE_DESCRIPTION_PROMPT = `
请为以下小说场景生成详细的图像生成描述。

场景信息：
- 地点：__LOCATION__
- 时间：__TIME__
- 内容：__CONTENT__
- 角色：__CHARACTERS__

请返回以下 JSON 格式：
{
  "description": "场景视觉描述",
  "visualElements": [
    {
      "type": "character/object/background/effect",
      "name": "元素名称",
      "description": "元素描述",
      "attributes": { "颜色": "描述", "动作": "描述" }
    }
  ],
  "mood": "氛围描述",
  "colorPalette": ["颜色1", "颜色2"],
  "lighting": "光线描述",
  "cameraAngle": "镜头角度",
  "imagePrompt": "AI 图像生成提示词（英文）",
  "negativePrompt": "负面提示词（英文）"
}

注意：
1. imagePrompt 应适合 AI 图像生成
2. 使用英文描述以便 AI 理解
3. 保持画面简洁，避免过多元素
`;

/** 构造场景描述 prompt */
function buildSceneDescriptionPrompt(scene: NovelScene): string {
  return SCENE_DESCRIPTION_PROMPT.replace('__LOCATION__', scene.location ?? '未指定')
    .replace('__TIME__', scene.time ?? '未指定')
    .replace('__CONTENT__', scene.content.slice(0, SCENE_DESCRIPTION_CONTENT_LIMIT))
    .replace('__CHARACTERS__', scene.characters.join('、'));
}


/**
 * 从小说内容中提取所有角色
 */
async function extractCharacters(
  content: string,
  provider: string,
  model: string,
  ai: typeof aiService = aiService
): Promise<Character[]> {
  try {
    const response = await ai.generate(buildCharacterExtractionPrompt(content), {
      provider,
      model,
    });
    const characters = JSON.parse(response);
    return characters.map((char: Partial<Character>, index: number) =>
      createCharacterFromAiResponse(char, index)
    );
  } catch {
    return [];
  }
}


/** 从单条 match 提取角色名 + 对话内容 */
function extractFromMatch(
  match: RegExpExecArray,
  pattern: RegExp
): { characterName: string; dialogueContent: string } {
  let characterName = '';
  let dialogueContent = '';

  if (pattern.source.includes('[A-Z]')) {
    characterName = match[1];
    dialogueContent = match[2];
  } else if (/[\u4e00-\u9fa5]{2,4}[：:]/.test(match[0])) {
    characterName = match[1];
    dialogueContent = match[2];
  } else {
    dialogueContent = match[1];
  }

  return { characterName, dialogueContent };
}

/** 在角色列表中查找与对话名匹配的角色 */
function findCharacterForDialogue(
  characterName: string,
  characters: Character[]
): Character | undefined {
  return characters.find(
    (c) => c.name === characterName || c.aliases?.includes(characterName)
  );
}

/** 把对话追加到角色对象的 dialogues 数组 */
function appendDialogueToCharacter(character: Character, content: string): void {
  character.dialogues ??= [];
  character.dialogues.push(content);
}

/** 旁白提取 */
function extractNarrator(scene: NovelScene, dialogueContent: string): void {
  const paragraphs = scene.content.split(/\n/);
  for (const para of paragraphs) {
    if (para.trim() && !dialogueContent.includes(para.trim())) {
      if (para.length > NARRATOR_MIN_PARAGRAPH_LENGTH && !/^[「『""]/.test(para)) {
        scene.narrator = (scene.narrator ?? '') + para;
      }
    }
  }
}

/**
 * 从场景中提取对话 + 旁白
 */
function extractDialogues(scene: NovelScene, characters: Character[]): void {
  const dialogueMap = new Map<string, { content: string; position: number }[]>();

  for (const pattern of DIALOGUE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(scene.content)) !== null) {
      const { characterName, dialogueContent } = extractFromMatch(match, pattern);
      if (dialogueContent) {
        const key = characterName || 'unknown';
        if (!dialogueMap.has(key)) {
          dialogueMap.set(key, []);
        }
        dialogueMap.get(key)!.push({
          content: dialogueContent.trim(),
          position: match.index,
        });
      }
    }
  }

  scene.dialogues = [];
  for (const [character, dialogues] of dialogueMap) {
    for (const dialog of dialogues) {
      const matchedCharacter = findCharacterForDialogue(character, characters);
      scene.dialogues.push({
        id: `dialogue_${scene.id}_${scene.dialogues.length}`,
        sceneId: scene.id,
        character: matchedCharacter?.name ?? character,
        content: dialog.content,
        position: dialog.position,
      });
      if (matchedCharacter) {
        appendDialogueToCharacter(matchedCharacter, dialog.content);
      }
    }
  }

  const dialogueContent = scene.dialogues.map((d) => d.content).join(' ');
  extractNarrator(scene, dialogueContent);
}


/** 单场景描述生成 */
async function processOneScene(
  scene: NovelScene,
  provider: string,
  model: string,
  ai: typeof aiService
): Promise<SceneDescription> {
  try {
    const response = await ai.generate(buildSceneDescriptionPrompt(scene), {
      provider,
      model,
    });
    const data = JSON.parse(response);
    return {
      sceneId: scene.id,
      description: data.description ?? '',
      visualElements: data.visualElements ?? [],
      mood: data.mood ?? '',
      colorPalette: data.colorPalette,
      lighting: data.lighting,
      cameraAngle: data.cameraAngle,
      imagePrompt: data.imagePrompt ?? generateDefaultPrompt(scene),
      negativePrompt: data.negativePrompt ?? DEFAULT_SCENE_NEGATIVE_PROMPT,
    };
  } catch {
    return {
      sceneId: scene.id,
      description: scene.content.slice(0, SCENE_DESCRIPTION_FALLBACK_CONTENT_LIMIT),
      visualElements: [],
      mood: '',
      imagePrompt: generateDefaultPrompt(scene),
      negativePrompt: DEFAULT_SCENE_NEGATIVE_PROMPT,
    };
  }
}

/**
 * 批量生成场景描述（并发控制 + 容错）
 */
async function generateSceneDescriptions(
  scenes: NovelScene[],
  provider: string,
  model: string,
  maxConcurrency: number = SCENE_DESCRIPTION_MAX_CONCURRENCY,
  ai: typeof aiService = aiService
): Promise<SceneDescription[]> {
  const processScene = (scene: NovelScene) => processOneScene(scene, provider, model, ai);
  const { results, errors } = await concurrentLimit(scenes, maxConcurrency, processScene);

  if (errors.length > 0) {
    logger.warn(`[SceneAnalyzer] ${errors.length} 个场景描述生成失败`);
  }

  return results;
}


/**
 * 场景分析器
 */
export class SceneAnalyzer {
  private config: Required<SceneAnalyzerConfig>;

  constructor(config: SceneAnalyzerConfig = {}) {
    this.config = {
      ...DEFAULT_SCENE_ANALYZER_CONFIG,
      ...config,
    };
  }

  /** 提取角色（AI 驱动） */
  extractCharacters(content: string): Promise<Character[]> {
    return extractCharacters(content, this.config.provider, this.config.model, aiService);
  }

  /** 提取对话 + 旁白（纯本地正则） */
  extractDialogues(scene: NovelScene, characters: Character[]): void {
    extractDialogues(scene, characters);
  }

  /** 批量生成场景描述（AI 驱动 + 并发控制） */
  generateSceneDescriptions(scenes: NovelScene[]): Promise<SceneDescription[]> {
    return generateSceneDescriptions(scenes, this.config.provider, this.config.model);
  }

  /** 静态委托：供外部无实例调用 */
  static extractDialoguesStatic(scene: NovelScene, characters: Character[]): void {
    const instance = new SceneAnalyzer();
    instance.extractDialogues(scene, characters);
  }
}

// 导出单例
export const sceneAnalyzer = new SceneAnalyzer();
