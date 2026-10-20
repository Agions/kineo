/**
 * Kineo AI Engine Package
 * 双模（Tauri IPC 原生 + Web 纯端）AI 剧本解析与提示词推理引擎
 */

import { Shot, Episode, CharacterAsset } from '@kineo/core';

export interface PromptGenerationRequest {
  sceneDescription: string;
  characterStyles?: string[];
  artStyle?: string;
}

export interface PromptGenerationResponse {
  positivePrompt: string;
  negativePrompt: string;
}

export async function generateShotPrompt(
  req: PromptGenerationRequest
): Promise<PromptGenerationResponse> {
  const prefix = req.artStyle || 'masterpiece, 8k, anime style, highly detailed';
  return {
    positivePrompt: `${prefix}, ${req.sceneDescription}`,
    negativePrompt:
      'lowres, bad anatomy, bad hands, text, error, missing fingers, blurry, watermark',
  };
}

export type ArtStylePreset =
  | 'xianxia'
  | 'modern_anime'
  | 'cyberpunk'
  | 'shonen_action'
  | 'dark_fantasy';

export const ART_STYLE_CONFIGS: Record<
  ArtStylePreset,
  { label: string; promptPrefix: string; description: string }
> = {
  xianxia: {
    label: '仙侠国风',
    promptPrefix:
      'masterpiece, 8k, ancient chinese style, xianxia, ethereal lighting, oriental aesthetic',
    description: '仙侠修真国风',
  },
  modern_anime: {
    label: '现代日漫',
    promptPrefix: 'masterpiece, 8k, modern anime style, vibrant colors, Makoto Shinkai aesthetic',
    description: '现代都市动漫风',
  },
  cyberpunk: {
    label: '赛博朋克',
    promptPrefix:
      'masterpiece, 8k, cyberpunk anime, neon lighting, futuristic city, cinematic composition',
    description: '赛博朋克科幻风',
  },
  shonen_action: {
    label: '热血战斗',
    promptPrefix: 'masterpiece, 8k, dynamic action shot, ufotable anime style, high contrast',
    description: '热血战斗爆裂风',
  },
  dark_fantasy: {
    label: '暗黑奇幻',
    promptPrefix: 'masterpiece, 8k, dark fantasy anime, dramatic lighting, gothic aesthetic',
    description: '暗黑奇幻哥特风',
  },
};

export type CameraShot = 'closeup' | 'action' | 'wide' | 'medium';

export const CAMERA_SHOT_PROMPTS: Record<CameraShot, string> = {
  closeup: 'close-up shot, detailed facial expression, soft focus background',
  action: 'dynamic action shot, dutch angle, speed lines, high tension',
  wide: 'wide panoramic establishing shot, grand atmosphere, cinematic scale',
  medium: 'medium shot, character waist-up, rule of thirds composition',
};

export interface ScriptParseResult {
  episodes: Episode[];
  characters: CharacterAsset[];
  summary: string;
  totalShots: number;
}

// 检查是否运行在 Tauri 环境
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** 路径 1: 小说文本上传 $\rightarrow$ 转换全功能剧本 */
export async function parseNovelToScript(
  text: string,
  stylePreset: ArtStylePreset = 'modern_anime'
): Promise<ScriptParseResult> {
  if (isTauri()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<ScriptParseResult>('parse_novel_to_script', { text, stylePreset });
    } catch (e) {
      console.warn('Tauri IPC 路由失败，使用纯端解析器处理', e);
    }
  }

  // Web 回退解析引擎
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const characterSet = new Set<string>();
  const shots: Shot[] = [];

  lines.forEach((line, index) => {
    let charName: string | undefined;
    if (line.includes('：“')) {
      charName = line.split('：“')[0].trim();
    } else if (line.includes('：')) {
      charName = line.split('：')[0].trim();
    }

    if (charName && charName.length > 0 && charName.length < 10) {
      characterSet.add(charName);
    }

    let camera: CameraShot = 'medium';
    if (line.includes('神情') || line.includes('眼神') || line.includes('微笑')) camera = 'closeup';
    else if (line.includes('跃起') || line.includes('拔剑') || line.includes('大喊'))
      camera = 'action';
    else if (line.includes('天空') || line.includes('城市') || line.includes('全景'))
      camera = 'wide';

    const config = ART_STYLE_CONFIGS[stylePreset] || ART_STYLE_CONFIGS.modern_anime;
    const cameraPrompt = CAMERA_SHOT_PROMPTS[camera];

    shots.push({
      id: `shot-${index + 1}`,
      sceneId: 'scene-1',
      order: index + 1,
      dialogue: line.includes('：“') ? line : undefined,
      characterName: charName,
      prompt: `${config.promptPrefix}, ${cameraPrompt}, ${line}`,
      negativePrompt: 'lowres, bad hands, missing fingers, extra limbs, error, watermark',
      durationSeconds: 4,
    });
  });

  const characters: CharacterAsset[] = Array.from(characterSet).map((name, i) => ({
    id: `char-${i + 1}`,
    name,
    gender: 'unknown',
    description: `小说主角 ${name}`,
    promptTags: `1person, ${name}, anime character, detailed face`,
  }));

  return {
    episodes: [
      {
        id: 'ep-1',
        order: 1,
        title: '第一集：分镜解析篇',
        scenes: [
          {
            id: 'scene-1',
            episodeId: 'ep-1',
            order: 1,
            title: '主线分镜大纲',
            description: 'AI 自动拆解分镜',
            shots,
          },
        ],
      },
    ],
    characters,
    summary: `解析完成：共 ${shots.length} 个分镜镜头，提炼 ${characters.length} 位角色`,
    totalShots: shots.length,
  };
}

/** 路径 2: 直接上传专业格式剧本 */
export async function parseDirectScript(text: string): Promise<ScriptParseResult> {
  return await parseNovelToScript(text, 'modern_anime');
}

/** 路径 3: 创意灵感 $\rightarrow$ AI 自动一键生成剧本 */
export async function generateScriptFromIdea(
  idea: string,
  episodesCount: number = 1,
  stylePreset: ArtStylePreset = 'modern_anime'
): Promise<ScriptParseResult> {
  const simulatedText = `第一章：${idea || '新的冒险'}\n萧炎凝视着前方的云海，神情无比坚毅：“三十年河东，莫欺少年穷！”\n风云突然暴动，天际撕裂开一道耀眼的金光。\n药老微笑着浮现：“好小子，有老夫当年的脾气！”`;
  return await parseNovelToScript(simulatedText, stylePreset);
}
