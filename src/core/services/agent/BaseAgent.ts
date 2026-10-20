/**
 * BaseAgent.ts — 多智能体 (Multi-Agent) 抽象基类与接口定义
 */

import type { ProjectBlackboard, BlackboardData } from './ProjectBlackboard';

export type AgentRoleType =
  | 'director'
  | 'script_ingestion'
  | 'character_designer'
  | 'storyboard_artist'
  | 'sound_engineer'
  | 'video_editor'
  | 'quality_auditor'
  | 'custom';

export type TriggerPhase =
  | 'on_input_submitted'
  | 'on_script_parsed'
  | 'on_character_anchored'
  | 'on_storyboard_generated'
  | 'on_quality_audited'
  | 'on_audio_synthesized'
  | 'on_custom_event';

export interface AgentMetadata {
  id: string;
  name: string;
  role: AgentRoleType;
  avatar?: string;
  description: string;
  systemPrompt?: string;
  triggerPhase: TriggerPhase;
  readKeys: Array<keyof BlackboardData>;
  writeKeys: Array<keyof BlackboardData>;
  isCustom?: boolean;
  enabled?: boolean;
}

export abstract class BaseAgent {
  public metadata: AgentMetadata;

  constructor(metadata: AgentMetadata) {
    this.metadata = {
      enabled: true,
      isCustom: false,
      ...metadata,
    };
  }

  public abstract execute(blackboard: ProjectBlackboard): Promise<void>;

  protected log(blackboard: ProjectBlackboard, action: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    blackboard.addLog({
      agentId: this.metadata.id,
      agentName: this.metadata.name,
      action,
      level,
    });
  }
}
