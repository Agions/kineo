/**
 * VideoEditorAgent.ts — 视频剪辑与 4K GPU 压制 Agent
 */

import { BaseAgent } from './BaseAgent';
import type { ProjectBlackboard } from './ProjectBlackboard';

export class VideoEditorAgent extends BaseAgent {
  constructor() {
    super({
      id: 'agent-video',
      name: 'VIDEO',
      role: 'video_editor',
      avatar: '🎞️',
      description: '负责 Apple VideoToolbox / NVENC GPU 4K 硬件加速压制与渲染队列调度',
      triggerPhase: 'on_audio_synthesized',
      readKeys: ['scenes', 'audioConfig'],
      writeKeys: ['renderQueue', 'stage'],
    });
  }

  public async execute(blackboard: ProjectBlackboard): Promise<void> {
    const data = blackboard.getData();
    this.log(blackboard, '启动 VideoToolbox / NVENC GPU 4K 硬件推演压制队列构建...', 'info');

    const scenes = data.scenes || [];
    const cameraPlans = data.cameraDirectingPlans || {};
    const audioConfig = data.audioConfig as any;

    const fps = 60;
    let totalFrames = 0;

    const jobs = scenes.map((sc, idx) => {
      const plan = cameraPlans[sc.id] || { cameraMotion: 'Pan_Right', pacingSeconds: 3.5 };
      const durationSec = plan.pacingSeconds || 3.5;
      const frameCount = Math.round(durationSec * fps);
      totalFrames += frameCount;

      return {
        jobId: `job-render-${sc.id}`,
        sceneId: sc.id,
        sceneNumber: idx + 1,
        motion: plan.cameraMotion,
        durationSec,
        frames: frameCount,
        resolution: '3840x2160',
        fps,
        status: 'ready',
        filterChain:
          plan.cameraMotion === 'Hitchcock_Zoom'
            ? 'zoompan=z=\'min(zoom+0.002,1.4)\':d=210:s=3840x2160'
            : plan.cameraMotion === 'Pan_Right'
              ? 'zoompan=z=\'1.15\':x=\'if(gte(x,200),0,x+2)\':d=210:s=3840x2160'
              : 'zoompan=z=\'1.0\':d=210:s=3840x2160',
      };
    });

    blackboard.update(
      {
        renderQueue: {
          codec: 'H.265 / HEVC',
          hardwareAcceleration: 'Apple VideoToolbox / NVENC',
          resolution: '3840x2160 (4K UHD)',
          fps,
          totalFrames,
          totalDurationSec: (totalFrames / fps).toFixed(1),
          jobs,
          audioTrackCount: audioConfig?.tracks?.length || 1,
          status: 'ready',
        },
        stage: 'motion',
      },
      this.metadata.id,
      this.metadata.name,
      `🎉 4K 漫剧压制与音画合成队列全量构建完成 (共 ${jobs.length} 个镜头分段, ${totalFrames} 帧 60fps)！`
    );
  }
}
