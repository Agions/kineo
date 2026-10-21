/**
 * Novel Service 剧本导出 + 分镜提示词生成
 *
 * 从 novel-service.ts 提取 3 块相对独立的小工具：
 *   - generatePanelPrompt(panel, scene)  把分镜 JSON 转 AI 绘图 prompt
 *   - exportScript(script, format)      导出剧本为 json/pdf/docx 字符串
 *   - generateScriptText(script)        生成可读剧本文本（pdf/docx 共用）
 *
 * 把 generatePanelPrompt 和 exportScript 集中是因为它们之间共享
 * ScriptScene 的可读化（location/time/characters/dialogue 拼接）；
 * 独立成模块后便于 UI 直接 import 用于"预览导出"。

 */

import { formatChineseDuration } from '@/core/utils/format';

import type { ScriptScene, Storyboard } from './novel-types';

/** 镜头类型中英文映射 */
const SHOT_TYPE_MAP: Record<string, string> = {
  wide: '全景',
  medium: '中景',
  close: '近景',
  extreme_close: '特写',
  over_shoulder: '过肩镜头',
};

/** 角度中英文映射 */
const ANGLE_MAP: Record<string, string> = {
  eye_level: '平视',
  high: '俯视',
  low: '仰视',
  dutch: '倾斜',
};

/**
 * 把分镜 JSON 转成 AI 绘图 prompt 字符串。
 *
 * 安全处理：panel 可能是非对象/null —— 这种情况下用空对象降级。
 */
export function generatePanelPrompt(panel: unknown, _scene: ScriptScene): string {
  const panelObj =
    typeof panel === 'object' && panel !== null ? (panel as Record<string, unknown>) : {};
  const shotType = String(panelObj.shotType ?? '');
  const angle = String(panelObj.angle ?? '');
  const description = String(panelObj.description ?? '');
  const characters = Array.isArray(panelObj.characters) ? panelObj.characters.join('、') : '';
  const background = String(panelObj.background ?? '');
  const lighting = String(panelObj.lighting ?? '');
  const mood = String(panelObj.mood ?? '');

  return `
${SHOT_TYPE_MAP[shotType] || shotType}，${ANGLE_MAP[angle] || angle}，
画面：${description}，
角色：${characters}，
背景：${background}，
光线：${lighting}，
氛围：${mood}，
漫画风格，高质量，细节丰富
  `.trim();
}

/**
 * 把剧本渲染成可读文本（pdf / docx 导出格式）
 * 每个场景按"场景号 → 地点 → 时间 → 角色 → 动作 → 对话 → 描述"排列
 */
export function generateScriptText(script: {
  title: string;
  totalScenes: number;
  totalDuration: number;
  characters: string[];
  scenes: ScriptScene[];
}): string {
  const headerLines = [
    `《${script.title}》`,
    `改编剧本`,
    `总场景数: ${script.totalScenes}`,
    `预估时长: ${formatChineseDuration(script.totalDuration)}`,
    `角色: ${script.characters.join('、')}`,
    '',
    '=== 场景列表 ===',
    '',
  ];

  const sceneLines: string[] = [];

  for (const scene of script.scenes) {
    sceneLines.push(
      `场景 ${scene.sceneNumber}`,
      `地点: ${scene.location}`,
      `时间: ${scene.time}`,
      `角色: ${scene.characters.join('、')}`,
      '',
      `动作: ${scene.action}`,
      '',
      '对话:'
    );

    for (const dialogue of scene.dialogue) {
      sceneLines.push(`  ${dialogue.character} (${dialogue.emotion}): ${dialogue.text}`);
    }

    sceneLines.push(
      '',
      `描述: ${scene.description}`,
      `预估时长: ${scene.duration}秒`,
      '',
      '---',
      ''
    );
  }

  return [...headerLines, ...sceneLines].join('\n');
}

/** 剧本导出支持的格式 */
export type ScriptExportFormat = 'json' | 'pdf' | 'docx';

/**
 * 导出剧本为字符串。
 * - json: 直接 JSON.stringify 缩进 2
 * - pdf/docx: 走 generateScriptText 生成可读文本（由调用方再转 PDF/DOCX）
 */
export function exportScript(script: unknown, format: ScriptExportFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(script, null, 2);
    case 'pdf':
    case 'docx':
      return generateScriptText(script as Parameters<typeof generateScriptText>[0]);
    default:
      throw new Error('不支持的格式');
  }
}

// re-export 给主类 facade 使用
export type { Storyboard };
