/**
 * PlayableMangaPipelineService.ts — 端到端漫剧视频工业化生成总控管线
 *
 * 核心链路：
 * 1. 剧本场景与角色对白自动对齐
 * 2. 真实多角色 Edge-TTS 语音合成与本地落盘
 * 3. 双轨高质感分镜图片生成与本地落盘
 * 4. 氛围 BGM 背景音乐自动生成
 * 5. 调用 Rust 原生 FFmpeg 压制（Ken Burns 运镜、转场、硬字幕、音画合流、硬件编码加速）
 * 6. 成品 MP4 自动回填项目并在前端提供播放与 Finder/Explorer 文件定位
 */

import type { ProjectData } from '@/core/types';
import type { NovelScene } from '@/core/script/types/novel';
import { AutoVoiceSynthesizer } from '@/core/services/audio/AutoVoiceSynthesizer';
import { UnifiedImageGenerator } from '@/core/services/ai/image/UnifiedImageGenerator';
import { assetPersistenceBridge } from '@/core/services/data-bus/AssetPersistenceBridge';
import { tauriService } from '@/infrastructure/tauri-bridge';
import { logger } from '@/core/utils/logger';
import { useProjectStore } from '@/stores';

export interface PlayablePipelineProgress {
  stage: 'script' | 'images' | 'audio' | 'render' | 'completed' | 'error';
  percent: number; // 0 - 100
  message: string;
  videoPath?: string;
  videoUri?: string;
  duration?: number;
  fileSize?: number;
  encoderUsed?: string;
}

export type ProgressCallback = (progress: PlayablePipelineProgress) => void;

