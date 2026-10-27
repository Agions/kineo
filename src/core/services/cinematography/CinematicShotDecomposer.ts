/**
 * CinematicShotDecomposer.ts — 影视级正反打 (Shot-Reverse-Shot) 与防跳轴切镜解构引擎
 *
 * 核心功能：
 * 1. 对白轮次深度语义切分 (Dialogue Turn Extraction)：解析多角色对峙与交谈，精准提取说话人与倾听人。
 * 2. 180 度轴线规则强制锁定 (180-Degree Line Axis Lock)：为同框角色绑定屏幕左右站位与视线方向 (Left looking right / Right looking left)，严防跳轴。
 * 3. 影视级四段式分镜语法生成：
 *    - 双人同框交代镜头 (Establishing Two-Shot / Master Shot)
 *    - 过肩正打镜头 (Over-The-Shoulder Shot A)
 *    - 过肩反打镜头 (Reverse Over-The-Shoulder Shot B)
 *    - 倾听者情绪反应镜头 (Reaction Cutaway Shot)
 * 4. 彻底解决漫剧长段对白“一张图到底、单调 PPT 幻灯片”的工业痛点。
 */

import type { Character, Dialogue, NovelScene } from '@/core/script/types/novel';
import type { CameraDirectingPlan, CinematicShotType, SpatialMemory } from '../agent/ProjectBlackboard';

export interface DialogueTurn {
  speaker: string;
  listener: string;
  text: string;
  emotion: string;
  isHighTension: boolean;
}

export interface Axis180Context {
  charLeft: string; // 位于屏幕左侧，视线朝右 (Gaze: look_right)
  charRight: string; // 位于屏幕右侧，视线朝左 (Gaze: look_left)
  axisLocked: boolean;
}

export class CinematicShotDecomposer {
  /**
   * 从场景文本与对白数组中提取结构化对话轮次
   */
  public static extractDialogueTurns(scene: NovelScene, characters: Character[]): DialogueTurn[] {
    const turns: DialogueTurn[] = [];
    const text = scene.content || '';

    // 1. 如果 scene.dialogues 已有结构化数据，优先解析
    if (scene.dialogues && scene.dialogues.length > 0) {
      for (let i = 0; i < scene.dialogues.length; i++) {
        const d = scene.dialogues[i];
        const speaker = d.character || '神秘人';
        // 自动推断倾听者（若有其他角色则取其一）
        const otherChars = characters.filter((c) => c.name !== speaker);
        const listener = otherChars.length > 0 ? otherChars[0].name : '旁观者';
        const dialogueText = d.content || '';

        const isHighTension =
          /[！!？?]/.test(dialogueText) ||
          /绝不|休想|什么|怎么可能|受死|不可思议|杀|背叛|住手/.test(dialogueText);

        turns.push({
          speaker,
          listener,
          text: dialogueText,
          emotion: d.emotion ? String(d.emotion) : isHighTension ? 'dramatic_tension' : 'calm_dialogue',
          isHighTension,
        });
      }
      if (turns.length > 0) return turns;
    }

    // 2. 正则从剧本文本中逐行提取角色发言
    const quoteRegex = /([^。！？\n]*?)["“]([^"”]+)["”]/g;
    let match;
    const knownNames = characters.map((c) => c.name);

    while ((match = quoteRegex.exec(text)) !== null) {
      const prefix = match[1].trim();
      const dialogueText = match[2];

      // 从前导文本中精准定位最匹配的角色名
      let speaker = '';
      for (const name of knownNames) {
        if (prefix.includes(name)) {
          speaker = name;
          break;
        }
      }

      // 如果前导文本未直接包含已知角色名，尝试提取冒号或对话动词前的称谓
      if (!speaker) {
        const colonMatch = /([一-龥a-zA-Z0-9]{2,6})\s*[:：]/.exec(prefix);
        if (colonMatch) {
          speaker = colonMatch[1];
        } else {
          const verbMatch = /([一-龥a-zA-Z0-9]{2,6})(?:说|道|叹|笑|喝|喊)/.exec(prefix);
          if (verbMatch) {
            speaker = verbMatch[1];
          }
        }
      }

      if (!speaker) {
        speaker = knownNames.length > 0 ? knownNames[turns.length % knownNames.length] : '角色';
      }

      const otherChars = knownNames.filter((n) => n !== speaker);
      const listener = otherChars.length > 0 ? otherChars[0] : '对方';

      const isHighTension =
        /[！!？?]/.test(dialogueText) ||
        /绝不|休想|什么|怎么可能|受死|不可思议|杀|背叛|住手/.test(dialogueText);

      turns.push({
        speaker,
        listener,
        text: dialogueText,
        emotion: isHighTension ? 'dramatic_tension' : 'calm_dialogue',
        isHighTension,
      });
    }

    return turns;
  }

