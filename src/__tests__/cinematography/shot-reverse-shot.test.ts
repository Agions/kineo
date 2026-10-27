/**
 * shot-reverse-shot.test.ts — 影视级正反打与防跳轴切镜解构引擎单元测试套件
 */

import { CinematicShotDecomposer } from '@/core/services/cinematography/CinematicShotDecomposer';
import { StoryboardArtistAgent } from '@/core/services/agent/StoryboardArtistAgent';
import { QualityAuditorAgent } from '@/core/services/agent/QualityAuditorAgent';
import { ProjectBlackboard } from '@/core/services/agent/ProjectBlackboard';
import type { NovelScene, Character } from '@/core/script/types/novel';

describe('Cinematic Shot-Reverse-Shot & 180-Degree Axis Engine Suite', () => {
  const mockCharacters: Character[] = [
    {
      id: 'char-1',
      name: '苏雪',
      role: 'protagonist',
      gender: 'female',
      appearance: '白衣胜雪，墨发如瀑',
      personality: '清冷沉稳',
      voice: { provider: 'edge', voiceId: 'zh-CN-XiaoxiaoNeural' },
    } as any,
    {
      id: 'char-2',
      name: '林晨',
      role: 'protagonist',
      gender: 'male',
      appearance: '黑袍猎猎，持剑而立',
      personality: '桀骜果决',
      voice: { provider: 'edge', voiceId: 'zh-CN-YunxiNeural' },
    } as any,
  ];

  describe('CinematicShotDecomposer Engine', () => {
    it('Should extract structured dialogue turns with speaker, listener, and tension', () => {
      const scene: NovelScene = {
        id: 'scene-test-1',
        chapterId: 'chap-1',
        sceneNumber: 1,
        title: '天台对峙',
        content: `天道大厦顶端狂风呼啸。
苏雪：“林晨，护宗大阵即将破碎，不要硬撑了！”
林晨眼神凌厉，冷笑道：“区区天劫，何足挂齿！”`,
        characters: ['苏雪', '林晨'],
        dialogues: [],
        emotions: [],
        startPosition: 0,
        endPosition: 100,
      };

      const turns = CinematicShotDecomposer.extractDialogueTurns(scene, mockCharacters);
      expect(turns.length).toBe(2);

      expect(turns[0].speaker).toBe('苏雪');
      expect(turns[0].listener).toBe('林晨');
      expect(turns[0].text).toContain('不要硬撑了！');
      expect(turns[0].isHighTension).toBe(true);

      expect(turns[1].speaker).toBe('林晨');
      expect(turns[1].listener).toBe('苏雪');
      expect(turns[1].text).toContain('区区天劫');
      expect(turns[1].isHighTension).toBe(true);
    });

    it('Should establish and lock 180-degree axis line for two conversing characters', () => {
      const turns = [
        {
          speaker: '苏雪',
          listener: '林晨',
          text: '退后！',
          emotion: 'tense',
          isHighTension: true,
        },
        {
          speaker: '林晨',
          listener: '苏雪',
          text: '我来断后。',
          emotion: 'calm',
          isHighTension: false,
        },
      ];

      const axis = CinematicShotDecomposer.establish180Axis(turns);
      expect(axis).toBeDefined();
      expect(axis?.charLeft).toBe('苏雪');
      expect(axis?.charRight).toBe('林晨');
      expect(axis?.axisLocked).toBe(true);
    });

    it('Should decompose a 2-character dialogue scene into Establishing Two-Shot, OTS, Reverse OTS, and Reaction shots', () => {
      const scene: NovelScene = {
        id: 'scene-clash',
        chapterId: 'chap-1',
        sceneNumber: 1,
        title: '绝境对决',
        content: `苏雪：“林晨，护宗大阵即将破碎，不要硬撑了！”
林晨冷笑道：“区区天劫，何足挂齿！”`,
        characters: ['苏雪', '林晨'],
        dialogues: [
          {
            id: 'd1',
            sceneId: 'scene-clash',
            character: '苏雪',
            content: '林晨，护宗大阵即将破碎，不要硬撑了！',
            position: 0,
          },
          {
            id: 'd2',
            sceneId: 'scene-clash',
            character: '林晨',
            content: '区区天劫，何足挂齿！',
            position: 1,
          },
        ],
        emotions: [],
        startPosition: 0,
        endPosition: 100,
      };

      const result = CinematicShotDecomposer.decomposeSceneToCinematicShots(scene, mockCharacters);

      // 应当至少包含：双人同框建立、过肩正打、反打、反应镜头
      expect(result.scenes.length).toBeGreaterThanOrEqual(3);

      const shotTypes = Object.values(result.plans).map((p) => p.shotType);
      expect(shotTypes).toContain('establishing_two_shot');
      expect(shotTypes).toContain('over_the_shoulder_a');
      expect(shotTypes).toContain('reverse_shot_b');

      // 验证 180° 防跳轴视线一致性
      const otsPlan = Object.values(result.plans).find((p) => p.shotType === 'over_the_shoulder_a');
      expect(otsPlan?.gazeDirection).toBe('look_right');

      const reversePlan = Object.values(result.plans).find((p) => p.shotType === 'reverse_shot_b');
      expect(reversePlan?.gazeDirection).toBe('look_left');

      // 验证提示词中包含过肩虚化描述 (OTS Silhouette)
      const otsScene = result.scenes.find((s) => s.title?.includes('过肩正打'));
      expect(otsScene?.content).toContain('over-the-shoulder shot (OTS)');
      expect(otsScene?.content).toContain('silhouette');
    });

    it('Should leave single-monologue scenes untouched as a single shot', () => {
      const soloScene: NovelScene = {
        id: 'scene-solo',
        chapterId: 'chap-1',
        sceneNumber: 2,
        title: '独自行走',
        content: '林晨独自漫步在细雨绵绵的街道上，心中思绪万千。',
        characters: ['林晨'],
        dialogues: [],
        emotions: [],
        startPosition: 0,
        endPosition: 50,
      };

      const result = CinematicShotDecomposer.decomposeSceneToCinematicShots(soloScene, mockCharacters);
      expect(result.scenes.length).toBe(1);
      expect(result.scenes[0].id).toBe('scene-solo');
    });
  });

  describe('StoryboardArtistAgent Integration', () => {
    it('Should automatically decompose dialogue scenes in blackboard into cinematic shot sequence', async () => {
      const bb = new ProjectBlackboard();
      bb.update(
        {
          characters: mockCharacters,
          scenes: [
            {
              id: 'sc-1',
              chapterId: 'c1',
              sceneNumber: 1,
              title: '对决序幕',
              content: '苏雪：“林晨，快走！” 林晨：“休想！”',
              dialogues: [
                { id: 'd1', sceneId: 'sc-1', character: '苏雪', content: '林晨，快走！', position: 0 },
                { id: 'd2', sceneId: 'sc-1', character: '林晨', content: '休想！', position: 1 },
              ],
              characters: ['苏雪', '林晨'],
              emotions: [],
              startPosition: 0,
              endPosition: 50,
            },
          ],
        },
        'test',
        'TestInit'
      );

      const frameAgent = new StoryboardArtistAgent();
      await frameAgent.execute(bb);

      const data = bb.getData();
      // 场景应被拆解为多个子镜头
      expect(data.scenes.length).toBeGreaterThan(1);
      expect(Object.keys(data.cameraDirectingPlans).length).toBe(data.scenes.length);

      const hasOts = Object.values(data.cameraDirectingPlans).some(
        (p) => p.shotType === 'over_the_shoulder_a' || p.shotType === 'reverse_shot_b'
      );
      expect(hasOts).toBe(true);
    });
  });

  describe('QualityAuditorAgent Cinematography Evaluation', () => {
    it('Should grant higher cinematography score when Shot-Reverse-Shot is present', async () => {
      const bb = new ProjectBlackboard();
      bb.update(
        {
          characters: mockCharacters.map((c) => ({
            ...c,
            referenceImage: 'mock_ref.png',
          })),
          scenes: [
            {
              id: 'sc-shot-1',
              chapterId: 'c1',
              sceneNumber: 1,
              title: '镜头 1 · [双人全景建立]',
              content: 'master establishing two-shot, 8k anime masterpiece, dramatic rim light',
              dialogues: [],
              cameraMovement: 'depth_zoom',
              lighting: 'volumetric dramatic rim light',
              characters: ['苏雪', '林晨'],
              emotions: [],
              startPosition: 0,
              endPosition: 50,
            },
            {
              id: 'sc-shot-2',
              chapterId: 'c1',
              sceneNumber: 2,
              title: '镜头 2 · [过肩正打 · 苏雪]',
              content: 'cinematic over-the-shoulder shot (OTS), blurred silhouette of 林晨 in foreground right',
              dialogues: [{ id: 'd1', sceneId: 'sc-shot-2', character: '苏雪', content: '不要硬撑了！', position: 0 }],
              cameraMovement: 'breathing_micro',
              lighting: 'soft fill rim light',
              characters: ['苏雪'],
              emotions: [],
              startPosition: 0,
              endPosition: 50,
            },
            {
              id: 'sc-shot-3',
              chapterId: 'c1',
              sceneNumber: 3,
              title: '镜头 3 · [过肩反打 · 林晨]',
              content: 'cinematic reverse over-the-shoulder shot, blurred silhouette of 苏雪 in foreground left',
              dialogues: [{ id: 'd2', sceneId: 'sc-shot-3', character: '林晨', content: '区区天劫何足挂齿！', position: 0 }],
              cameraMovement: 'punch_zoom',
              lighting: 'hard edge lighting',
              characters: ['林晨'],
              emotions: [],
              startPosition: 0,
              endPosition: 50,
            },
          ],
          cameraDirectingPlans: {
            'sc-shot-1': { cameraMotion: 'Hitchcock_Zoom', cameraDistance: 'Wide', pacingSeconds: 3.0, shotType: 'establishing_two_shot' },
            'sc-shot-2': { cameraMotion: 'Breathing_Micro', cameraDistance: 'CloseUp', pacingSeconds: 2.8, shotType: 'over_the_shoulder_a' },
            'sc-shot-3': { cameraMotion: 'Punch_Zoom', cameraDistance: 'CloseUp', pacingSeconds: 2.5, shotType: 'reverse_shot_b' },
          },
        },
        'test',
        'TestInit'
      );

      const auditor = new QualityAuditorAgent();
      await auditor.execute(bb);

      const data = bb.getData();
      const latestReport = data.auditReports[data.auditReports.length - 1];
      expect(latestReport).toBeDefined();

      const cinemaMetric = latestReport.metrics.find((m) => m.name.includes('镜头机位与运镜语法'));
      expect(cinemaMetric).toBeDefined();
      expect(cinemaMetric?.passed).toBe(true);
      expect(cinemaMetric?.score).toBeGreaterThanOrEqual(90);
    });
  });
});