export class PlayableMangaPipelineService {
  /**
   * 启动端到端漫剧成片生成流程
   */
  public static async execute(
    project: ProjectData,
    onProgress?: ProgressCallback
  ): Promise<{ videoPath: string; videoUri: string; duration: number; fileSize: number }> {
    const projectId = project.id || `proj_${Date.now()}`;
    logger.info(`[PlayableMangaPipeline] 启动端到端漫剧压制, 工程: ${project.name} (${projectId})`);

    try {
      // 1. 提取或解析场景列表
      onProgress?.({
        stage: 'script',
        percent: 10,
        message: '正在梳理剧本分镜节奏与对白切片...',
      });

      const scenes = this.extractScenes(project);
      if (scenes.length === 0) {
        throw new Error('未检测到有效的分镜场景，请先在剧本中拆解场景！');
      }

      const totalScenes = scenes.length;
      const renderedScenes: Array<{
        id: string;
        image_path: string;
        audio_path?: string;
        duration: number;
        camera_motion?: string;
        transition?: string;
        dialogue?: string;
      }> = [];

      // 2. 批量生成配音与画面资产
      for (let i = 0; i < totalScenes; i++) {
        const scene = scenes[i];
        const sceneId = scene.id || `scene_${i + 1}`;
        const title = scene.title || `第 ${i + 1} 幕`;
        const location = scene.location || '新长安·核心区';

        // 提取对白台词
        let dialogueText = '';
        let speaker = '旁白';
        if (Array.isArray(scene.dialogues) && scene.dialogues.length > 0) {
          speaker = scene.dialogues[0].character || '主角';
          dialogueText = scene.dialogues.map((d) => d.content).join(' ');
        } else if (scene.content) {
          dialogueText = scene.content.slice(0, 80);
        }

        // A. 听觉流：生成配音音频
        onProgress?.({
          stage: 'audio',
          percent: 15 + Math.round((i / totalScenes) * 35),
          message: `正在合成第 ${i + 1}/${totalScenes} 幕角色语音 [${speaker}]: "${dialogueText.slice(0, 16)}..."`,
        });

        const voiceRes = await AutoVoiceSynthesizer.synthesizeDialogue(
          projectId,
          sceneId,
          speaker,
          dialogueText
        );

        // B. 视觉流：生成分镜画面
        onProgress?.({
          stage: 'images',
          percent: 50 + Math.round((i / totalScenes) * 30),
          message: `正在渲染第 ${i + 1}/${totalScenes} 幕分镜画面: ${title}`,
        });

        const prompt = scene.imagePrompts?.[0] || scene.content || '赛博朋克漫剧电影级质感镜头';
        const imageRes = await UnifiedImageGenerator.generateSceneImage(
          projectId,
          sceneId,
          prompt,
          title,
          location
        );

        // 运镜机位规划 (从工程元数据或自适应)
        const cameraMotions = ['zoom_in', 'zoom_out', 'pan_right', 'pan_left'];
        const cameraMotion = cameraMotions[i % cameraMotions.length];

        renderedScenes.push({
          id: sceneId,
          image_path: imageRes.localDiskPath,
          audio_path: voiceRes.audioDiskPath,
          duration: Math.max(3.0, voiceRes.duration),
          camera_motion: cameraMotion,
          transition: 'dissolve',
          dialogue: dialogueText ? `【${speaker}】${dialogueText}` : undefined,
        });
      }

      // 3. 生成环境 BGM
      onProgress?.({
        stage: 'audio',
        percent: 82,
        message: '正在铺设场景氛围背景音乐 (Ambient BGM)...',
      });
      const bgmPath = await AutoVoiceSynthesizer.generateAmbientBgm(projectId);

      // 4. 调用 Rust 原生 FFmpeg 压制
      onProgress?.({
        stage: 'render',
        percent: 88,
        message: '启动本地 FFmpeg 硬件加速压制 (Ken Burns 动态运镜与硬字幕合流)...',
      });

      // 确定成片文件目标路径
      let targetOutputPath = '';
      if (assetPersistenceBridge.isTauriEnv()) {
        try {
          const { appDataDir, join } = await import('@tauri-apps/api/path');
          const baseDir = await appDataDir();
          targetOutputPath = await join(baseDir, 'kineo-projects', projectId, 'renders', `manga_${projectId}.mp4`);
        } catch {
          targetOutputPath = `/tmp/kineo_manga_${projectId}.mp4`;
        }
      } else {
        targetOutputPath = `/tmp/kineo_manga_${projectId}.mp4`;
      }

      // 提交到 Rust 后端
      const renderResult = await tauriService.renderFullMangaVideo({
        project_id: projectId,
        output_path: targetOutputPath,
        scenes: renderedScenes,
        bgm_path: bgmPath,
        bgm_volume: 0.2,
        resolution: '1080p',
        quality: 'high',
        subtitle_enabled: true,
      });

      // 5. 换算可播放 URI
      let videoUri = renderResult.output_path;
      if (assetPersistenceBridge.isTauriEnv()) {
        try {
          const { convertFileSrc } = await import('@tauri-apps/api/core');
          videoUri = convertFileSrc(renderResult.output_path);
        } catch {
          // fallback as-is
        }
      }

      // 6. 回填项目存储
      useProjectStore.getState().updateProject(projectId, {
        videoPath: renderResult.output_path,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        metadata: {
          ...(typeof project.metadata === 'object' && project.metadata !== null ? project.metadata : {}),
          videoUri,
          renderDuration: renderResult.duration,
          fileSize: renderResult.file_size,
          encoderUsed: renderResult.encoder_used,
        },
      });

      onProgress?.({
        stage: 'completed',
        percent: 100,
        message: '🎉 1080P 漫剧成片压制完成！',
        videoPath: renderResult.output_path,
        videoUri,
        duration: renderResult.duration,
        fileSize: renderResult.file_size,
        encoderUsed: renderResult.encoder_used,
      });

      return {
        videoPath: renderResult.output_path,
        videoUri,
        duration: renderResult.duration,
        fileSize: renderResult.file_size,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error('[PlayableMangaPipeline] 漫剧视频压制失败:', err);
      onProgress?.({
        stage: 'error',
        percent: 0,
        message: `渲染失败: ${errMsg}`,
      });
      throw err;
    }
  }

  /**
   * 从各种可能的数据格式中提取规整场景列表
   */
  private static extractScenes(project: ProjectData): NovelScene[] {
    if (Array.isArray(project.parsedScenes) && project.parsedScenes.length > 0) {
      return project.parsedScenes as NovelScene[];
    }

    if (Array.isArray(project.storyboardFrames) && project.storyboardFrames.length > 0) {
      return project.storyboardFrames.map((f, idx) => ({
        id: f.id || `frame_${idx + 1}`,
        chapterId: 'chap_1',
        sceneNumber: idx + 1,
        title: f.title || `场景 ${idx + 1}`,
        content: f.sceneDescription || f.title || '',
        location: f.composition || '主舞台',
        startPosition: 0,
        endPosition: 100,
        characters: [],
        dialogues: f.dialogue ? [{ id: `d_${idx}`, sceneId: f.id, character: '主角', content: f.dialogue, position: 0 }] : [],
        emotions: [],
        imagePrompts: f.imageUrl ? [f.imageUrl] : [],
      }));
    }

    // 若无分镜但有纯剧本文本，生成 3 幕演示分镜
    const scriptText = project.script || project.content || '';
    if (scriptText) {
      const chunks = scriptText.split('\n\n').filter((c) => c.trim().length > 5);
      const scenesToUse = chunks.length > 0 ? chunks.slice(0, 5) : [scriptText];

      return scenesToUse.map((text, idx) => ({
        id: `auto_scene_${idx + 1}`,
        chapterId: 'chap_1',
        sceneNumber: idx + 1,
        title: `第 ${idx + 1} 幕：戏剧高潮`,
        content: text.trim(),
        location: '新长安·天际线',
        startPosition: 0,
        endPosition: text.length,
        characters: ['林澈', '苏晴'],
        dialogues: [{ id: `d_auto_${idx}`, sceneId: `auto_scene_${idx + 1}`, character: idx % 2 === 0 ? '林澈' : '苏晴', content: text.slice(0, 60), position: 0 }],
        emotions: [],
        imagePrompts: ['cyberpunk anime drama cinematic shot 4k'],
      }));
    }

    return [];
  }
}
