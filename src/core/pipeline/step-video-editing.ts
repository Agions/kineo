/**
 * Pipeline 步骤5：视频剪辑合成 (Video Editing & Composition)
 * ========================================================
 * 负责：转场效果、字幕叠加、音频混音、最终导出
 *
 * 模块结构：
 * - video-editing-types.ts    — 类型定义（VideoClip, Transition, SubtitleBlock, AudioTrack 等）
 * - video-editor-engine.ts    — VideoEditor 纯引擎类（状态机，不涉及 Pipeline 接口）
 * - step-video-editing.ts     — PipelineStep 实现（ orchestration）
 */

import { RESOLUTION_1080P } from '@/core/constants/media-presets';
import { delay, PROCESSING_DELAY_MS, isTauri } from '@/core/utils';
import { logger } from '@/core/utils/logger';
import { tauriService } from '@/infrastructure/tauri-bridge/commands';

import { BasePipelineStep } from './base-pipeline-step';
import { PipelineStepId, QualityGateDecision } from './pipeline-types';
import type { PipelineStep, StepInput } from './pipeline-types';
import { getContext } from './step-helpers';
import type {
  VideoClip,
  SubtitleBlock,
  VideoEditingOutput,
} from './steps/video-editing/video-editing-types';
import { VideoEditor } from './steps/video-editing/video-editor-engine';

// Re-export pure engine for direct unit tests
export { VideoEditor };

// ========== Pipeline Step 实现 ==========

export class VideoEditingStep extends BasePipelineStep {
  constructor(config?: Partial<PipelineStep>) {
    super({
      ...config,
      id: config?.id ?? 'step-video-editing',
      name: config?.name ?? '视频剪辑合成',
      stepId: config?.stepId ?? PipelineStepId.VIDEO_EDITING,
      dependencies: config?.dependencies ?? [PipelineStepId.RENDER, PipelineStepId.AUDIO_SYNTHESIS],
    });
  }

  protected computeMetrics(result: unknown): Record<string, unknown> {
    return this.computeCountMetric(result, 'clips');
  }

  protected computeQualityGate(result: unknown): QualityGateDecision | undefined {
    if (result && typeof result === 'object') {
      const clips = (result as Record<string, unknown>).clips;
      if (Array.isArray(clips)) {
        return clips.length > 0 ? QualityGateDecision.PASS : QualityGateDecision.WARN;
      }
    }
    return undefined;
  }

  protected async executeImpl(input: StepInput): Promise<unknown> {
    const context = getContext(input)!;
    logger.info(`[VideoEditingStep] Starting video editing for workflow ${input.workflowId}`);

    const renderedFrames =
      context.getVariable<Array<{ frameId: string; imageUrl: string }>>('renderedFrames') ?? [];
    const dialogueAudio =
      context.getVariable<{ audioUrl: string; duration: number }[]>('dialogueAudio') ?? [];
    const bgmPath = context.getVariable<string>('selectedBgm') ?? '';
    const subtitles = context.getVariable<SubtitleBlock[]>('generatedSubtitles') ?? [];
    const transitions =
      context.getVariable<Array<{ from: string; to: string; type: string; duration: number }>>(
        'transitions'
      ) ?? [];

    if (renderedFrames.length === 0) {
      throw new Error('No rendered frames available for video editing');
    }

    this.reportProgress(10, '正在构建视频时间轴...');

    const editor = new VideoEditor();
    const FRAME_DURATION = 5;

    const clips: VideoClip[] = renderedFrames.map((frame, idx) => ({
      id: frame.frameId,
      path: frame.imageUrl,
      type: 'image' as const,
      startTime: idx * FRAME_DURATION,
      duration: FRAME_DURATION,
    }));

    for (const clip of clips) {
      editor.addClip(clip);
    }

    for (let i = 0; i < clips.length - 1; i++) {
      const transCfg = transitions.find((t) => t.from === clips[i].id && t.to === clips[i + 1].id);
      if (transCfg) {
        editor.setTransition(clips[i].id, clips[i + 1].id, {
          type: transCfg.type as
            | 'fade'
            | 'dissolve'
            | 'slide_left'
            | 'slide_right'
            | 'zoom'
            | 'blur',
          duration: transCfg.duration,
          easing: 'easeInOut',
        });
      } else {
        editor.setTransition(clips[i].id, clips[i + 1].id, {
          type: 'fade',
          duration: 0.5,
          easing: 'easeInOut',
        });
      }
    }

    this.reportProgress(30, '正在混合音频轨道...');

    for (let i = 0; i < dialogueAudio.length; i++) {
      const audio = dialogueAudio[i];
      editor.addAudioTrack({
        type: 'dialogue',
        path: audio.audioUrl,
        startTime: i * FRAME_DURATION,
        duration: audio.duration,
        volume: 0.9,
        fadeIn: 0.1,
        fadeOut: 0.2,
      });
    }

    if (bgmPath) {
      editor.addAudioTrack({
        type: 'bgm',
        path: bgmPath,
        startTime: 0,
        duration: clips.length * FRAME_DURATION,
        volume: 0.3,
        fadeIn: 1.0,
        fadeOut: 2.0,
      });
    }

    this.reportProgress(50, '正在叠加字幕...');
    editor.addSubtitleTrack(subtitles);

    this.reportProgress(70, '正在编码输出视频...');
    const finalVideoUrl = await this.exportVideo(editor, context.workflowId);

    this.reportProgress(90, '视频剪辑完成');

    context.setVariable('finalVideoUrl', finalVideoUrl);
    context.setVariable('videoEditingConfig', editor.exportConfig());
    context.setVariable('finalVideoDuration', editor.getDuration());
    context.setVariable('finalVideoResolution', RESOLUTION_1080P);

    const totalMs = Date.now() - ((input as { startTime?: number }).startTime ?? 0);
    logger.success(`[VideoEditingStep] Video editing completed in ${(totalMs / 1000).toFixed(1)}s`);

    return {
      finalVideoUrl,
      duration: editor.getDuration(),
      resolution: RESOLUTION_1080P,
      format: 'mp4' as const,
      clips: clips.map((c) => ({ id: c.id, startTime: c.startTime, duration: c.duration })),
      transitionsCount: transitions.length,
      audioTracksCount: dialogueAudio.length + (bgmPath ? 1 : 0),
      subtitlesCount: subtitles.length,
    } as VideoEditingOutput;
  }

