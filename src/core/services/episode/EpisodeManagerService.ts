/**
 * EpisodeManagerService.ts — 长篇网文多集连载架构与短剧黄金3秒/尾镜悬念引擎
 *
 * 核心功能：
 * 1. 万字长文智能切分：依据单集 60~90 秒（12~16 镜）工业规格，将长篇小说全自动切分为多集连载架构。
 * 2. 黄金 3 秒抓人钩子 (Golden 3-Second Hook)：深度分析首镜冲突张力，若不足则注入视觉冲击/危机悬念指示，防止完播率下滑。
 * 3. 尾镜卡点悬念 (Cliffhanger Engine)：评估每集终镜反转/绝境悬念度，自动生成下集追看卡点标记。
 * 4. 节律张力曲线 (Pacing Curve)：全集镜头张力评估（Hook -> 铺垫 -> 冲突 -> 爆发 -> 悬念）。
 */

import { NovelScene, Character } from '@/core/script/types/novel';
import {
  MangaSeriesProject,
  MangaEpisode,
  EpisodeSplitOptions,
  EpisodeHookCue,
  EpisodeCliffhangerCue,
  PacingPill,
} from './episode-types';

export class EpisodeManagerService {
  /**
   * 将长篇剧本或小说文本智能分割为多集短剧连载项目
   */
  public static splitNovelIntoEpisodes(
    seriesTitle: string,
    novelText: string,
    options?: EpisodeSplitOptions
  ): MangaSeriesProject {
    const seriesId = `series_${Date.now()}`;
    const scenesPerEpisode = options?.scenesPerEpisode ?? 14;
    const characters = options?.characters ?? [];
    const pacingMode = options?.pacingMode ?? 'fast_paced';

    // 1. 拆解成基础原子分镜
    const rawScenes = this.parseRawTextIntoScenes(novelText, characters);
    const totalScenes = rawScenes.length;

    // 2. 按集数切分打包
    const episodes: MangaEpisode[] = [];
    const totalEpisodesCount = Math.max(1, Math.ceil(totalScenes / scenesPerEpisode));

    for (let epIndex = 0; epIndex < totalEpisodesCount; epIndex++) {
      const startIdx = epIndex * scenesPerEpisode;
      const endIdx = Math.min(totalScenes, (epIndex + 1) * scenesPerEpisode);
      const epScenes = rawScenes.slice(startIdx, endIdx);

      // 为该集分镜重编场次编号与 ID
      const episodeId = `${seriesId}_ep_${epIndex + 1}`;
      const normalizedScenes: NovelScene[] = epScenes.map((s, idx) => ({
        ...s,
        id: `${episodeId}_scene_${idx + 1}`,
        chapterId: episodeId,
        sceneNumber: idx + 1,
      }));

      // 分析黄金3秒与悬念卡点
      const hookCue = this.analyzeGolden3Seconds(normalizedScenes);
      const cliffhangerCue = this.analyzeCliffhanger(normalizedScenes);
      const pacingCurve = this.calculateEpisodePacingCurve(normalizedScenes);

      const estimatedDuration = normalizedScenes.reduce((acc, s) => {
        const textLen = (s.dialogues?.[0]?.content || s.content || '').length;
        return acc + Math.max(3.0, textLen * 0.28 + 0.5);
      }, 0);

      episodes.push({
        id: episodeId,
        seriesId,
        episodeNumber: epIndex + 1,
        title: `第 ${epIndex + 1} 集：${normalizedScenes[0]?.title || '风云骤起'}`,
        synopsis: normalizedScenes.map((s) => s.content.slice(0, 30)).slice(0, 3).join(' ... '),
        scenes: normalizedScenes,
        hookCue,
        cliffhangerCue,
        pacingCurve,
        targetDurationSeconds: options?.targetDurationPerEpisode ?? 80,
        estimatedDuration: Math.round(estimatedDuration * 10) / 10,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      id: seriesId,
      title: seriesTitle || '未命名短剧连载系列',
      description: `全 ${episodes.length} 集短剧漫连载，共 ${totalScenes} 幕分镜。`,
      episodes,
      characters,
      globalPacing: pacingMode,
      totalEpisodes: episodes.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 黄金 3 秒开篇抓人钩子分析器
   */
  public static analyzeGolden3Seconds(scenes: NovelScene[]): EpisodeHookCue {
    const firstScene = scenes[0];
    const defaultCue: EpisodeHookCue = {
      type: 'visual_shock',
      description: '大景别冲击开篇，带出世界观或极端异象',
      suggestedPrompt: 'cinematic extreme shock angle, epic dramatic lighting, high contrast',
      intensity: 0.8,
      targetSceneId: firstScene?.id || 'scene_1',
    };

    if (!firstScene) return defaultCue;

    const text = (firstScene.content + ' ' + (firstScene.dialogues?.[0]?.content || '')).toLowerCase();

    // 冲突交锋检测 (高强度对立)
    if (/拔剑|杀|战|斩|死|决战|枪|血|爆|背叛/.test(text)) {
      return {
        type: 'conflict_clash',
        description: '【黄金3秒开篇】生死决战直切入场，近身搏杀与激烈对峙激荡开篇！',
        suggestedPrompt: 'dynamic combat tension, weapon clash sparks, high adrenaline action shot',
        intensity: 0.95,
        targetSceneId: firstScene.id,
      };
    }

    // 悬疑质问检测 (剧烈反常认知)
    if (/为什么|不可思议|难道|怎么可能|消失|陷阱|系统觉醒|秘密/.test(text)) {
      return {
        type: 'suspense_question',
        description: '【黄金3秒开篇】异象反常悬念切入，引发观众好奇心与认知震撼！',
        suggestedPrompt: 'mysterious atmosphere, dramatic close up eye expression, glowing cyber glitch',
        intensity: 0.88,
        targetSceneId: firstScene.id,
      };
    }

    return defaultCue;
  }

  /**
   * 尾镜卡点悬念分析器 (Cliffhanger Engine)
   */
  public static analyzeCliffhanger(scenes: NovelScene[]): EpisodeCliffhangerCue {
    const lastScene = scenes[scenes.length - 1];
    const defaultCliffhanger: EpisodeCliffhangerCue = {
      type: 'suspense_cut',
      description: '【结尾卡点悬念】故事停留在突变前一刻，黑屏骤断，驱动下集连播。',
      suspenseText: '未知变数即将降临...',
      retentionScore: 0.85,
      targetSceneId: lastScene?.id || 'last_scene',
    };

    if (!lastScene) return defaultCliffhanger;

    const text = (lastScene.content + ' ' + (lastScene.dialogues?.[0]?.content || '')).toLowerCase();

    if (/死|杀|命悬一线|倒下|中弹|坠落|来不及了/.test(text)) {
      return {
        type: 'life_death',
        description: '【生死危机卡点】主角遭遇致命威胁，生死存亡瞬间戛然而止！',
        suspenseText: '生死未卜，下集揭晓！',
        retentionScore: 0.96,
        targetSceneId: lastScene.id,
      };
    }

    if (/真相|原形|真面目|居然是你|背叛|假象/.test(text)) {
      return {
        type: 'revelation',
        description: '【惊天反转卡点】幕后黑手露出獠牙或身份反转，颠覆认知！',
        suspenseText: '真相浮出水面，下集高能！',
        retentionScore: 0.94,
        targetSceneId: lastScene.id,
      };
    }

    if (/转机|突破|神级|觉醒|神兵|系统提示/.test(text)) {
      return {
        type: 'plot_twist',
        description: '【爽点反扑卡点】绝境中主角底牌亮出，期待值拉满！',
        suspenseText: '神级觉醒，下集开始反杀！',
        retentionScore: 0.92,
        targetSceneId: lastScene.id,
      };
    }

    return defaultCliffhanger;
  }

  /**
   * 计算整集镜头的节奏张力曲线 (Pacing Curve)
   */
  public static calculateEpisodePacingCurve(scenes: NovelScene[]): PacingPill[] {
    const total = scenes.length;
    return scenes.map((s, idx) => {
      let tag: PacingPill['pacingTag'] = 'exposition';
      let tension = 0.4;

      if (idx === 0) {
        tag = 'hook';
        tension = 0.85;
      } else if (idx === total - 1) {
        tag = 'cliffhanger';
        tension = 0.95;
      } else {
        const text = s.content + ' ' + (s.dialogues?.[0]?.content || '');
        if (/杀|死|斩|爆|狂|战|轰/.test(text)) {
          tag = 'climax';
          tension = 0.9;
        } else if (/争论|对决|对峙|愤怒|可恶|反驳/.test(text)) {
          tag = 'conflict';
          tension = 0.7;
        } else {
          tag = 'exposition';
          tension = 0.35 + (idx / total) * 0.3;
        }
      }

      return {
        sceneId: s.id,
        tensionLevel: Math.round(tension * 100) / 100,
        pacingTag: tag,
      };
    });
  }

  /**
   * 将长文分割为原子分镜段落
   */
  private static parseRawTextIntoScenes(novelText: string, characters: Character[]): NovelScene[] {
    const paragraphs = novelText
      .split(/\n\s*\n|\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 5);

    if (paragraphs.length === 0) {
      // 兜底演示段落
      return [
        {
          id: 'demo_s1',
          chapterId: 'demo_ep',
          sceneNumber: 1,
          title: '暴风雨前的宁静',
          content: '夜幕低垂，暴雨洗刷着城市霓虹，危机正在暗流涌动。',
          location: '天际高塔',
          startPosition: 0,
          endPosition: 30,
          characters: ['主角'],
          dialogues: [{ id: 'd1', sceneId: 'demo_s1', character: '主角', content: '终于要来了吗...', position: 0 }],
          emotions: [],
        },
      ];
    }

    return paragraphs.map((para, idx) => {
      // 提取对话说话人
      let speaker = '旁白';
      let dialogueContent = para;
      const colonMatch = para.match(/^([^\s:：]{2,6})[：:](.*)$/);
      const quoteMatch = para.match(/^“([^”]+)”(.*)$/) || para.match(/“([^”]+)”/);

      if (colonMatch) {
        speaker = colonMatch[1];
        dialogueContent = colonMatch[2].trim();
      } else if (quoteMatch) {
        dialogueContent = quoteMatch[1].trim();
        // 尝试从上下文匹配角色
        const matchedChar = characters.find((c) => para.includes(c.name));
        speaker = matchedChar ? matchedChar.name : (idx % 2 === 0 ? '主角' : '苏晴');
      }

      const isDialoguePresent = dialogueContent.length > 0;

      return {
        id: `parsed_scene_${idx + 1}`,
        chapterId: 'temp_chap',
        sceneNumber: idx + 1,
        title: `场景 ${idx + 1}`,
        content: para,
        location: idx % 3 === 0 ? '全息街区' : idx % 3 === 1 ? '核心控制室' : '绝壁天台',
        startPosition: 0,
        endPosition: para.length,
        characters: [speaker],
        dialogues: isDialoguePresent
          ? [
              {
                id: `d_${idx}`,
                sceneId: `parsed_scene_${idx + 1}`,
                character: speaker,
                content: dialogueContent,
                position: 0,
              },
            ]
          : [],
        emotions: [],
      };
    });
  }
}
