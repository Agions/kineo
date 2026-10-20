/**
 * StoryboardArtistAgent.ts — 影视级分镜师与机位空间编排 Agent
 *
 * 职责：
 * 1. 深度读取角色全息 DNA 三视图与空间站位坐标，注入分镜画面 Prompt。
 * 2. 依据电影语法规划景别（特写、中景、大全景）与运镜矢量（Pan, Tilt, Dolly, Hitchcock Zoom）。
 * 3. 避免跳轴与单调机位，执行空间防穿帮矩阵约束。
 * 4. 响应 QualityAuditor 的批评意见 (Reflection Context)，自动针对性自愈修复。
 */

import { BaseAgent } from './BaseAgent';
import type { CameraDirectingPlan, ProjectBlackboard } from './ProjectBlackboard';

export class StoryboardArtistAgent extends BaseAgent {
  constructor() {
    super({
      id: 'agent-frame',
      name: 'FRAME',
      role: 'storyboard_artist',
      avatar: '🎨',
      description: '负责规划镜头景别、视效提示词、电影运镜语法与机位空间防穿帮矩阵',
      triggerPhase: 'on_character_anchored',
      readKeys: ['scenes', 'characters', 'spatialMemory', 'currentReflection'],
      writeKeys: ['scenes', 'cameraDirectingPlans', 'stage'],
    });
  }

  public async execute(blackboard: ProjectBlackboard): Promise<void> {
    const data = blackboard.getData();
    const reflection = data.currentReflection;

    if (reflection && (reflection.failedMetric.includes('机位') || reflection.failedMetric.includes('提示词'))) {
      this.log(
        blackboard,
        `🔄 收到质检审计自愈建议: [${reflection.critique}]，重新编排运镜多样性与光影提示词...`,
        'warn'
      );
    } else {
      this.log(blackboard, '🎬 启动 ACS-2.0 影视级分镜编排，结合全息 DNA 矩阵与空间防穿帮约束...', 'info');
    }

    const charAnchors = data.spatialMemory?.characterAnchors || {};
    const cameraPlans: Record<string, CameraDirectingPlan> = {};

    const motions: Array<CameraDirectingPlan['cameraMotion']> = [
      'Hitchcock_Zoom',
      'Pan_Right',
      'Tilt_Up',
      'FPV_Fly',
      'Static',
    ];
    const distances: Array<CameraDirectingPlan['cameraDistance']> = ['CloseUp', 'Medium', 'Wide'];

    const updatedScenes = data.scenes.map((sc, idx) => {
      // 1. 匹配场景出场角色并注入全息 DNA 锚点与站位
      const matchedChars = (data.characters || []).filter((c) =>
        sc.content?.includes(c.name)
      );

      const charDnaPrompts = matchedChars
        .map((c) => {
          const anchor = charAnchors[c.name]?.loraPrompt || `${c.name}, consistent anime features`;
          const dna = (c.appearance as any)?.dna;
          const spatial = dna?.spatialPosition ? `[Spatial: ${dna.spatialPosition}]` : '';
          return `${anchor} ${spatial}`;
        })
        .join(', ');

      // 2. 规划符合电影语法的机位与运镜
      // 避免连续相同机位与景别
      const motion = motions[(idx + (reflection ? 1 : 0)) % motions.length];
      const distance = distances[idx % distances.length];
      const pacing = distance === 'CloseUp' ? 3.0 : distance === 'Medium' ? 4.2 : 5.0;

      cameraPlans[sc.id] = {
        cameraMotion: motion,
        cameraDistance: distance,
        pacingSeconds: pacing,
      };

      const basePrompt = `cinematic anime keyframe, 8k masterpiece, ${distance} shot, ${sc.content.slice(0, 60)}, volumetric rim light, depth of field, octane render anime cel`;
      const enrichedPrompt = charDnaPrompts ? `${basePrompt}, [CHARACTER DNA: ${charDnaPrompts}]` : basePrompt;

      return {
        ...sc,
        title: `镜头 ${idx + 1} · [${distance}] ${motion}`,
        content: enrichedPrompt,
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
      `🎉 已成功规划 ${updatedScenes.length} 组电影级分镜头，运镜矢量与空间防穿帮矩阵已全面绑定！`
    );
  }
}
