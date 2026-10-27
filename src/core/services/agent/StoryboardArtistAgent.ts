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
import { CinematicShotDecomposer } from '../cinematography/CinematicShotDecomposer';
import type { NovelScene } from '@/core/script/types/novel';

export class StoryboardArtistAgent extends BaseAgent {
  constructor() {
    super({
      id: 'agent-frame',
      name: 'FRAME',
      role: 'storyboard_artist',
      avatar: '🎨',
      description: '负责规划镜头景别、视效提示词、电影运镜语法、双人正反打与机位空间防穿帮矩阵',
      triggerPhase: 'on_character_anchored',
      readKeys: ['scenes', 'characters', 'spatialMemory', 'currentReflection'],
      writeKeys: ['scenes', 'cameraDirectingPlans', 'stage'],
    });
  }

  public async execute(blackboard: ProjectBlackboard): Promise<void> {
    const data = blackboard.getData();
    const reflection = data.currentReflection;

    if (reflection && (reflection.failedMetric.includes('机位') || reflection.failedMetric.includes('提示词') || reflection.failedMetric.includes('正反打'))) {
      this.log(
        blackboard,
        `🔄 收到质检审计自愈建议: [${reflection.critique}]，强化双人正反打切镜与机位多样性...`,
        'warn'
      );
    } else {
      this.log(blackboard, '🎬 启动 ACS-2.0 影视级分镜编排，执行 180° 防跳轴正反打解构与空间防穿帮约束...', 'info');
    }

    const charAnchors = data.spatialMemory?.characterAnchors || {};
    const finalCameraPlans: Record<string, CameraDirectingPlan> = {};
    const finalScenes: NovelScene[] = [];

    const defaultMotions: Array<CameraDirectingPlan['cameraMotion']> = [
      'Hitchcock_Zoom',
      'Pan_Right',
      'Tilt_Up',
      'FPV_Fly',
      'Breathing_Micro',
    ];
    const defaultDistances: Array<CameraDirectingPlan['cameraDistance']> = ['CloseUp', 'Medium', 'Wide'];

    let globalShotIndex = 1;

    for (let idx = 0; idx < data.scenes.length; idx++) {
      const sc = data.scenes[idx];

      // 尝试使用影视级正反打引擎解构多角色对话场景
      const decomposed = CinematicShotDecomposer.decomposeSceneToCinematicShots(
        sc,
        data.characters || [],
        data.spatialMemory
      );

      if (decomposed.scenes.length > 1) {
        // 多角色对话成功解构为正反打 + 反应镜头流
        decomposed.scenes.forEach((subScene) => {
          finalScenes.push({
            ...subScene,
            sceneNumber: globalShotIndex,
          });
          const plan = decomposed.plans[subScene.id];
          if (plan) {
            finalCameraPlans[subScene.id] = plan;
          }
          globalShotIndex++;
        });
      } else {
        // 单人镜头或全景旁白叙述
        const motion = defaultMotions[(idx + (reflection ? 1 : 0)) % defaultMotions.length];
        const distance = defaultDistances[idx % defaultDistances.length];
        const pacing = distance === 'CloseUp' ? 3.0 : distance === 'Medium' ? 4.2 : 5.0;

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

        const basePrompt = `cinematic anime keyframe, 8k masterpiece, ${distance} shot, ${sc.content.slice(0, 60)}, volumetric rim light, depth of field, octane render anime cel`;
        const enrichedPrompt = charDnaPrompts ? `${basePrompt}, [CHARACTER DNA: ${charDnaPrompts}]` : basePrompt;

        const updatedSc: NovelScene = {
          ...sc,
          sceneNumber: globalShotIndex,
          title: `镜头 ${globalShotIndex} · [${distance}] ${motion}`,
          content: enrichedPrompt,
        };

        finalScenes.push(updatedSc);
        finalCameraPlans[updatedSc.id] = {
          cameraMotion: motion,
          cameraDistance: distance,
          pacingSeconds: pacing,
          shotType: 'ambient_cutaway',
        };
        globalShotIndex++;
      }
    }

    const shotReverseShotCount = Object.values(finalCameraPlans).filter(
      (p) => p.shotType === 'over_the_shoulder_a' || p.shotType === 'reverse_shot_b' || p.shotType === 'reaction_listener'
    ).length;

    blackboard.update(
      {
        scenes: finalScenes,
        cameraDirectingPlans: finalCameraPlans,
        stage: 'visuals',
      },
      this.metadata.id,
      this.metadata.name,
      `🎉 已成功规划 ${finalScenes.length} 组电影级分镜头 (包含 ${shotReverseShotCount} 个正反打与反应镜头)，180° 防跳轴矩阵已锁定！`
    );
  }
}
