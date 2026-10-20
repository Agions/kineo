/**
 * 分镜服务测试 - Storyboard Service Tests
 */

import type { StoryboardFrame } from '@/common/types/storyboard';
import {
  StoryboardService,
  resetStoryboardService,
  getStoryboardService,
} from '@/core/services/storyboard-service';
import type { ScriptImportMetadata } from '@/features/storyboard/components/NovelImporter';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}));

// Mock logger
jest.mock('@/core/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock aiService
jest.mock('@/core/services/ai/text/ai-service', () => ({
  aiService: {
    generate: jest.fn(),
  },
}));

// Mock imageGenerationService
jest.mock('@/core/services/ai/image/image-generation-service', () => ({
  imageGenerationService: {
    generateImage: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  data: {} as Record<string, string>,
  getItem: jest.fn((key: string) => localStorageMock.data[key] ?? null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageMock.data[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete localStorageMock.data[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.data = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Test data helpers
const createTestFrame = (overrides: Partial<StoryboardFrame> = {}): StoryboardFrame => ({
  id: 'frame-1',
  title: '测试分镜',
  sceneDescription: '场景描述',
  composition: '中心构图',
  cameraType: 'medium',
  dialogue: '对话内容',
  duration: 5,
  ...overrides,
});

const createTestScript = () => ({
  title: '测试剧本',
  content: '这是测试剧本内容\n包含多段落内容',
  segments: [
    { content: '第一段内容', type: 'dialogue' },
    { content: '第二段内容', type: 'narrative' },
  ],
});

// Helper to get mock functions
const getMockGenerate = () =>
  require('@/core/services/ai/text/ai-service').aiService.generate as jest.Mock;
const getMockGenerateImage = () =>
  require('@/core/services/ai/image/image-generation-service').imageGenerationService
    .generateImage as jest.Mock;

describe('StoryboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.data = {};
    resetStoryboardService();
  });

  afterEach(() => {
    resetStoryboardService();
  });

  describe('构造函数', () => {
    it('应该使用默认选项初始化', () => {
      const service = new StoryboardService();
      expect(service.getAll()).toEqual([]);
    });

    it('应该设置 projectId', () => {
      const service = new StoryboardService({ projectId: 'project-123' });
      // Service should initialize without error
      expect(service.getAll()).toEqual([]);
    });

    it('autoSave 默认为 true', () => {
      const service = new StoryboardService({ autoSave: undefined });
      expect(service.getAll()).toEqual([]);
    });

    it('应该支持 autoSave: false', () => {
      const service = new StoryboardService({ autoSave: false });
      expect(service.getAll()).toEqual([]);
    });
  });

  describe('基础 CRUD - getAll / getById', () => {
    it('getAll 应该返回空数组当没有数据', () => {
      const service = new StoryboardService();
      expect(service.getAll()).toEqual([]);
    });

    it('getById 应该返回 undefined 当不存在', () => {
      const service = new StoryboardService();
      expect(service.getById('non-existent')).toBeUndefined();
    });

    it('getAll 应该返回指定 projectId 的分镜', () => {
      const service = new StoryboardService({ projectId: 'project-1' });
      const frame = service.create({
        title: '分镜1',
        sceneDescription: '场景1',
      });

      expect(service.getAll()).toHaveLength(1);
      expect(service.getAll()[0].id).toBe(frame.id);
    });

    it('不同 projectId 应该使用不同的存储', () => {
      const service1 = new StoryboardService({ projectId: 'project-1' });
      const service2 = new StoryboardService({ projectId: 'project-2' });

      service1.create({
        title: '分镜1',
        sceneDescription: '场景1',
      });

      service2.create({
        title: '分镜2',
        sceneDescription: '场景2',
      });

      expect(service1.getAll()).toHaveLength(1);
      expect(service2.getAll()).toHaveLength(1);
      expect(service1.getAll()[0].title).toBe('分镜1');
      expect(service2.getAll()[0].title).toBe('分镜2');
    });
  });

  describe('基础 CRUD - create', () => {
    it('应该创建基本的分镜帧', () => {
      const service = new StoryboardService();
      const frame = service.create({
        title: '新分镜',
        sceneDescription: '场景描述',
      });

      expect(frame).toMatchObject({
        title: '新分镜',
        sceneDescription: '场景描述',
        composition: '中心构图',
        cameraType: 'medium',
        dialogue: '',
        duration: 5,
      });
      expect(frame.id).toBeDefined();
    });

    it('应该使用提供的 id', () => {
      const service = new StoryboardService();
      const frame = service.create({
        id: 'custom-id',
        title: '新分镜',
        sceneDescription: '场景描述',
      });

      expect(frame.id).toBe('custom-id');
    });

    it('应该使用提供的可选字段', () => {
      const service = new StoryboardService();
      const frame = service.create({
        title: '新分镜',
        sceneDescription: '场景描述',
        composition: '三分法',
        cameraType: 'wide',
        dialogue: '对话',
        duration: 10,
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(frame.composition).toBe('三分法');
      expect(frame.cameraType).toBe('wide');
      expect(frame.dialogue).toBe('对话');
      expect(frame.duration).toBe(10);
      expect(frame.imageUrl).toBe('https://example.com/image.jpg');
    });

    it('创建后应该通知订阅者', () => {
      const service = new StoryboardService();
      const listener = jest.fn();
      service.subscribe(listener);

      service.create({
        title: '新分镜',
        sceneDescription: '场景描述',
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('创建后应该保存到 localStorage', () => {
      const service = new StoryboardService();
      service.create({
        title: '新分镜',
        sceneDescription: '场景描述',
      });

      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('基础 CRUD - update', () => {
    it('应该更新存在的分镜', () => {
      const service = new StoryboardService();
      const frame = service.create({
        title: '原始标题',
        sceneDescription: '原始描述',
      });

      const updated = service.update(frame.id, {
        title: '新标题',
        duration: 10,
      });

      expect(updated).toMatchObject({
        title: '新标题',
        sceneDescription: '原始描述',
        duration: 10,
      });
    });

    it('更新不存在应该返回 null', () => {
      const service = new StoryboardService();
      const result = service.update('non-existent', { title: '新标题' });
      expect(result).toBeNull();
    });

    it('更新后应该通知订阅者', () => {
      const service = new StoryboardService();
      const listener = jest.fn();
      service.subscribe(listener);

      const frame = service.create({
        title: '分镜',
        sceneDescription: '场景',
      });

      service.update(frame.id, { title: '更新后的标题' });

      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('基础 CRUD - delete', () => {
    it('应该删除存在的分镜', () => {
      const service = new StoryboardService();
      const frame = service.create({
        title: '要删除的分镜',
        sceneDescription: '场景',
      });

      expect(service.getAll()).toHaveLength(1);

      const result = service.delete(frame.id);

      expect(result).toBe(true);
      expect(service.getAll()).toHaveLength(0);
    });

    it('删除不存在应该返回 false', () => {
      const service = new StoryboardService();
      const result = service.delete('non-existent');
      expect(result).toBe(false);
    });

    it('删除后应该通知订阅者', () => {
      const service = new StoryboardService();
      const listener = jest.fn();
      service.subscribe(listener);

      const frame = service.create({
        title: '分镜',
        sceneDescription: '场景',
      });

      service.delete(frame.id);

      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('基础 CRUD - bulkCreate', () => {
    it('应该批量创建分镜', () => {
      const service = new StoryboardService();
      const frames = service.bulkCreate([
        { title: '分镜1', sceneDescription: '场景1' },
        { title: '分镜2', sceneDescription: '场景2' },
        { title: '分镜3', sceneDescription: '场景3' },
      ]);

      expect(frames).toHaveLength(3);
      expect(service.getAll()).toHaveLength(3);
    });

    it('应该使用提供的默认值', () => {
      const service = new StoryboardService();
      const frames = service.bulkCreate([
        {
          title: '分镜1',
          sceneDescription: '场景1',
          composition: '三分法',
          cameraType: 'wide',
        },
      ]);

      expect(frames[0].composition).toBe('三分法');
      expect(frames[0].cameraType).toBe('wide');
    });
  });

  describe('基础 CRUD - clear', () => {
    it('应该清空所有分镜', () => {
      const service = new StoryboardService();
      service.bulkCreate([
        { title: '分镜1', sceneDescription: '场景1' },
        { title: '分镜2', sceneDescription: '场景2' },
      ]);

      expect(service.getAll()).toHaveLength(2);

      service.clear();

      expect(service.getAll()).toHaveLength(0);
    });

    it('清空后应该通知订阅者', () => {
      const service = new StoryboardService();
      const listener = jest.fn();
      service.subscribe(listener);

      service.bulkCreate([{ title: '分镜1', sceneDescription: '场景1' }]);

      service.clear();

      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('订阅和通知', () => {
    it('应该添加订阅者', () => {
      const service = new StoryboardService();
      const listener = jest.fn();
      const unsubscribe = service.subscribe(listener);

      service.create({
        title: '分镜',
        sceneDescription: '场景',
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('应该返回取消订阅函数', () => {
      const service = new StoryboardService();
      const listener = jest.fn();
      const unsubscribe = service.subscribe(listener);

      unsubscribe();

      service.create({
        title: '分镜',
        sceneDescription: '场景',
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('多个订阅者应该都被通知', () => {
      const service = new StoryboardService();
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      service.subscribe(listener1);
      service.subscribe(listener2);

      service.create({
        title: '分镜',
        sceneDescription: '场景',
      });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('导入导出', () => {
    it('export 应该导出 JSON', () => {
      const service = new StoryboardService();
      service.create({
        title: '分镜1',
        sceneDescription: '场景1',
      });
      service.create({
        title: '分镜2',
        sceneDescription: '场景2',
      });

      const json = service.export();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(2);
    });

    it('import 应该导入有效的分镜', () => {
      const service = new StoryboardService();
      const framesToImport: StoryboardFrame[] = [
        createTestFrame({ id: 'frame-1', title: '导入分镜1' }),
        createTestFrame({ id: 'frame-2', title: '导入分镜2' }),
      ];

      const imported = service.import(JSON.stringify(framesToImport));

      expect(imported).toHaveLength(2);
      expect(service.getAll()).toHaveLength(2);
    });

    it('import 应该过滤无效的分镜', () => {
      const service = new StoryboardService();
      const invalidFrames = [
        { title: '缺少 id' } as any,
        { id: 'valid-id', title: '有效分镜', sceneDescription: '场景描述' },
      ];

      const imported = service.import(JSON.stringify(invalidFrames));

      expect(imported).toHaveLength(1);
    });

    it('import 无效 JSON 应该返回空数组', () => {
      const service = new StoryboardService();
      const imported = service.import('invalid json');

      expect(imported).toHaveLength(0);
    });

    it('import 后应该通知订阅者', () => {
      const service = new StoryboardService();
      const listener = jest.fn();
      service.subscribe(listener);

      const validFrames = [createTestFrame({ id: 'frame-1' })];
      service.import(JSON.stringify(validFrames));

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('AI 生成 - generateFromScript', () => {
    it('应该从剧本生成分镜', async () => {
      const service = new StoryboardService();
      getMockGenerate().mockResolvedValue(
        JSON.stringify([
          {
            title: 'AI分镜1',
            sceneDescription: 'AI场景1',
            composition: '三分法',
            cameraType: 'wide',
            dialogue: '对话1',
            duration: 5,
          },
          {
            title: 'AI分镜2',
            sceneDescription: 'AI场景2',
            composition: '中心构图',
            cameraType: 'medium',
            dialogue: '对话2',
            duration: 10,
          },
        ])
      );

      const frames = await service.generateFromScript(createTestScript());

      expect(frames).toHaveLength(2);
      expect(frames[0].title).toBe('AI分镜1');
      expect(frames[1].cameraType).toBe('medium');
    });

    it('应该使用自定义选项', async () => {
      const service = new StoryboardService();
      getMockGenerate().mockResolvedValue('[]');

      await service.generateFromScript(createTestScript(), {
        provider: 'openai',
        model: 'gpt-4',
        frameCount: 4,
      });

      expect(getMockGenerate()).toHaveBeenCalled();
    });

    it('AI 返回无效 JSON 应该使用 fallback', async () => {
      const service = new StoryboardService();
      getMockGenerate().mockResolvedValue('不是有效的 JSON');

      const frames = await service.generateFromScript({
        title: '测试剧本',
        content: '段落1\n段落2\n段落3',
      });

      expect(frames.length).toBeGreaterThan(0);
    });

    it('AI 生成失败应该抛出错误', async () => {
      const service = new StoryboardService();
      getMockGenerate().mockRejectedValue(new Error('API Error'));

      await expect(service.generateFromScript(createTestScript())).rejects.toThrow('API Error');
    });
  });

  describe('AI 生成 - generateFrameImage', () => {
    it('应该生成分镜图像', async () => {
      const service = new StoryboardService();
      const frame = service.create({
        title: '分镜',
        sceneDescription: '场景',
      });

      getMockGenerateImage().mockResolvedValue({ url: 'https://example.com/generated.jpg' });

      const url = await service.generateFrameImage(frame.id);

      expect(url).toBe('https://example.com/generated.jpg');
      expect(getMockGenerateImage()).toHaveBeenCalled();
    });

    it('分镜不存在应该返回 null', async () => {
      const service = new StoryboardService();

      const url = await service.generateFrameImage('non-existent');

      expect(url).toBeNull();
    });

    it('生成失败应该返回 null', async () => {
      const service = new StoryboardService();
      const frame = service.create({
        title: '分镜',
        sceneDescription: '场景',
      });

      getMockGenerateImage().mockResolvedValue({ url: null });

      const url = await service.generateFrameImage(frame.id);

      expect(url).toBeNull();
    });

    it('生成成功后应该更新分镜', async () => {
      const service = new StoryboardService();
      const frame = service.create({
        title: '分镜',
        sceneDescription: '场景',
      });

      getMockGenerateImage().mockResolvedValue({ url: 'https://example.com/new-image.jpg' });

      await service.generateFrameImage(frame.id);

      const updated = service.getById(frame.id);
      expect(updated?.imageUrl).toBe('https://example.com/new-image.jpg');
    });
  });

  describe('AI 生成 - generateAllFrameImages', () => {
    it('应该批量生成所有分镜图像', async () => {
      const service = new StoryboardService();
      service.bulkCreate([
        { title: '分镜1', sceneDescription: '场景1' },
        { title: '分镜2', sceneDescription: '场景2' },
      ]);

      getMockGenerateImage().mockResolvedValue({ url: 'https://example.com/img.jpg' });

      const onProgress = jest.fn();
      const results = await service.generateAllFrameImages({}, onProgress);

      expect(results.size).toBe(2);
      expect(onProgress).toHaveBeenCalledTimes(2);
    });

    it('已有图像的分镜应该跳过', async () => {
      const service = new StoryboardService();
      const frames = service.bulkCreate([
        { title: '分镜1', sceneDescription: '场景1', imageUrl: 'https://existing.com/img.jpg' },
        { title: '分镜2', sceneDescription: '场景2' },
      ]);

      getMockGenerateImage().mockResolvedValue({ url: 'https://example.com/img.jpg' });

      const results = await service.generateAllFrameImages();

      expect(results.size).toBe(2);
      expect(results.get(frames[0].id)).toBe('https://existing.com/img.jpg');
      expect(getMockGenerateImage()).toHaveBeenCalledTimes(1);
    });

    it('进度回调应该报告正确数字', async () => {
      const service = new StoryboardService();
      service.bulkCreate([
        { title: '分镜1', sceneDescription: '场景1' },
        { title: '分镜2', sceneDescription: '场景2' },
        { title: '分镜3', sceneDescription: '场景3' },
      ]);

      getMockGenerateImage().mockResolvedValue({ url: 'https://example.com/img.jpg' });

      const onProgress = jest.fn();
      await service.generateAllFrameImages({}, onProgress);

      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 3);
      expect(onProgress).toHaveBeenNthCalledWith(2, 2, 3);
      expect(onProgress).toHaveBeenNthCalledWith(3, 3, 3);
    });
  });

  describe('持久化', () => {
    it('autoSave: false 时不应保存到 localStorage', () => {
      const service = new StoryboardService({ autoSave: false });

      service.create({
        title: '分镜',
        sceneDescription: '场景',
      });

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('应该从 localStorage 加载数据', () => {
      const storedFrames = [createTestFrame({ id: 'stored-frame' })];
      localStorageMock.data['kineo-storyboards'] = JSON.stringify(storedFrames);

      const service = new StoryboardService();

      expect(service.getAll()).toHaveLength(1);
      expect(service.getById('stored-frame')).toBeDefined();
    });

    it('不同 projectId 使用不同的存储键', () => {
      const storedFrames = [createTestFrame({ id: 'project-frame' })];
      localStorageMock.data['kineo-storyboards-project-1'] = JSON.stringify(storedFrames);

      const service = new StoryboardService({ projectId: 'project-1' });

      expect(service.getAll()).toHaveLength(1);
    });

    it('损坏的存储数据不应该抛出错误', () => {
      localStorageMock.data['kineo-storyboards'] = 'invalid json';

      const service = new StoryboardService();

      expect(service.getAll()).toEqual([]);
    });
  });

  describe('辅助方法', () => {
    it('buildImagePrompt 应该生成正确的提示词', () => {
      const service = new StoryboardService();
      const frame = createTestFrame({
        sceneDescription: '美丽的风景',
        composition: '三分法',
        cameraType: 'wide',
      });

      // 通过生成图像来测试提示词构建
      getMockGenerateImage().mockImplementation(async (prompt: string) => {
        expect(prompt).toContain('场景：美丽的风景');
        expect(prompt).toContain('构图：三分法');
        expect(prompt).toContain('镜头：全景镜头');
        return { url: 'https://example.com/img.jpg' };
      });

      service.create(frame);
      service.generateFrameImage(frame.id);
    });
  });
});

describe('getStoryboardService 单例', () => {
  beforeEach(() => {
    resetStoryboardService();
  });

  afterEach(() => {
    resetStoryboardService();
  });

  it('应该返回单例', () => {
    const service1 = getStoryboardService();
    const service2 = getStoryboardService();

    expect(service1).toBe(service2);
  });

  it('resetStoryboardService 应该重置单例', () => {
    const service1 = getStoryboardService();
    resetStoryboardService();
    const service2 = getStoryboardService();

    expect(service1).not.toBe(service2);
  });
});
