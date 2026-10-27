/**
 * blackboard-store-bridge.test.ts — ProjectBlackboard 与 useProjectStore 双向响应式桥接与断点恢复测试
 */

import { ProjectBlackboardStoreBridge } from '@/core/services/data-bus/ProjectBlackboardStoreBridge';
import { ProjectBlackboard, ApprovalGate } from '@/core/services/agent/ProjectBlackboard';
import { DAGScheduler } from '@/core/services/agent/DAGScheduler';
import { useProjectStore } from '@/stores';
import type { ProjectData } from '@/core/project/types/project';

describe('ProjectBlackboardStoreBridge Suite', () => {
  beforeEach(() => {
    // 重置 useProjectStore
    useProjectStore.setState({
      projects: [],
      currentProject: null,
    });
  });

  it('Should accurately hydrate ProjectBlackboard from ProjectData', () => {
    const mockProject: ProjectData = {
      id: 'proj-101',
      name: '万界剑尊',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      script: '林晨手握断剑，独立于风雪之中。',
      characters: [
        {
          id: 'char-1',
          name: '林晨',
          role: 'protagonist',
          appearance: '黑衣负剑',
        } as any,
      ],
      parsedScenes: [
        {
          id: 'sc-1',
          chapterId: 'c1',
          sceneNumber: 1,
          title: '风雪独立',
          content: '林晨手握断剑，独立于风雪之中。',
          dialogues: [],
          characters: ['林晨'],
          emotions: [],
          startPosition: 0,
          endPosition: 30,
        },
      ],
      spatialMemory: {
        characterAnchors: {
          林晨: { loraPrompt: 'Lin Chen, sharp eyes', faceLocked: true },
        },
        sceneAnchors: {},
        assetHitRate: 0.95,
      },
      cameraDirectingPlans: {
        'sc-1': {
          cameraMotion: 'Dolly_In',
          cameraDistance: 'Medium',
          pacingSeconds: 3.5,
          shotType: 'ambient_cutaway',
        },
      },
      dagNodes: {
        'task-script': {
          id: 'task-script',
          name: '剧本解析',
          agentRole: '编剧',
          dependencies: [],
          status: 'completed',
        },
      },
      stage: 'visuals',
    };

    const bb = ProjectBlackboardStoreBridge.createBlackboardFromProject(mockProject);
    const bbData = bb.getData();

    expect(bbData.projectId).toBe('proj-101');
    expect(bbData.projectName).toBe('万界剑尊');
    expect(bbData.scriptContent).toBe('林晨手握断剑，独立于风雪之中。');
    expect(bbData.characters.length).toBe(1);
    expect(bbData.scenes.length).toBe(1);
    expect(bbData.spatialMemory.assetHitRate).toBe(0.95);
    expect(bbData.cameraDirectingPlans['sc-1'].cameraMotion).toBe('Dolly_In');
    expect(bbData.dagNodes['task-script'].status).toBe('completed');
  });

  it('Should sync Blackboard updates to useProjectStore via reactive bridge', async () => {
    // 1. 初始化项目在 store 中
    const initialProject: ProjectData = {
      id: 'proj-sync-test',
      name: '待同步漫剧',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      script: '',
      characters: [],
      parsedScenes: [],
    };
    useProjectStore.getState().createProject(initialProject);

    const bb = new ProjectBlackboard('初始台词', 'novel_text', '待同步漫剧');

    // 2. 绑定响应式桥接器 (设置 20ms 短防抖以便测试快速验证)
    const unbind = ProjectBlackboardStoreBridge.bind(bb, 'proj-sync-test', useProjectStore, 20);

    // 3. 黑板发生演化推进
    bb.update(
      {
        characters: [{ id: 'char-2', name: '苏雪', role: 'protagonist' } as any],
        stage: 'visuals',
      },
      'agent-actor',
      'ACTOR',
      '生成新角色 苏雪'
    );

    // 等待防抖触发落盘
    await new Promise((resolve) => setTimeout(resolve, 60));

    // 验证 store 中数据已被精准反写
    const storedProject = useProjectStore.getState().projects.find((p) => p.id === 'proj-sync-test');
    expect(storedProject).toBeDefined();
    expect(storedProject?.characters?.length).toBe(1);
    expect(storedProject?.characters?.[0].name).toBe('苏雪');
    expect(storedProject?.stage).toBe('visuals');

    unbind();
  });

  it('Should immediately sync and persist Approval Gate without waiting for debounce', () => {
    const initialProject: ProjectData = {
      id: 'proj-gate-test',
      name: '断点测试漫剧',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      script: '',
    };
    useProjectStore.getState().createProject(initialProject);

    const bb = new ProjectBlackboard('', 'novel_text', '断点测试漫剧');
    const unbind = ProjectBlackboardStoreBridge.bind(bb, 'proj-gate-test', useProjectStore, 500);

    const mockGate: ApprovalGate = {
      id: 'gate-emergency-01',
      taskId: 'task-auditor',
      agentId: 'agent-audit',
      agentName: 'AUDIT',
      title: '质检未达标断点',
      description: '角色特征未锁死，提请总导演裁决',
      type: 'quality_audit',
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    // 提请审批门（关键事件）
    bb.registerApprovalGate(mockGate);

    // 无需等待 500ms，验证立即落盘至 Store
    const storedProject = useProjectStore.getState().projects.find((p) => p.id === 'proj-gate-test');
    expect(storedProject?.activeApprovalGates?.['gate-emergency-01']).toBeDefined();
    expect(storedProject?.activeApprovalGates?.['gate-emergency-01'].status).toBe('pending');

    unbind();
  });

  it('Should support offline reload and allow resolving pending approval gate after recreation', () => {
    // 模拟之前已被保存到持久化存储的项目（包含等待审批中的断点与任务状态）
    const persistedProject: ProjectData = {
      id: 'proj-offline-resume',
      name: '离线恢复项目',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      script: '天穹破碎，异界大门开启。',
      dagNodes: {
        'task-auditor': {
          id: 'task-auditor',
          name: '四维质检',
          agentRole: '审计',
          dependencies: [],
          status: 'awaiting_approval',
        },
      },
      activeApprovalGates: {
        'gate-offline-01': {
          id: 'gate-offline-01',
          taskId: 'task-auditor',
          agentId: 'agent-audit',
          agentName: 'AUDIT',
          title: '离线保存的质检审批',
          description: '等待人工总导演特批放行',
          type: 'quality_audit',
          createdAt: new Date().toISOString(),
          status: 'pending',
        },
      },
      approvalHistory: [],
    };

    useProjectStore.getState().createProject(persistedProject);

    // 页面刷新重载：从持久化数据水合出黑板与调度器
    const bb = ProjectBlackboardStoreBridge.createBlackboardFromProject(persistedProject);
    const scheduler = new DAGScheduler(bb);

    // 绑定桥接器
    const unbind = ProjectBlackboardStoreBridge.bind(bb, 'proj-offline-resume', useProjectStore);

    // 验证待决断点已被正确水合
    expect(bb.getActiveApprovalGate()?.id).toBe('gate-offline-01');
    expect(bb.getData().activeApprovalGates['gate-offline-01'].status).toBe('pending');

    // 人工介入：总导演特批放行
    scheduler.resolveApproval('gate-offline-01', {
      action: 'approve',
      userFeedback: '离线重启后特批放行',
    });

    // 验证审批门已归档至历史
    expect(bb.getActiveApprovalGate()).toBeNull();
    expect(bb.getData().approvalHistory.length).toBe(1);
    expect(bb.getData().approvalHistory[0].status).toBe('approved');
    expect(bb.getData().approvalHistory[0].userFeedback).toBe('离线重启后特批放行');

    // 验证持久化 Store 中也已被同步清空 activeApprovalGates 并写入 approvalHistory
    const updatedStoreProj = useProjectStore.getState().projects.find((p) => p.id === 'proj-offline-resume');
    expect(updatedStoreProj?.activeApprovalGates?.['gate-offline-01']).toBeUndefined();
    expect(updatedStoreProj?.approvalHistory?.length).toBe(1);

    unbind();
  });
});
