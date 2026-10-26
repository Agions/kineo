/**
 * human-in-the-loop.test.ts — 人机共创审批断点机制 (Human-in-the-Loop & Approval Gates) 测试套件
 */

import { ProjectBlackboard, ApprovalGate } from '@/core/services/agent/ProjectBlackboard';
import { DAGScheduler } from '@/core/services/agent/DAGScheduler';
import { BaseAgent, AgentMetadata } from '@/core/services/agent/BaseAgent';
import { QualityAuditorAgent } from '@/core/services/agent/QualityAuditorAgent';

class MockSuspendingAgent extends BaseAgent {
  constructor(private gateToTrigger: ApprovalGate) {
    const meta: AgentMetadata = {
      id: 'agent-mock',
      name: 'MOCKA',
      role: 'custom',
      description: 'Mock Suspending Agent',
      triggerPhase: 'on_custom_event',
      readKeys: ['dagNodes'],
      writeKeys: ['dagNodes'],
    };
    super(meta);
  }

  public async execute(blackboard: ProjectBlackboard): Promise<void> {
    const scheduler = blackboard.getScheduler();
    if (scheduler) {
      await scheduler.waitForApproval(this.gateToTrigger);
    }
  }
}

describe('Human-in-the-Loop (HITL) & Approval Gates Suite', () => {
  describe('ProjectBlackboard Gate Management', () => {
    it('Should register, retrieve, and resolve approval gates on blackboard', () => {
      const bb = new ProjectBlackboard();
      const mockGate: ApprovalGate = {
        id: 'gate-test-001',
        taskId: 'task-test',
        agentId: 'agent-audit',
        agentName: 'AUDIT',
        title: '分镜出图审批',
        description: '请总导演确认分镜风格',
        type: 'storyboard_approval',
        createdAt: new Date().toISOString(),
        status: 'pending',
        suggestedActions: [
          { id: 'approve', label: '确认放行' },
          { id: 'reject', label: '打回修改' },
        ],
      };

      bb.registerApprovalGate(mockGate);

      const active = bb.getActiveApprovalGate();
      expect(active).toBeDefined();
      expect(active?.id).toBe('gate-test-001');
      expect(active?.status).toBe('pending');
      expect(bb.getData().activeApprovalGates['gate-test-001']).toBeDefined();

      // 模拟审批决策
      bb.resolveApprovalGate('gate-test-001', {
        status: 'approved',
        userFeedback: '总导演已核准视觉基调',
      });

      expect(bb.getActiveApprovalGate()).toBeNull();
      const history = bb.getData().approvalHistory;
      expect(history.length).toBe(1);
      expect(history[0].id).toBe('gate-test-001');
      expect(history[0].status).toBe('approved');
      expect(history[0].userFeedback).toBe('总导演已核准视觉基调');
    });

    it('Should correctly bind and unbind DAGScheduler reference to blackboard', () => {
      const bb = new ProjectBlackboard();
      const scheduler = new DAGScheduler(bb);

      expect(bb.getScheduler()).toBe(scheduler);
      bb.setScheduler(undefined);
      expect(bb.getScheduler()).toBeUndefined();
    });
  });

  describe('DAGScheduler Asynchronous Suspension and Resume', () => {
    it('Should suspend task node into awaiting_approval state and unblock on resolveApproval', async () => {
      const bb = new ProjectBlackboard();
      const scheduler = new DAGScheduler(bb);

      const gate: ApprovalGate = {
        id: 'gate-pause-123',
        taskId: 'task-pause-node',
        agentId: 'agent-mock',
        agentName: 'MOCKA',
        title: '测试断点挂起',
        description: '等待人工干预',
        type: 'character_approval',
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      const mockAgent = new MockSuspendingAgent(gate);

      scheduler.registerTask({
        id: 'task-pause-node',
        name: '断点测试节点',
        agentRole: '测试角色',
        dependencies: [],
        agentInstance: mockAgent,
      });

      scheduler.initializeGraph();

      // 启动调度执行 (非阻塞等待)
      const executePromise = scheduler.executeGraph();

      // 稍等微任务周期，让调度器推进到断点
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 验证节点已被挂起为 awaiting_approval
      const nodeStatus = bb.getData().dagNodes['task-pause-node']?.status;
      expect(nodeStatus).toBe('awaiting_approval');
      expect(scheduler.hasPendingApprovals()).toBe(true);
      expect(scheduler.getPendingGateIds()).toContain('gate-pause-123');

      // 验证审批门处于 pending 状态
      const activeGate = bb.getActiveApprovalGate();
      expect(activeGate).toBeDefined();
      expect(activeGate?.id).toBe('gate-pause-123');

      // 人工介入：裁决通过放行
      scheduler.resolveApproval('gate-pause-123', {
        action: 'approve',
        userFeedback: '通过放行',
      });

      // 等待调度完全执行完毕
      await executePromise;

      expect(bb.getData().dagNodes['task-pause-node']?.status).toBe('completed');
      expect(bb.getActiveApprovalGate()).toBeNull();
      expect(bb.getData().approvalHistory[0].status).toBe('approved');
      expect(scheduler.hasPendingApprovals()).toBe(false);
    });
  });

  describe('QualityAuditorAgent HITL Approval Integration', () => {
    it('Should trigger approval gate on failing score and allow human override', async () => {
      const bb = new ProjectBlackboard();
      const scheduler = new DAGScheduler(bb);

      // 设置不满足高质检要求的数据 (无角色参考图、场景无 prompt、无运镜)
      bb.update(
        {
          dagNodes: {
            'task-auditor': {
              id: 'task-auditor',
              name: '四维质量审计',
              agentRole: '审计总监',
              dependencies: [],
              status: 'running',
            },
          },
          characters: [
            {
              id: 'char-1',
              name: '神秘人物',
              role: 'protagonist',
              gender: 'other',
              personality: '',
              appearance: '',
              referenceImage: undefined, // 扣分项
            },
          ],
          scenes: [
            {
              id: 'scene-1',
              title: '空场景',
              content: '', // 扣分项
              cameraMovement: '', // 扣分项
              lighting: '', // 扣分项
              dialogues: [],
            },
          ],
        },
        'test',
        'TestInit'
      );

      const auditor = new QualityAuditorAgent();

      // 启动审计任务
      let auditPromiseDone = false;
      const auditPromise = auditor.execute(bb).then(() => {
        auditPromiseDone = true;
      });

      // 允许审计执行到达断点
      await new Promise((resolve) => setTimeout(resolve, 50));

      const gate = bb.getActiveApprovalGate();
      expect(gate).toBeDefined();
      expect(gate?.type).toBe('quality_audit');
      expect(gate?.title).toContain('四维质检审计未达标');
      expect(auditPromiseDone).toBe(false);

      // 人类总导演签署特批令 (Override Approve)
      scheduler.resolveApproval(gate!.id, {
        action: 'approve',
        userFeedback: '艺术风格特殊，总导演特批放行',
      });

      await auditPromise;
      expect(auditPromiseDone).toBe(true);

      const data = bb.getData();
      expect(data.currentReflection).toBeNull(); // 特批后 reflection 应当被设为 null
      expect(data.approvalHistory.length).toBe(1);
      expect(data.approvalHistory[0].status).toBe('approved');
      expect(data.auditReports.length).toBe(1);
      expect(data.auditReports[0].passed).toBe(true);
    });

    it('Should respect human rejection and enter healing reflection loop', async () => {
      const bb = new ProjectBlackboard();
      const scheduler = new DAGScheduler(bb);

      // 构造扣分数据
      bb.update(
        {
          dagNodes: {
            'task-auditor': {
              id: 'task-auditor',
              name: '四维质量审计',
              agentRole: '审计总监',
              dependencies: [],
              status: 'running',
            },
          },
          characters: [
            {
              id: 'char-1',
              name: '无脸男',
              role: 'supporting',
              gender: 'other',
              personality: '',
              appearance: '',
              referenceImage: undefined,
            },
          ],
          scenes: [
            {
              id: 'scene-1',
              title: '无镜头场景',
              content: '',
              dialogues: [],
            },
          ],
        },
        'test',
        'TestInit'
      );

      const auditor = new QualityAuditorAgent();

      let auditPromiseDone = false;
      const auditPromise = auditor.execute(bb).then(() => {
        auditPromiseDone = true;
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const gate = bb.getActiveApprovalGate();
      expect(gate).toBeDefined();

      // 人类总导演裁决打回自愈
      scheduler.resolveApproval(gate!.id, {
        action: 'reject',
        userFeedback: '人物缺少面部特写与关键光效，请根据反思建议重绘',
      });

      await auditPromise;
      expect(auditPromiseDone).toBe(true);

      const data = bb.getData();
      // 打回自愈时 reflection 存在
      expect(data.currentReflection).toBeDefined();
      expect(data.currentReflection?.retryCount).toBe(1);
      expect(data.approvalHistory[0].status).toBe('rejected');
      expect(data.auditReports[0].passed).toBe(false);
    });
  });
});
