/**
 * StoryboardArtistAgent.ts — 分镜绘图与运镜规划 Agent
 *
 * 职责：
 * 读取 Blackboard 场景与角色，调用 storyboardPromptBuilder 生成 3 栏漫剧画幅，
 * 规划推拉摇移镜头轨迹 (Zoom / Tilt) 与画面 Prompt。
 */

import { BaseAgent } from './BaseAgent';
import type { ProjectBlackboard } from './ProjectBlackboard';

export class StoryboardArtistAgent extends BaseAgent {
  constructor() {
    super({
      id: 'agent-frame',
      name: 'FRAME',
      role: 'storyboard_artist',
      avatar: '🎨',
      description: '负责规划镜头景别 (Zoom/Tilt)、构图提示词与二次元 3 栏漫剧分镜大盘',
      triggerPhase: 'on_character_anchored',
      readKeys: ['scenes', 'characters', 'spatialMemory'],
      writeKeys: ['scenes', 'cameraDirectingPlans', 'stage'],
    });
  }

  public async execute(blackboard: ProjectBlackboard): Promise<void> {
    const data = blackboard.getData();
    this.log(blackboard, '开始进行视听运镜、角色 DNA 注入与 3 栏分镜大盘规划...', 'info');

    const charAnchors = data.spatialMemory?.characterAnchors || {};
    const cameraPlans: Record<string, any> = {};

    const motions: Array<'FPV_Fly' | 'Hitchcock_Zoom' | 'Pan_Right' | 'Tilt_Up' | 'Static'> = [
      'Pan_Right',
      'Hitchcock_Zoom',
      'Tilt_Up',
      'FPV_Fly',
      'Static',
    ];
    const distances: Array<'CloseUp' | 'Medium' | 'Wide'> = ['Wide', 'CloseUp', 'Medium'];

    const updatedScenes = data.scenes.map((sc, idx) => {
      // 1. 匹配场景中出场的角色并注入 DNA Anchor
      const matchedChars = (data.characters || []).filter((c) =>
        sc.content?.includes(c.name)
      );

      const charDnaPrompts = matchedChars
        .map((c) => charAnchors[c.name]?.loraPrompt || `${c.name}, consistent anime features`)
        .join(', ');

      const basePrompt = `Masterpiece 4K anime illustration, ${sc.content.slice(0, 50)}, cinematic lighting, high dynamic contrast, unreal engine 5 anime render`;
      const enrichedPrompt = charDnaPrompts ? `${basePrompt}, [CHARACTER DNA: ${charDnaPrompts}]` : basePrompt;

      // 2. 规划专属镜头轨迹
      const motion = motions[idx % motions.length];
      const distance = distances[idx % distances.length];
      const pacing = idx === 0 ? 4.0 : 3.2;

      cameraPlans[sc.id] = {
        cameraMotion: motion,
        cameraDistance: distance,
        pacingSeconds: pacing,
      };

      const motionLabel =
        motion === 'Hitchcock_Zoom'
          ? '希区柯克变焦 (Hitchcock Zoom)'
          : motion === 'Pan_Right'
            ? '向右摇镜 (Pan Right)'
            : motion === 'Tilt_Up'
              ? '仰角摇镜 (Tilt Up)'
              : motion === 'FPV_Fly'
                ? '第一人称穿越 (FPV Fly)'
                : '固定景深 (Static)';

      return {
        ...sc,
        imagePrompts: [enrichedPrompt],
        tags: [
          ...(sc.tags || []),
          motionLabel,
          `景别: ${distance}`,
          `时长: ${pacing}s`,
          matchedChars.length > 0 ? `角色锚定: ${matchedChars.map((c) => c.name).join('、')}` : '全景环境',
        ],
      };
    });

    blackboard.update(
      {
        scenes: updatedScenes,
        cameraDirectingPlans: cameraPlans,
        stage: 'visuals',
      },
      this.metadata.id,
      this.metadata.name,
      `🎉 已成功规划 ${updatedScenes.length} 帧 3 栏分镜大盘与角色 DNA 运镜参数！`
    );
  }
}