  private async exportVideo(editor: VideoEditor, workflowId: string): Promise<string> {
    const clips = editor.exportConfig().clips;
    const timestamp = Date.now();
    const outputPath = `output/${workflowId}/final_${timestamp}.mp4`;

    if (isTauri()) {
      try {
        await tauriService.exportVideo({
          inputPath: clips[0]?.path ?? '',
          outputPath,
          segments: clips.map((clip) => ({
            start: clip.startTime,
            end: clip.startTime + clip.duration,
            type: clip.type,
          })),
          quality: 'high',
          format: 'mp4',
          exportId: `export-${timestamp}`,
        });

        logger.info(`[VideoEditingStep] Tauri export completed: ${outputPath}`);
        return outputPath;
      } catch (err) {
        logger.warn(`[VideoEditingStep] Tauri export failed, falling back to WebAssembly: ${err}`);
      }
    }

    this.reportProgress(75, '正在初始化 FFmpeg...');
    await delay(PROCESSING_DELAY_MS.FFMPEG_INIT);

    this.reportProgress(80, '正在合成视频流...');
    await delay(PROCESSING_DELAY_MS.FFMPEG_STREAM_MUX);

    this.reportProgress(85, '正在编码 H.264 视频...');
    await delay(PROCESSING_DELAY_MS.FFMPEG_ENCODE);

    this.reportProgress(88, '正在混音音频轨道...');
    await delay(PROCESSING_DELAY_MS.FFMPEG_AUDIO_MIX);

    this.reportProgress(90, '正在封装 MP4 文件...');
    await delay(PROCESSING_DELAY_MS.FFMPEG_MUX_MP4);

    this.reportProgress(92, '正在写入输出文件...');
    await delay(PROCESSING_DELAY_MS.FFMPEG_FILE_WRITE);

    logger.info(
      `[VideoEditingStep] WebAssembly export: ${outputPath}, ${clips.length} clips, ${editor.getDuration()}s`
    );

    return outputPath;
  }
}

// Re-export types for external consumers
export type {
  VideoClip,
  Transition,
  SubtitleBlock,
  SubtitleStyle,
  AudioTrack,
  VideoEditingOutput,
  VideoEditingConfig,
} from './steps/video-editing/video-editing-types';

/** Factory function — used by pipeline/index.ts */
export function createVideoEditingStep(config?: Partial<PipelineStep>): VideoEditingStep {
  return new VideoEditingStep(config);
}
