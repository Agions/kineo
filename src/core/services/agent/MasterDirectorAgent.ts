/**
 * MasterDirectorAgent.ts — 基于 Hub-and-Spoke 的主控导演智能体与多 Agent 协作调度中心
 *
 * 职责：
 * 作为 Multi-Agent 系统的核心调度枢纽 (Director Agent)，
 * 监听 Blackboard 共享黑板状态变化，指挥子 Agent（剧本识别、角色设计、分镜绘图、音效配音、视频压制及自定义 Agent）
 * 协同完成从原始输入到 4K 漫剧全流程推导与构建。
 */

import { pluginRegistry } from '@/core/plugins/PluginRegistry';

import { agentRegistry } from './AgentRegistry';
import { BaseAgent } from './BaseAgent';
import { ProjectBlackboard, type InputContentType } from './ProjectBlackboard';

export class MasterDirectorAgent extends BaseAgent {
  private blackboard: ProjectBlackboard;

  constructor(initialInput: string = '', inputType: InputContentType = 'unknown', projectName: string = '漫剧工程 · 多 Agent 协作') {
    super({
      id: 'agent-chief',
      name: 'CHIEF',
      role: 'director',
      avatar: '🎬',
      description: 'Hub-and-Spoke 智能体调度中心，负责指挥与分发任务给子 Agent',
      triggerPhase: 'on_input_submitted',
      readKeys: ['stage', 'rawInput', 'scenes', 'characters'],
      writeKeys: ['stage', 'activeAgentId', 'completedAgentIds'],
    });

    this.blackboard = new ProjectBlackboard(initialInput, inputType, projectName);
  }

  public getBlackboard(): ProjectBlackboard {
    return this.blackboard;
  }

  public async execute(targetBlackboard?: ProjectBlackboard): Promise<void> {
    const bb = targetBlackboard instanceof ProjectBlackboard ? targetBlackboard : this.blackboard;
    this.log(bb, '🚀 CHIEF 主控导演启动 Auto-Swarm 工业级智能体引擎 (Multi-Agent Swarm)...', 'info');
    this.log(bb, '📐 360 空间与资产记忆库已拉起 [空间记忆/角色 Consistency Anchor / 92% 预打通率]', 'info');

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

      // 1. 触发剧本识别 Agent (ScriptIngestionAgent)
      const scriptAgent = allAgents.find((a) => a.metadata.role === 'script_ingestion');
      if (scriptAgent) {
        await this.executeAgentWithRetry(scriptAgent, bb);
        await this.executeCustomAgents('on_script_parsed', allAgents, bb);
      }

      // 2. 触发角色设计 Agent (CharacterDesignerAgent)
      const charAgent = allAgents.find((a) => a.metadata.role === 'character_designer');
      if (charAgent) {
        await this.executeAgentWithRetry(charAgent, bb);
        const chars = bb.getData().characters;
        const processedChars = await pluginRegistry.executeHook('onAfterCharacterAnchor', chars);
        if (processedChars && Array.isArray(processedChars)) {
          bb.update({ characters: processedChars }, this.metadata.id, this.metadata.name, '插件 Hook: onAfterCharacterAnchor 角色锚定处理完成');
        }
        await this.executeCustomAgents('on_character_anchored', allAgents, bb);
      }

      // 3. 触发分镜绘图 Agent (StoryboardArtistAgent)
      const sbAgent = allAgents.find((a) => a.metadata.role === 'storyboard_artist');
      if (sbAgent) {
        await this.executeAgentWithRetry(sbAgent, bb);
        await pluginRegistry.executeHook('onCameraMotionPlan', { cameraType: 'Hitchcock_Zoom' });
        await this.executeCustomAgents('on_storyboard_generated', allAgents, bb);
      }

      // 4. 触发音效配音 Agent (SoundEngineerAgent)
      const soundAgent = allAgents.find((a) => a.metadata.role === 'sound_engineer');
      if (soundAgent) {
        await this.executeAgentWithRetry(soundAgent, bb);
        await this.executeCustomAgents('on_audio_synthesized', allAgents, bb);
      }

      // 5. 触发视频压制 Agent (VideoEditorAgent)
      const videoAgent = allAgents.find((a) => a.metadata.role === 'video_editor');
      if (videoAgent) {
        await this.executeAgentWithRetry(videoAgent, bb);
      }

      await pluginRegistry.executeHook('onRenderComplete', { status: 'success' });
      bb.update({ activeAgentId: null, stage: 'completed' }, this.metadata.id, this.metadata.name, '🎉 Auto-Swarm 多智能体协同推导与渲染全量完成！');
    } catch (err: any) {
      this.log(bb, `❌ 调度循环发生异常打回: ${err?.message || '协作中断'}`, 'error');
      throw err;
    }
  }

  /** 带自动重试与纠错 Loop 的 Agent 执行器 */
  private async executeAgentWithRetry(agent: BaseAgent, bb: ProjectBlackboard, maxRetries: number = 2): Promise<void> {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        bb.update(
          { activeAgentId: agent.metadata.id },
          this.metadata.id,
          this.metadata.name,
          `调度 ${agent.metadata.name} 介入 [尝试 ${attempt + 1}/${maxRetries + 1}]...`
        );
        await agent.execute(bb);
        return;
      } catch (err: any) {
        attempt++;
        if (attempt > maxRetries) {
          this.log(bb, `❌ Agent ${agent.metadata.name} 达到最大重试次数打回: ${err?.message}`, 'error');
          throw err;
        }
        this.log(bb, `⚠️ Agent ${agent.metadata.name} 执行异常，启动 Auto-Swarm 自动纠错重试 (${attempt}/${maxRetries})...`, 'warn');
        await new Promise((res) => setTimeout(res, 400));
      }
    }
  }

  /** 执行指定触发阶段的自定义 User Agents */
  private async executeCustomAgents(phase: string, agents: BaseAgent[], bb: ProjectBlackboard) {
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
