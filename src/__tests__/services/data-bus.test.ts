import { ProjectBlackboard } from '@/core/services/agent/ProjectBlackboard';
import { assetPersistenceBridge } from '@/core/services/data-bus/AssetPersistenceBridge';
import { projectDataBus } from '@/core/services/data-bus/ProjectDataBus';
import { useProjectStore } from '@/stores';

describe('ProjectDataBus & AssetPersistenceBridge', () => {
  const testProjectId = 'test-proj-bus-001';

  beforeEach(() => {
    useProjectStore.setState({
      projects: [
        {
          id: testProjectId,
          name: '数据总线测试工程',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'draft',
        },
      ],
      currentProject: null,
    });
  });

  it('should successfully sync blackboard data into useProjectStore', () => {
    const bb = new ProjectBlackboard('测试剧本正文内容', 'novel_text', '数据总线测试工程');
    bb.update(
      {
        characters: [
          {
            id: 'char-1',
            name: '林澈',
            role: 'protagonist',
            gender: 'male',
            age: '24',
            personality: ['沉着', '坚毅'],
            appearance: '黑短发，风衣',
            background: '全息侦探',
            voice: { provider: 'edge', voiceId: 'zh-CN-YunxiNeural' },
          },
        ],
        scenes: [
          {
            id: 'scene-1',
            chapterId: 'chap-1',
            sceneNumber: 1,
            title: '雨夜追踪',
            content: '暴雨倾盆的霓虹街头，林澈快步穿越巷口。',
            location: '霓虹街巷',
            startPosition: 0,
            endPosition: 30,
            characters: ['林澈'],
            dialogues: [{ id: 'd-1', sceneId: 'scene-1', character: '林澈', content: '他逃不掉了。', position: 10 }],
            emotions: [{ type: 'tense', intensity: 0.8, dominant: true }],
            imagePrompts: ['cyberpunk neon street in heavy rain, cinematic lighting, 8k'],
          },
        ],
        stage: 'visuals',
      },
      'agent-director',
      'DirectorAgent',
      '完成第1幕分镜拆解'
    );

    const updated = projectDataBus.syncBlackboardToProjectStore(bb.getData(), testProjectId);
    expect(updated).not.toBeNull();
    expect(updated?.characters).toHaveLength(1);
    expect(updated?.characters?.[0].name).toBe('林澈');
    expect(updated?.storyboardFrames).toHaveLength(1);
    expect(updated?.storyboardFrames?.[0].title).toBe('雨夜追踪');
    expect(updated?.status).toBe('processing');

    const inStore = useProjectStore.getState().projects.find((p) => p.id === testProjectId);
    expect(inStore?.characters?.[0].name).toBe('林澈');
  });

  it('should load project data back into a fresh blackboard', () => {
    const project = useProjectStore.getState().projects.find((p) => p.id === testProjectId)!;
    project.script = '回填测试剧本';
    project.characters = [
      {
        id: 'char-2',
        name: '苏晴',
        role: 'supporting',
        gender: 'female',
        voice: { provider: 'edge', voiceId: 'zh-CN-XiaoxiaoNeural' },
      },
    ];

    const bb = projectDataBus.createBlackboardForProject(project);
    const data = bb.getData();
    expect(data.scriptContent).toBe('回填测试剧本');
    expect(data.characters).toHaveLength(1);
    expect(data.characters[0].name).toBe('苏晴');
  });

  it('should persist and resolve asset URIs with AssetPersistenceBridge', async () => {
    const testData = 'data:text/plain;base64,SGVsbG8gS2luZW8gQXNzZXRzIQ==';
    const assetMeta = await assetPersistenceBridge.persistAsset(testProjectId, 'test-asset-1', testData, {
      fileName: 'hello.txt',
      mimeType: 'text/plain',
    });

    expect(assetMeta.id).toBe('test-asset-1');
    expect(assetMeta.projectId).toBe(testProjectId);
    expect(assetMeta.uri).toBeDefined();

    const resolved = await assetPersistenceBridge.resolveAssetUri(testProjectId, 'test-asset-1', assetMeta.uri);
    expect(resolved).toBeDefined();
  });
});
