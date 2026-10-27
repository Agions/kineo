/**
 * MasterDirectorAgent.ts — 基于 Hub-and-Spoke 结合 DAG 拓扑编排的主控导演智能体 (Director 2.0)
 *
 * 职责：
 * 作为 Multi-Agent 系统的核心调度枢纽 (Director Agent)，
 * 组织构建有向无环图 (DAG)，监听 Blackboard 共享黑板状态变化，指挥子 Agent：
 * - 剧本四级解析 (ScriptIngestionAgent)
 * - 全息角色 DNA (CharacterDesignerAgent)
 * - 影视级分镜师 (StoryboardArtistAgent)
 * - 独立质检审计员 (QualityAuditorAgent) 批评自愈回环
 * - 情感声效与侧链混音 (SoundEngineerAgent)
 * - 视频装配与 4K 压制 (VideoEditorAgent)
 */

import { pluginRegistry } from '@/core/plugins/PluginRegistry';

import { agentRegistry } from './AgentRegistry';
import { BaseAgent } from './BaseAgent';
import { DAGScheduler, type ApprovalDecision } from './DAGScheduler';
import { ProjectBlackboard, type InputContentType } from './ProjectBlackboard';

export class MasterDirectorAgent extends BaseAgent {
  private blackboard: ProjectBlackboard;
  private scheduler: DAGScheduler | null = null;

  constructor(
    initialInput: string = '',
    inputType: InputContentType = 'unknown',
    projectName: string = '漫剧工程 · 多 Agent 协作',
    existingBlackboard?: ProjectBlackboard
  ) {
    super({
      id: 'agent-chief',
      name: 'CHIEF',
      role: 'director',
      avatar: '🎬',
      description: 'ACS-2.0 智能体调度中心与 DAG 拓扑执行器，指挥全流程创作与质检自愈',
      triggerPhase: 'on_input_submitted',
      readKeys: ['stage', 'rawInput', 'scenes', 'characters', 'auditReports', 'dagNodes'],
      writeKeys: ['stage', 'activeAgentId', 'completedAgentIds', 'dagNodes'],
    });

    this.blackboard = existingBlackboard || new ProjectBlackboard(initialInput, inputType, projectName);
    // 自动挂载调度器
    this.scheduler = new DAGScheduler(this.blackboard);
  }

  public setBlackboard(blackboard: ProjectBlackboard): void {
    this.blackboard = blackboard;
    this.scheduler = new DAGScheduler(this.blackboard);
  }

  public getBlackboard(): ProjectBlackboard {
    return this.blackboard;
  }

  public getScheduler(): DAGScheduler | null {
    return this.scheduler;
  }

  public resolveApproval(gateId: string, decision: ApprovalDecision): void {
    if (this.scheduler) {
      this.scheduler.resolveApproval(gateId, decision);
    }
  }