  /**
   * 为参与对话的角色构建 180 度轴线空间上下文 (防止镜头跳轴)
   */
  public static establish180Axis(
    turns: DialogueTurn[],
    spatialMemory?: SpatialMemory
  ): Axis180Context | null {
    if (turns.length === 0) return null;

    const uniqueSpeakers = Array.from(new Set(turns.map((t) => t.speaker)));
    if (uniqueSpeakers.length < 2) {
      // 若只有单人发言，尝试从 listener 获取次要角色
      const listener = turns.find((t) => t.listener && t.listener !== uniqueSpeakers[0])?.listener;
      if (listener && listener !== '对方') {
        uniqueSpeakers.push(listener);
      } else {
        return null; // 单人独白，无需正反打
      }
    }

    const charA = uniqueSpeakers[0];
    const charB = uniqueSpeakers[1];

    // 检查空间记忆是否已有固定站位
    const anchors = spatialMemory?.characterAnchors || {};
    const anchorA = anchors[charA];
    const anchorB = anchors[charB];

    let charLeft = charA;
    let charRight = charB;

    if (anchorA && (anchorA as any).spatialPosition === 'right') {
      charLeft = charB;
      charRight = charA;
    } else if (anchorB && (anchorB as any).spatialPosition === 'left') {
      charLeft = charB;
      charRight = charA;
    }

    return {
      charLeft,
      charRight,
      axisLocked: true,
    };
  }

