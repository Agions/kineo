import { AutoVoiceSynthesizer } from '@/core/services/audio/AutoVoiceSynthesizer';
import { UnifiedImageGenerator } from '@/core/services/ai/image/UnifiedImageGenerator';
import { PlayableMangaPipelineService } from '@/core/services/pipeline/PlayableMangaPipelineService';
import type { ProjectData } from '@/core/types';
import { useProjectStore } from '@/stores';

// Mock tauriService
jest.mock('@/infrastructure/tauri-bridge', () => ({
  tauriService: {
    renderFullMangaVideo: jest.fn().mockResolvedValue({
      output_path: '/tmp/test_manga_rendered.mp4',
      duration: 12.5,
      file_size: 4500000,
      encoder_used: 'h264_videotoolbox',
    }),
    openFileLocation: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('PlayableMangaPipelineService End-to-End Playable Video Pipeline', () => {
  const testProjectId = 'test-manga-pipeline-001';

  beforeEach(() => {
    useProjectStore.setState({
      projects: [
        {
          id: testProjectId,
          name: '端到端漫剧视频测试项目',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
          script: '第一幕：雨夜追踪。霓虹灯闪烁在积水街头。\n\n第二幕：决战天台。金色符文汇聚在机甲刀刃上。',
        },
      ],
      currentProject: null,
    });
  });

  it('AutoVoiceSynthesizer should select voice and generate audio asset', async () => {
    const maleVoice = AutoVoiceSynthesizer.selectVoiceForCharacter('林澈', 'male');
    expect(maleVoice).toBe('zh-CN-YunxiNeural');

    const femaleVoice = AutoVoiceSynthesizer.selectVoiceForCharacter('苏晴', 'female');
    expect(femaleVoice).toBe('zh-CN-XiaoxiaoNeural');

    const narratorVoice = AutoVoiceSynthesizer.selectVoiceForCharacter('旁白');
    expect(narratorVoice).toBe('zh-CN-YunjianNeural');

    const silentAudio = await AutoVoiceSynthesizer.generateSilentAudio(testProjectId, 'scene_1', 2.0);
    expect(silentAudio.duration).toBe(2.0);
    expect(silentAudio.audioUri).toBeDefined();

    const bgmPath = await AutoVoiceSynthesizer.generateAmbientBgm(testProjectId);
    expect(bgmPath).toBeDefined();

    // SFX 动作线索探测测试
    expect(AutoVoiceSynthesizer.detectSfxCue('拔剑！绝不退让！')).toBe('sword_clash');
    expect(AutoVoiceSynthesizer.detectSfxCue('九天玄刹，引天雷入体！')).toBe('thunder_strike');
    expect(AutoVoiceSynthesizer.detectSfxCue('一拳重击，合金大门轰然倒塌！')).toBe('impact_hit');
    expect(AutoVoiceSynthesizer.detectSfxCue('启动金丹算力芯片，开始扫描数据流')).toBe('cyber_chime');

    const sfxPath = await AutoVoiceSynthesizer.generateDramaticSfx(testProjectId, 'scene_action', 'sword_clash');
    expect(sfxPath).toBeDefined();
  });

  it('UnifiedImageGenerator should generate dual-track fallback scene frame', async () => {
    const frame = await UnifiedImageGenerator.generateSceneImage(
      testProjectId,
      'scene_test_1',
      'cyberpunk neon rain city with mech warrior',
      '雨夜决战',
      '新长安·天际线'
    );

    expect(frame.uri).toBeDefined();
    expect(frame.localDiskPath).toBeDefined();
  });

  it('PlayableMangaPipelineService should execute end-to-end and output MP4 metadata', async () => {
    const project: ProjectData = {
      id: testProjectId,
      name: '端到端漫剧视频测试项目',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      parsedScenes: [
        {
          id: 'scene-1',
          chapterId: 'chap-1',
          sceneNumber: 1,
          title: '雨夜追踪',
          content: '暴雨倾盆的街头，林澈快步奔跑。',
          location: '霓虹街区',
          startPosition: 0,
          endPosition: 30,
          characters: ['林澈'],
          dialogues: [{ id: 'd-1', sceneId: 'scene-1', character: '林澈', content: '绝不能让他逃走！', position: 10 }],
          emotions: [],
        },
      ],
    };

    const progressSteps: string[] = [];
    const result = await PlayableMangaPipelineService.execute(project, (p) => {
      progressSteps.push(p.stage);
    });

    expect(result.videoPath).toBe('/tmp/test_manga_rendered.mp4');
    expect(result.duration).toBe(12.5);
    expect(progressSteps).toContain('script');
    expect(progressSteps).toContain('audio');
    expect(progressSteps).toContain('images');
    expect(progressSteps).toContain('render');
    expect(progressSteps).toContain('completed');

    const updated = useProjectStore.getState().projects.find((p) => p.id === testProjectId);
    expect(updated?.status).toBe('completed');
    expect(updated?.videoPath).toBe('/tmp/test_manga_rendered.mp4');
  });

  it('PlayableMangaPipelineService should execute with customized visual and subtitle styles', async () => {
    const project: ProjectData = {
      id: testProjectId,
      name: '定制样式测试项目',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      parsedScenes: [
        {
          id: 'scene-custom-1',
          chapterId: 'chap-1',
          sceneNumber: 1,
          title: '天台对决',
          content: '双刃相交，火星四溅。',
          location: '天台',
          startPosition: 0,
          endPosition: 20,
          characters: ['夜刃'],
          dialogues: [{ id: 'd-2', sceneId: 'scene-custom-1', character: '夜刃', content: '拔剑吧！', position: 5 }],
          emotions: [],
        },
      ],
    };

    const result = await PlayableMangaPipelineService.execute(
      project,
      {
        resolution: '4k',
        aspectRatio: '9:16',
        quality: 'ultra',
        subtitleMode: 'external_srt',
        subtitleStyle: {
          fontSize: 36,
          fontFamily: 'Noto Sans SC',
          primaryColor: '#FFD700',
          outlineColor: '#000000',
          outlineWidth: 3,
          bottomMargin: 50,
          externalSrt: true,
        },
        cameraMotionMode: 'zoom_in',
        motionIntensity: 1.2,
        bgmVolume: 0.3,
        voiceVolume: 1.1,
      },
      () => {}
    );

    expect(result.videoPath).toBe('/tmp/test_manga_rendered.mp4');
  });
});