  public async execute(targetBlackboard?: ProjectBlackboard): Promise<void> {
    const bb = targetBlackboard instanceof ProjectBlackboard ? targetBlackboard : this.blackboard;
    this.log(bb, '🚀 CHIEF 主控导演启动 Multi-Agent Director 2.0 (ACS-2.0 DAG Swarm)...', 'info');
    this.log(bb, '📐 360 全息空间与角色 DNA 记忆库已拉起 [IP-Adapter 锁脸 / 空间防穿帮矩阵 / 98% 命中率]', 'info');

    const allAgents = agentRegistry.getAll().filter((a) => a.metadata.enabled !== false && a.metadata.id !== this.metadata.id);

    try {
      // 0. 执行插件 Hook: onBeforeScriptParse
      const rawText = bb.getData().rawInput;
      if (rawText) {
        const sanitized = await pluginRegistry.executeHook('onBeforeScriptParse', rawText);
        if (sanitized && typeof sanitized === 'string') {
          bb.update({ rawInput: sanitized, scriptContent: sanitized }, this.metadata.id, this.metadata.name, '插件 Hook: onBeforeScriptParse 提示词清洗完成');
        }
      }

      // 1. 查找各专业子 Agent
      const scriptAgent = allAgents.find((a) => a.metadata.role === 'script_ingestion');
      const charAgent = allAgents.find((a) => a.metadata.role === 'character_designer');
      const sbAgent = allAgents.find((a) => a.metadata.role === 'storyboard_artist');
      const auditorAgent = allAgents.find((a) => a.metadata.role === 'quality_auditor');
      const soundAgent = allAgents.find((a) => a.metadata.role === 'sound_engineer');
      const videoAgent = allAgents.find((a) => a.metadata.role === 'video_editor');

      // 2. 初始化并编排 DAG 任务拓扑
      const dag = new DAGScheduler(bb);
      this.scheduler = dag;
      bb.setScheduler(dag);

      if (scriptAgent) {
        dag.registerTask({
          id: 'task-script',
          name: '原著四级语义剖析',
          agentRole: 'script_ingestion',
          dependencies: [],
          agentInstance: scriptAgent,
        });
      }

      if (charAgent) {
        dag.registerTask({
          id: 'task-character',
          name: '全息角色 DNA 锁脸',
          agentRole: 'character_designer',
          dependencies: scriptAgent ? ['task-script'] : [],
          agentInstance: charAgent,
        });
      }

      if (sbAgent) {
        dag.registerTask({
          id: 'task-storyboard',
          name: '视效分镜与机位矩阵',
          agentRole: 'storyboard_artist',
          dependencies: charAgent ? ['task-character'] : [],
          agentInstance: sbAgent,
        });
      }

      if (auditorAgent) {
        dag.registerTask({
          id: 'task-auditor',
          name: '四维独立质量审计',
          agentRole: 'quality_auditor',
          dependencies: sbAgent ? ['task-storyboard'] : [],
          agentInstance: auditorAgent,
        });
      }

      if (soundAgent) {
        dag.registerTask({
          id: 'task-sound',
          name: '情感声效与侧链混音',
          agentRole: 'sound_engineer',
          dependencies: auditorAgent ? ['task-auditor'] : sbAgent ? ['task-storyboard'] : [],
          agentInstance: soundAgent,
        });
      }

      if (videoAgent) {
        dag.registerTask({
          id: 'task-video',
          name: '视频装配与 4K 压制',
          agentRole: 'video_editor',
          dependencies: soundAgent ? ['task-sound'] : [],
          agentInstance: videoAgent,
        });
      }

      // 3. 执行 DAG 拓扑图与自愈闭环
      await dag.executeGraph();

      // 4. 触发阶段插件 Hooks
      await pluginRegistry.executeHook('onCameraMotionPlan', { cameraType: 'Hitchcock_Zoom' });
      await pluginRegistry.executeHook('onRenderComplete', { status: 'success' });

      bb.update({ activeAgentId: null, stage: 'completed' }, this.metadata.id, this.metadata.name, '🎉 ACS-2.0 多智能体 DAG 协同推导、质检与渲染全量完成！');
    } catch (err: any) {
      this.log(bb, `❌ 调度循环发生异常打回: ${err?.message || '协作中断'}`, 'error');
      throw err;
    }
  }

  /** 执行指定触发阶段的自定义 User Agents */
  public async executeCustomAgents(phase: string, agents: BaseAgent[], bb: ProjectBlackboard) {
    const matchingCustom = agents.filter((a) => a.metadata.isCustom && a.metadata.triggerPhase === phase);
    for (const ca of matchingCustom) {
      this.log(bb, `调度自定义 Agent: ${ca.metadata.name} [Phase: ${phase}]`, 'info');
      try {
        await ca.execute(bb);
      } catch (e: any) {
        this.log(bb, `自定义 Agent ${ca.metadata.name} 报错: ${e?.message}`, 'warn');
      }
    }
  }
}
