/**
 * ScriptIngestionAgent.ts — 剧本与原著小说四级深度剖析 Agent
 *
 * 职责：
 * 自动识别输入源类型，触发 HierarchicalScriptParser 四级深度流水线，
 * 依次进行世界观角色提取、戏剧节拍切分、剧本对话标注与镜头运镜矢量编译。
 */

import { BaseAgent } from './BaseAgent';
import { HierarchicalScriptParser } from './HierarchicalScriptParser';
import type { InputContentType, ProjectBlackboard } from './ProjectBlackboard';

export class ScriptIngestionAgent extends BaseAgent {
  constructor() {
    super({
      id: 'agent-story',
      name: 'STORY',
      role: 'script_ingestion',
      avatar: '📄',
      description: '四级渐进式原著小说深度语义剖析流水线，提取剧本章节、分镜节拍与机位矢量',
      triggerPhase: 'on_input_submitted',
      readKeys: ['rawInput', 'inputType'],
      writeKeys: ['scriptContent', 'storyAnalysis', 'scenes', 'inputType', 'stage', 'cameraDirectingPlans'],
    });
  }

  public async execute(blackboard: ProjectBlackboard): Promise<void> {
    const data = blackboard.getData();
    const rawInput = data.rawInput?.trim();

    if (!rawInput) {
      this.log(blackboard, '⚠️ 未输入任何内容，跳过剧本识别。', 'warn');
      return;
    }

    this.log(blackboard, '🚀 启动 ACS-2.0 四级渐进式原著小说深度语义剖析流水线...', 'info');

    // 1. 智能推断类型
    let detectedType: InputContentType = data.inputType;
    if (detectedType === 'unknown') {
      if (rawInput.startsWith('{') || rawInput.includes('INT.') || rawInput.includes('EXT.')) {
        detectedType = 'script_file';
      } else if (rawInput.length < 200 && (rawInput.includes('生成') || rawInput.includes('创作'))) {
        detectedType = 'ai_prompt';
      } else {
        detectedType = 'novel_text';
      }
    }

    this.log(blackboard, `Pass 1-4: 解析输入类型 [${detectedType}]，开始全量语义萃取与分镜编译...`, 'info');

    try {
      const parsedOutput = await HierarchicalScriptParser.parse(rawInput);

      const cameraDirectingPlans: Record<string, any> = {};
      Object.entries(parsedOutput.shotVectors).forEach(([sceneId, vec]) => {
        cameraDirectingPlans[sceneId] = {
          cameraMotion: vec.cameraMotion,
          cameraDistance: vec.shotScale === 'CloseUp' || vec.shotScale === 'Extreme_CloseUp' ? 'CloseUp' : vec.shotScale === 'Wide' ? 'Wide' : 'Medium',
          pacingSeconds: vec.shotScale.includes('Close') ? 3 : 5,
        };
      });

      blackboard.update(
        {
          scriptContent: rawInput,
          inputType: detectedType,
          storyAnalysis: parsedOutput.storyAnalysis,
          characters: parsedOutput.characters,
          scenes: parsedOutput.scenes,
          cameraDirectingPlans,
          stage: 'planning',
        },
        this.metadata.id,
        this.metadata.name,
        `✅ 四级语义剖析完成：萃取世界观 [${parsedOutput.worldview.style}]、${parsedOutput.characters.length} 位角色、${parsedOutput.scenes.length} 个镜头分镜与运镜矢量！`
      );
    } catch (err: any) {
      this.log(blackboard, `❌ 剧本解析发生异常: ${err?.message || '未知错误'}`, 'error');
      throw err;
    }
  }
}
