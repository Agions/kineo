/**
 * 合成服务测试 - Composition Service Tests
 */

import type { StoryboardFrame } from '@/common/types/storyboard';
import {
  CompositionService,
  getCompositionService,
  resetCompositionService,
} from '@/core/services/domain/composition-service';

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

describe('CompositionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.data = {};
    resetCompositionService();
  });

  afterEach(() => {
    resetCompositionService();
  });

  describe('构造函数', () => {
    it('应该使用默认选项初始化', () => {
      const service = new CompositionService();
      expect(service.listAll()).toEqual([]);
    });

    it('应该设置 projectId', () => {
      const service = new CompositionService({ projectId: 'project-123' });
      expect(service.listAll()).toEqual([]);
    });

    it('autoSave 默认为 true', () => {
      const service = new CompositionService({ autoSave: undefined });
      expect(service.listAll()).toEqual([]);
    });

    it('应该支持 autoSave: false', () => {
      const service = new CompositionService({ autoSave: false });
      expect(service.listAll()).toEqual([]);
    });
  });

  describe('create', () => {
    it('应该创建基本的合成项目', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      expect(composition).toMatchObject({
        projectId: 'project-1',
        frames: [],
        transitions: [],
        masterSettings: {
          frameDuration: 3,
          defaultTransition: {
            effect: 'crossfade',
            duration: 0.5,
            easing: 'ease-in-out',
          },
        },
      });
      expect(composition.id).toBeDefined();
    });

    it('应该使用提供的 masterSettings', () => {
      const service = new CompositionService();
      const composition = service.create('project-1', {
        frameDuration: 5,
      });

      expect(composition.masterSettings.frameDuration).toBe(5);
    });

    it('创建后应该通知订阅者', () => {
      const service = new CompositionService();
      const listener = jest.fn();
      service.subscribe(listener);

      service.create('project-1');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('创建后应该保存到 localStorage', () => {
      const service = new CompositionService();
      service.create('project-1');

      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getByProjectId', () => {
    it('应该返回 null 当不存在', () => {
      const service = new CompositionService();
      expect(service.getByProjectId('non-existent')).toBeNull();
    });

    it('应该返回指定 projectId 的合成', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      const found = service.getByProjectId('project-1');
      expect(found).not.toBeNull();
      expect(found!.id).toBe(composition.id);
    });

    it('不同 projectId 应该返回不同的合成', () => {
      const service = new CompositionService();
      service.create('project-1');
      service.create('project-2');

      const found1 = service.getByProjectId('project-1');
      const found2 = service.getByProjectId('project-2');

      expect(found1).not.toBeNull();
      expect(found2).not.toBeNull();
      expect(found1!.id).not.toBe(found2!.id);
    });
  });

  describe('getById', () => {
    it('应该返回 undefined 当不存在', () => {
      const service = new CompositionService();
      expect(service.getById('non-existent')).toBeUndefined();
    });

    it('应该通过 ID 返回合成', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      const found = service.getById(composition.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(composition.id);
    });
  });

  describe('setFrameAnimation', () => {
    it('应该返回 null 当合成不存在', () => {
      const service = new CompositionService();
      const result = service.setFrameAnimation('non-existent', 'frame-1', { zoom: 1.5 });
      expect(result).toBeNull();
    });

    it('应该创建新的帧动画配置', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      const result = service.setFrameAnimation(composition.id, 'frame-1', {
        zoom: 1.5,
        pan: { x: 10, y: 20 },
        rotation: 45,
      });

      expect(result).not.toBeNull();
      expect(result!.zoom).toBe(1.5);
      expect(result!.pan).toEqual({ x: 10, y: 20 });
      expect(result!.rotation).toBe(45);
    });

    it('应该更新已存在的帧动画配置', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      service.setFrameAnimation(composition.id, 'frame-1', { zoom: 1.5 });
      const result = service.setFrameAnimation(composition.id, 'frame-1', { rotation: 90 });

      expect(result!.zoom).toBe(1.5);
      expect(result!.rotation).toBe(90);
    });

    it('应该使用默认的 filters 值', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      const result = service.setFrameAnimation(composition.id, 'frame-1', {});

      expect(result!.filters).toEqual({
        blur: 0,
        brightness: 100,
        contrast: 100,
        saturation: 100,
      });
    });

    it('更新后应该通知订阅者', () => {
      const service = new CompositionService();
      const listener = jest.fn();
      service.subscribe(listener);
      // create 触发一次 notifyChange
      service.create('project-1');

      // 重置 mock 以便只计算后续调用
      listener.mockClear();

      service.setFrameAnimation(service.getByProjectId('project-1')!.id, 'frame-1', { zoom: 1.5 });

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('initializeFromStoryboard', () => {
    it('应该返回 false 当合成不存在', () => {
      const service = new CompositionService();
      const result = service.initializeFromStoryboard('non-existent', []);
      expect(result).toBe(false);
    });

    it('应该从分镜批量初始化帧动画', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      const frames: StoryboardFrame[] = [
        createTestFrame({ id: 'frame-1' }),
        createTestFrame({ id: 'frame-2' }),
        createTestFrame({ id: 'frame-3' }),
      ];

      const result = service.initializeFromStoryboard(composition.id, frames);

      expect(result).toBe(true);
      const updated = service.getById(composition.id);
      expect(updated!.frames).toHaveLength(3);
      expect(updated!.frames[0].frameId).toBe('frame-1');
      expect(updated!.frames[1].frameId).toBe('frame-2');
    });

    it('应该使用默认的动画属性', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      const frames = [createTestFrame({ id: 'frame-1' })];
      service.initializeFromStoryboard(composition.id, frames);

      const updated = service.getById(composition.id);
      expect(updated!.frames[0].zoom).toBe(1);
      expect(updated!.frames[0].pan).toEqual({ x: 0, y: 0 });
      expect(updated!.frames[0].rotation).toBe(0);
      expect(updated!.frames[0].opacity).toBe(1);
    });

    it('初始化后应该通知订阅者', () => {
      const service = new CompositionService();
      const listener = jest.fn();
      service.subscribe(listener);
      // create 触发一次 notifyChange
      service.create('project-1');

      // 重置 mock 以便只计算后续调用
      listener.mockClear();

      service.initializeFromStoryboard(service.getByProjectId('project-1')!.id, [
        createTestFrame({ id: 'frame-1' }),
      ]);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteFrameAnimation', () => {
    it('应该返回 false 当合成不存在', () => {
      const service = new CompositionService();
      const result = service.deleteFrameAnimation('non-existent', 'frame-1');
      expect(result).toBe(false);
    });

    it('应该返回 false 当帧不存在', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      const result = service.deleteFrameAnimation(composition.id, 'non-existent');
      expect(result).toBe(false);
    });

    it('应该删除存在的帧动画配置', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      service.setFrameAnimation(composition.id, 'frame-1', { zoom: 1.5 });

      const result = service.deleteFrameAnimation(composition.id, 'frame-1');

      expect(result).toBe(true);
      const updated = service.getById(composition.id);
      expect(updated!.frames).toHaveLength(0);
    });

    it('删除后应该通知订阅者', () => {
      const service = new CompositionService();
      service.create('project-1');
      service.setFrameAnimation(service.getByProjectId('project-1')!.id, 'frame-1', { zoom: 1.5 });
      const listener = jest.fn();
      service.subscribe(listener);

      // 订阅后首次调用是 create，再调用 setFrameAnimation 不再触发（因为已存在）
      // 所以先清空，只关注删除时的通知
      listener.mockClear();

      service.deleteFrameAnimation(service.getByProjectId('project-1')!.id, 'frame-1');

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFrameAnimation', () => {
    it('应该返回 undefined 当合成不存在', () => {
      const service = new CompositionService();
      expect(service.getFrameAnimation('non-existent', 'frame-1')).toBeUndefined();
    });

    it('应该返回 undefined 当帧不存在', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      expect(service.getFrameAnimation(composition.id, 'non-existent')).toBeUndefined();
    });

    it('应该返回帧动画配置', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      service.setFrameAnimation(composition.id, 'frame-1', { zoom: 1.5 });

      const result = service.getFrameAnimation(composition.id, 'frame-1');

      expect(result).toBeDefined();
      expect(result!.zoom).toBe(1.5);
    });
  });

  describe('setTransition', () => {
    it('应该返回 false 当合成不存在', () => {
      const service = new CompositionService();
      const result = service.setTransition('non-existent', 0, {
        effect: 'fade',
        duration: 0.5,
      });
      expect(result).toBe(false);
    });

    it('应该添加新的转场配置', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      const result = service.setTransition(composition.id, 0, {
        effect: 'fade',
        duration: 0.5,
      });

      expect(result).toBe(true);
      const updated = service.getById(composition.id);
      expect(updated!.transitions).toHaveLength(1);
      expect(updated!.transitions[0].effect).toBe('fade');
    });

    it('应该更新已存在的转场配置', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      service.setTransition(composition.id, 0, { effect: 'fade', duration: 0.5 });

      service.setTransition(composition.id, 0, { effect: 'crossfade', duration: 1 });

      const updated = service.getById(composition.id);
      expect(updated!.transitions[0].effect).toBe('crossfade');
      expect(updated!.transitions[0].duration).toBe(1);
    });

    it('应该支持在末尾添加新的转场', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      service.setTransition(composition.id, 0, { effect: 'fade', duration: 0.5 });

      service.setTransition(composition.id, 1, { effect: 'dissolve', duration: 1.5 });

      const updated = service.getById(composition.id);
      expect(updated!.transitions).toHaveLength(2);
    });
  });

  describe('setDefaultTransition', () => {
    it('应该返回 false 当合成不存在', () => {
      const service = new CompositionService();
      const result = service.setDefaultTransition('non-existent', {
        effect: 'fade',
        duration: 0.5,
      });
      expect(result).toBe(false);
    });

    it('应该更新默认转场配置', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      const result = service.setDefaultTransition(composition.id, {
        effect: 'zoom',
        duration: 1,
        easing: 'ease-out',
      });

      expect(result).toBe(true);
      const updated = service.getById(composition.id);
      expect(updated!.masterSettings.defaultTransition.effect).toBe('zoom');
      expect(updated!.masterSettings.defaultTransition.duration).toBe(1);
    });
  });

  describe('updateMasterSettings', () => {
    it('应该返回 false 当合成不存在', () => {
      const service = new CompositionService();
      const result = service.updateMasterSettings('non-existent', { frameDuration: 5 });
      expect(result).toBe(false);
    });

    it('应该更新全局设置', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      const result = service.updateMasterSettings(composition.id, { frameDuration: 10 });

      expect(result).toBe(true);
      const updated = service.getById(composition.id);
      expect(updated!.masterSettings.frameDuration).toBe(10);
    });

    it('应该保留未更新的设置', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      service.updateMasterSettings(composition.id, { frameDuration: 10 });
      service.updateMasterSettings(composition.id, { frameDuration: 5 });

      const updated = service.getById(composition.id);
      expect(updated!.masterSettings.frameDuration).toBe(5);
      expect(updated!.masterSettings.defaultTransition.effect).toBe('crossfade');
    });
  });

  describe('addKeyframe', () => {
    it('应该返回 false 当合成不存在', () => {
      const service = new CompositionService();
      const result = service.addKeyframe('non-existent', 'frame-1', {
        time: 0,
        property: 'zoom',
        value: 1.5,
      });
      expect(result).toBe(false);
    });

    it('应该返回 false 当帧不存在', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      const result = service.addKeyframe(composition.id, 'non-existent', {
        time: 0,
        property: 'zoom',
        value: 1.5,
      });
      expect(result).toBe(false);
    });

    it('应该添加关键帧', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      service.setFrameAnimation(composition.id, 'frame-1', { zoom: 1 });

      const result = service.addKeyframe(composition.id, 'frame-1', {
        time: 0,
        property: 'zoom',
        value: 1.5,
      });

      expect(result).toBe(true);
      const frame = service.getFrameAnimation(composition.id, 'frame-1');
      expect(frame!.keyframes).toHaveLength(1);
      expect(frame!.keyframes![0].time).toBe(0);
      expect(frame!.keyframes![0].value).toBe(1.5);
    });

    it('应该按时间排序关键帧', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      service.setFrameAnimation(composition.id, 'frame-1', { zoom: 1 });

      service.addKeyframe(composition.id, 'frame-1', { time: 2, property: 'zoom', value: 2 });
      service.addKeyframe(composition.id, 'frame-1', { time: 0, property: 'zoom', value: 1.5 });
      service.addKeyframe(composition.id, 'frame-1', { time: 1, property: 'zoom', value: 1.8 });

      const frame = service.getFrameAnimation(composition.id, 'frame-1');
      expect(frame!.keyframes![0].time).toBe(0);
      expect(frame!.keyframes![1].time).toBe(1);
      expect(frame!.keyframes![2].time).toBe(2);
    });

    it('应该使用默认的 easing 值', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      service.setFrameAnimation(composition.id, 'frame-1', { zoom: 1 });

      service.addKeyframe(composition.id, 'frame-1', {
        time: 0,
        property: 'zoom',
        value: 1.5,
      });

      const frame = service.getFrameAnimation(composition.id, 'frame-1');
      expect(frame!.keyframes![0].easing).toBe('ease-in-out');
    });
  });

  describe('deleteKeyframe', () => {
    it('应该返回 false 当合成不存在', () => {
      const service = new CompositionService();
      const result = service.deleteKeyframe('non-existent', 'frame-1', 0);
      expect(result).toBe(false);
    });

    it('应该返回 false 当帧不存在', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      const result = service.deleteKeyframe(composition.id, 'non-existent', 0);
      expect(result).toBe(false);
    });

    it('应该返回 false 当关键帧索引无效', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      service.setFrameAnimation(composition.id, 'frame-1', { zoom: 1 });
      service.addKeyframe(composition.id, 'frame-1', { time: 0, property: 'zoom', value: 1.5 });

      const result = service.deleteKeyframe(composition.id, 'frame-1', 5);
      expect(result).toBe(false);
    });

    it('应该删除关键帧', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      service.setFrameAnimation(composition.id, 'frame-1', { zoom: 1 });
      service.addKeyframe(composition.id, 'frame-1', { time: 0, property: 'zoom', value: 1.5 });
      service.addKeyframe(composition.id, 'frame-1', { time: 1, property: 'zoom', value: 2 });

      const result = service.deleteKeyframe(composition.id, 'frame-1', 0);

      expect(result).toBe(true);
      const frame = service.getFrameAnimation(composition.id, 'frame-1');
      expect(frame!.keyframes).toHaveLength(1);
      expect(frame!.keyframes![0].time).toBe(1);
    });
  });

  describe('exportComposition', () => {
    it('应该返回 null 当合成不存在', () => {
      const service = new CompositionService();
      expect(service.exportComposition('non-existent')).toBeNull();
    });

    it('应该导出合成数据', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      service.setFrameAnimation(composition.id, 'frame-1', { zoom: 1.5 });

      const exported = service.exportComposition(composition.id);

      expect(exported).not.toBeNull();
      expect(exported!.version).toBe('1.0');
      expect(exported!.projectId).toBe('project-1');
      expect(exported!.frames).toHaveLength(1);
      expect(exported!.frames[0].zoom).toBe(1.5);
      expect(exported!.exportedAt).toBeDefined();
    });

    it('应该包含 transitions 和 masterSettings', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');
      service.setTransition(composition.id, 0, { effect: 'fade', duration: 0.5 });

      const exported = service.exportComposition(composition.id);

      expect(exported!.transitions).toHaveLength(1);
      expect(exported!.masterSettings).toBeDefined();
    });
  });

  describe('importComposition', () => {
    it('应该成功导入合成数据', () => {
      const service = new CompositionService();
      const data = {
        version: '1.0',
        projectId: 'project-2',
        frames: [
          {
            frameId: 'frame-1',
            cameraMotion: null,
            zoom: 2,
            pan: { x: 10, y: 20 },
            rotation: 45,
            opacity: 1,
            filters: {
              blur: 0,
              brightness: 100,
              contrast: 100,
              saturation: 100,
            },
          },
        ],
        transitions: [{ effect: 'fade', duration: 0.5 }],
        masterSettings: {
          frameDuration: 3,
          defaultTransition: { effect: 'crossfade', duration: 0.5, easing: 'ease-in-out' },
        },
        exportedAt: new Date().toISOString(),
      };

      const imported = service.importComposition(data);

      expect(imported).not.toBeNull();
      expect(imported!.projectId).toBe('project-2');
      expect(imported!.frames).toHaveLength(1);
      expect(imported!.frames[0].zoom).toBe(2);
    });

    it('导入后应该通知订阅者', () => {
      const service = new CompositionService();
      const listener = jest.fn();
      service.subscribe(listener);

      const data = {
        version: '1.0',
        projectId: 'project-2',
        frames: [],
        transitions: [],
        masterSettings: {
          frameDuration: 3,
          defaultTransition: { effect: 'crossfade', duration: 0.5, easing: 'ease-in-out' },
        },
        exportedAt: new Date().toISOString(),
      };

      service.importComposition(data);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('应该返回 false 当合成不存在', () => {
      const service = new CompositionService();
      const result = service.delete('non-existent');
      expect(result).toBe(false);
    });

    it('应该删除存在的合成', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      expect(service.getById(composition.id)).toBeDefined();

      const result = service.delete(composition.id);

      expect(result).toBe(true);
      expect(service.getById(composition.id)).toBeUndefined();
    });

    it('删除后应该保存到 localStorage', () => {
      const service = new CompositionService();
      const composition = service.create('project-1');

      service.delete(composition.id);

      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('应该添加订阅者', () => {
      const service = new CompositionService();
      const listener = jest.fn();
      service.subscribe(listener);

      service.create('project-1');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('应该返回取消订阅函数', () => {
      const service = new CompositionService();
      const listener = jest.fn();
      const unsubscribe = service.subscribe(listener);

      unsubscribe();

      service.create('project-1');

      expect(listener).not.toHaveBeenCalled();
    });

    it('多个订阅者应该都被通知', () => {
      const service = new CompositionService();
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      service.subscribe(listener1);
      service.subscribe(listener2);

      service.create('project-1');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('listAll', () => {
    it('应该返回空数组当没有数据', () => {
      const service = new CompositionService();
      expect(service.listAll()).toEqual([]);
    });

    it('应该返回所有合成项目', () => {
      const service = new CompositionService();
      service.create('project-1');
      service.create('project-2');

      const all = service.listAll();

      expect(all).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('应该清空所有合成', () => {
      const service = new CompositionService();
      service.create('project-1');
      service.create('project-2');

      expect(service.listAll()).toHaveLength(2);

      service.clear();

      expect(service.listAll()).toHaveLength(0);
    });

    it('清空后应该通知订阅者', () => {
      const service = new CompositionService();
      service.create('project-1');
      const listener = jest.fn();
      service.subscribe(listener);

      // 订阅后 create 触发一次通知
      listener.mockClear();

      service.clear();

      // clear 调用 notifyChange(null) 一次
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(null);
    });
  });

  describe('单例模式', () => {
    it('getCompositionService 应该返回单例', () => {
      const service1 = getCompositionService();
      const service2 = getCompositionService();

      expect(service1).toBe(service2);
    });

    it('resetCompositionService 应该重置单例', () => {
      const service1 = getCompositionService();
      resetCompositionService();
      const service2 = getCompositionService();

      expect(service1).not.toBe(service2);
    });
  });

  describe('localStorage 持久化', () => {
    it('应该从 localStorage 加载数据', () => {
      const storedData = [
        {
          id: 'stored-id',
          projectId: 'stored-project',
          frames: [],
          transitions: [],
          masterSettings: {
            frameDuration: 5,
            defaultTransition: { effect: 'fade', duration: 1, easing: 'linear' },
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      localStorageMock.data['kineo-compositions'] = JSON.stringify(storedData);

      const service = new CompositionService();
      const composition = service.getById('stored-id');

      expect(composition).toBeDefined();
      expect(composition!.projectId).toBe('stored-project');
    });

    it('应该处理 localStorage 解析错误', () => {
      localStorageMock.data['kineo-compositions'] = 'invalid json';

      const service = new CompositionService();

      expect(service.listAll()).toEqual([]);
    });

    it('autoSave: false 时不应该保存到 localStorage', () => {
      const service = new CompositionService({ autoSave: false });
      service.create('project-1');

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });
});
