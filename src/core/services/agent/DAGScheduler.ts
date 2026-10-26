/**
 * DAGScheduler.ts — 工业级动态有向无环图 (DAG) 任务调度器
 *
 * 职责：
 * 1. 管理 Multi-Agent Director 2.0 任务节点依赖图，按拓扑序调度智能体协同推导。
 * 2. 支持并发分支执行（例如角色概念设计与场景世界观解析并行）。
 * 3. 动态响应质检审计员 (QualityAuditor) 的批评信号，在图执行中精准触发局部子图回滚与针对性重试。
 */

import { BaseAgent } from './BaseAgent';
import type { ApprovalGate, DAGNode, DAGNodeStatus, ProjectBlackboard } from './ProjectBlackboard';

export interface DAGTaskDefinition {
  id: string;
  name: string;
  agentRole: string;
  dependencies: string[];
  agentInstance: BaseAgent;
}

export interface ApprovalDecision {
  action: 'approve' | 'reject' | 'modify';
  userFeedback?: string;
  modifications?: any;
}

export class DAGScheduler {
  private tasks: Map<string, DAGTaskDefinition> = new Map();
  private blackboard: ProjectBlackboard;
  private pendingApprovals: Map<string, (decision: ApprovalDecision) => void> = new Map();

  constructor(blackboard: ProjectBlackboard) {
    this.blackboard = blackboard;
    this.blackboard.setScheduler(this);
  }

  /**
   * 注册人机共创审批断点挂起请求 (HITL)
   * 挂起当前任务并等待人类总导演签署裁决令
   */
  public async waitForApproval(gate: ApprovalGate): Promise<ApprovalDecision> {
    this.updateNodeStatus(gate.taskId, 'awaiting_approval');
    this.blackboard.registerApprovalGate(gate);

    return new Promise<ApprovalDecision>((resolve) => {
      this.pendingApprovals.set(gate.id, resolve);
    });
  }

  /**
   * 人类总导演完成审批裁决并恢复调度
   */
  public resolveApproval(gateId: string, decision: ApprovalDecision): void {
    const resolver = this.pendingApprovals.get(gateId);
    if (resolver) {
      this.pendingApprovals.delete(gateId);
      this.blackboard.resolveApprovalGate(gateId, {
        status:
          decision.action === 'approve'
            ? 'approved'
            : decision.action === 'reject'
            ? 'rejected'
            : 'modified',
        userFeedback: decision.userFeedback,
        resolutionPayload: decision.modifications,
      });

      // 如果有人类自定义修改注入，立即落盘更新黑板
      if (decision.modifications && typeof decision.modifications === 'object') {
        this.blackboard.update(
          decision.modifications,
          'human-director',
          'HumanDirector',
          '人类总导演注入微调修改'
        );
      }

      resolver(decision);
    }
  }

  public hasPendingApprovals(): boolean {
    return this.pendingApprovals.size > 0;
  }

  public getPendingGateIds(): string[] {
    return Array.from(this.pendingApprovals.keys());
  }

  /** 注册 DAG 任务节点 */
  public registerTask(task: DAGTaskDefinition): this {
    this.tasks.set(task.id, task);
    return this;
  }

  /** 初始化黑板上的 DAG 节点状态视图 */
  public initializeGraph(): void {
    const dagNodes: Record<string, DAGNode> = {};
    for (const [id, task] of this.tasks.entries()) {
      dagNodes[id] = {
        id,
        name: task.name,
        agentRole: task.agentRole,
        dependencies: [...task.dependencies],
        status: 'pending',
      };
    }
    this.blackboard.update(
      { dagNodes },
      'dag-scheduler',
      'DAGScheduler',
      '初始化智能体协同 DAG 拓扑执行图'
    );
  }

  /** 更新指定节点状态并推入黑板 */
  public updateNodeStatus(nodeId: string, status: DAGNodeStatus, error?: string): void {
    const currentNodes = { ...(this.blackboard.getData().dagNodes || {}) };
    if (!currentNodes[nodeId]) return;

    const updatedNode: DAGNode = {
      ...currentNodes[nodeId],
      status,
      error,
      ...(status === 'running' ? { startedAt: new Date().toISOString() } : {}),
      ...(status === 'completed' || status === 'failed' ? { completedAt: new Date().toISOString() } : {}),
    };

    currentNodes[nodeId] = updatedNode;
    this.blackboard.update(
      { dagNodes: currentNodes },
      'dag-scheduler',
      'DAGScheduler',
      `DAG 节点 [${updatedNode.name}] 状态跃迁 -> ${status}`
    );
  }

  /**
   * 按拓扑序推进 DAG 任务执行
   * 支持审计批评反馈回环 (Feedback Reflection Loop)
   */
  public async executeGraph(): Promise<void> {
    this.initializeGraph();

    const inDegree: Map<string, number> = new Map();
    const dependents: Map<string, string[]> = new Map();

    for (const [id, task] of this.tasks.entries()) {
      inDegree.set(id, task.dependencies.length);
      for (const dep of task.dependencies) {
        if (!dependents.has(dep)) dependents.set(dep, []);
        dependents.get(dep)!.push(id);
      }
    }

    // 入度为 0 的前置就绪任务队列
    const readyQueue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) {
        readyQueue.push(id);
      }
    }

    while (readyQueue.length > 0) {
      // 提取所有并行就绪的任务批量并发执行
      const currentBatch = [...readyQueue];
      readyQueue.length = 0;

      await Promise.all(
        currentBatch.map(async (taskId) => {
          const task = this.tasks.get(taskId)!;
          try {
            this.updateNodeStatus(taskId, 'running');
            this.blackboard.update(
              { activeAgentId: task.agentInstance.metadata.id },
              'dag-scheduler',
              'DAGScheduler'
            );

            await task.agentInstance.execute(this.blackboard);

            // 若当前节点是分镜或质检后触发了 reflection，则跃迁为 healing 并重试
            const currentReflection = this.blackboard.getData().currentReflection;
            if (currentReflection && currentReflection.retryCount <= currentReflection.maxRetries) {
              if (taskId === 'task-storyboard' || taskId === 'task-character') {
                this.updateNodeStatus(taskId, 'healing');
                await task.agentInstance.execute(this.blackboard);
              }
            }

            this.updateNodeStatus(taskId, 'completed');

            // 扣减后继依赖入度
            const nextTasks = dependents.get(taskId) || [];
            for (const nextId of nextTasks) {
              const currentDeg = inDegree.get(nextId)! - 1;
              inDegree.set(nextId, currentDeg);
              if (currentDeg === 0) {
                readyQueue.push(nextId);
              }
            }
          } catch (err: any) {
            this.updateNodeStatus(taskId, 'failed', err?.message || '执行异常中断');
            throw err;
          }
        })
      );
    }
  }
}