  /**
   * 将含有对话的单场景解构为影视级镜头切分流 (Shot-Reverse-Shot + Reaction)
   */
  public static decomposeSceneToCinematicShots(
    scene: NovelScene,
    characters: Character[],
    spatialMemory?: SpatialMemory
  ): {
    scenes: NovelScene[];
    plans: Record<string, CameraDirectingPlan>;
  } {
    const turns = this.extractDialogueTurns(scene, characters);

    // 如果该场景对话少于 2 轮，保持原单场景不变，直接规划单镜头
    if (turns.length < 2) {
      const defaultPlan: CameraDirectingPlan = {
        cameraMotion: 'Pan_Right',
        cameraDistance: 'Medium',
        pacingSeconds: Math.max(3.5, (scene.content?.length || 20) * 0.08),
        shotType: 'establishing_two_shot',
      };
      return {
        scenes: [scene],
        plans: { [scene.id]: defaultPlan },
      };
    }

    // 建立 180 度防跳轴轴线
    const axis = this.establish180Axis(turns, spatialMemory);
    const charAnchors = spatialMemory?.characterAnchors || {};

    const decomposedScenes: NovelScene[] = [];
    const plans: Record<string, CameraDirectingPlan> = {};

    let subIndex = 1;

    // --- 1. 双人同框交代镜头 (Establishing Two-Shot / Master Shot) ---
    const masterShotId = `${scene.id}_shot_${subIndex}`;
    const leftDna = charAnchors[axis?.charLeft || '']?.loraPrompt || axis?.charLeft || 'Character A';
    const rightDna = charAnchors[axis?.charRight || '']?.loraPrompt || axis?.charRight || 'Character B';

    const masterPrompt = `master establishing two-shot, cinematic 8k anime masterpiece, wide angle, ${axis?.charLeft} on the left looking right, ${axis?.charRight} on the right looking left, dramatic atmosphere, depth of field, volumetric rim lighting, ${scene.location || 'indoor ambient'}`;

    const masterScene: NovelScene = {
      ...scene,
      id: masterShotId,
      sceneNumber: Number(`${scene.sceneNumber || 1}${subIndex}`),
      title: `${scene.title || '场景'} · [双人同框全景建立]`,
      content: masterPrompt,
      dialogues: [], // 全景交代留白，无台词遮挡
    };
    decomposedScenes.push(masterScene);

    plans[masterShotId] = {
      cameraMotion: 'Dolly_In',
      cameraDistance: 'Wide',
      pacingSeconds: 3.0,
      shotType: 'establishing_two_shot',
      axisLocked: true,
      parentSceneId: scene.id,
    };
    subIndex++;

    // --- 2. 正反打与反应镜头交替轮次 ---
    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const isSpeakerLeft = turn.speaker === axis?.charLeft;
      const shotId = `${scene.id}_shot_${subIndex}`;

      const shotType: CinematicShotType = isSpeakerLeft ? 'over_the_shoulder_a' : 'reverse_shot_b';
      const gazeDirection = isSpeakerLeft ? 'look_right' : 'look_left';

      // 构造过肩镜头 Prompt：前景虚化倾听者背部/肩线，焦点落在说话人面部与口型
      const foregroundChar = isSpeakerLeft ? axis?.charRight : axis?.charLeft;
      const focusChar = turn.speaker;
      const focusDna = charAnchors[focusChar]?.loraPrompt || focusChar;

      const otsPrompt = isSpeakerLeft
        ? `cinematic over-the-shoulder shot (OTS), blurred silhouette of ${foregroundChar}'s right shoulder in foreground right, crisp focus on ${focusDna} on the left facing right speaking with emotion, dramatic anime keyframe, 8k, eye-level, octane render`
        : `cinematic reverse over-the-shoulder shot (Reverse OTS), blurred silhouette of ${foregroundChar}'s left shoulder in foreground left, crisp focus on ${focusDna} on the right facing left speaking with emotion, sharp anime expression, rim light, depth of field`;

      const subDialogue: Dialogue = {
        id: `dlg-${shotId}`,
        sceneId: shotId,
        character: turn.speaker,
        content: turn.text,
        position: 0,
      };

      const shotScene: NovelScene = {
        ...scene,
        id: shotId,
        sceneNumber: Number(`${scene.sceneNumber || 1}${subIndex}`),
        title: `${scene.title || '场景'} · [${isSpeakerLeft ? '过肩正打' : '过肩反打'} · ${turn.speaker}]`,
        content: otsPrompt,
        dialogues: [subDialogue],
      };
      decomposedScenes.push(shotScene);

      plans[shotId] = {
        cameraMotion: isSpeakerLeft ? 'Breathing_Micro' : 'Dolly_In',
        cameraDistance: 'CloseUp',
        pacingSeconds: Math.max(2.8, turn.text.length * 0.18 + 0.6),
        shotType,
        speaker: turn.speaker,
        listener: turn.listener,
        gazeDirection,
        axisLocked: true,
        parentSceneId: scene.id,
      };
      subIndex++;

      // --- 3. 高张力反应镜头插帧 (Reaction Cutaway) ---
      // 当对白包含戏剧冲突或震惊转折时，切入倾听者的面部微表情反应
      if (turn.isHighTension) {
        const reactionShotId = `${scene.id}_shot_${subIndex}`;
        const listenerDna = charAnchors[turn.listener]?.loraPrompt || turn.listener;

        const reactionPrompt = `extreme close-up dramatic reaction shot, anime cinematography, tight focus on the eyes and facial expression of ${listenerDna} facing ${isSpeakerLeft ? 'left' : 'right'}, shock, dramatic tension, speed lines in background, dilated pupils, cinematic color grading, 8k`;

        const reactionScene: NovelScene = {
          ...scene,
          id: reactionShotId,
          sceneNumber: Number(`${scene.sceneNumber || 1}${subIndex}`),
          title: `${scene.title || '场景'} · [反应特写 · ${turn.listener}]`,
          content: reactionPrompt,
          dialogues: [], // 纯视效反应镜头，无新台词，留白给重音效或喘息声
        };
        decomposedScenes.push(reactionScene);

        plans[reactionShotId] = {
          cameraMotion: 'Punch_Zoom',
          cameraDistance: 'Extreme_CloseUp',
          pacingSeconds: 1.8,
          shotType: 'reaction_listener',
          listener: turn.listener,
          gazeDirection: isSpeakerLeft ? 'look_left' : 'look_right',
          axisLocked: true,
          parentSceneId: scene.id,
        };
        subIndex++;
      }
    }

    return {
      scenes: decomposedScenes,
      plans,
    };
  }
}
