/**
 * AgentRegistry.ts — 多智能体注册中心与插件扩展管理器
 *
 * 职责：
 * 统一注册管理系统内置 Agent 与 用户自定义 Custom Agent。
 * 提供注册、注销、持久化 (localStorage) 与 按触发阶段过滤 Agent 的方法。
 */

import { BaseAgent } from './BaseAgent';
import { CharacterDesignerAgent } from './CharacterDesignerAgent';
import { CustomUserAgent, type CustomAgentConfig } from './CustomUserAgent';
import { QualityAuditorAgent } from './QualityAuditorAgent';
import { ScriptIngestionAgent } from './ScriptIngestionAgent';
import { SoundEngineerAgent } from './SoundEngineerAgent';
import { StoryboardArtistAgent } from './StoryboardArtistAgent';
import { VideoEditorAgent } from './VideoEditorAgent';

const STORAGE_KEY = 'kineo_custom_agents_registry_v1';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, BaseAgent> = new Map();

  private constructor() {
    this.registerDefaults();
    this.loadCustomAgents();
  }

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /** 注册默认原生 Agent */
  private registerDefaults() {
    this.register(new ScriptIngestionAgent());
    this.register(new CharacterDesignerAgent());
    this.register(new StoryboardArtistAgent());
    this.register(new QualityAuditorAgent());
    this.register(new SoundEngineerAgent());
    this.register(new VideoEditorAgent());
  }

  /** 注册一个 Agent */
  public register(agent: BaseAgent) {
    this.agents.set(agent.metadata.id, agent);
  }

  /** 获取所有已注册 Agent */
  public getAll(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /** 注册新的用户自定义 Agent */
  public registerCustomAgent(config: Omit<CustomAgentConfig, 'id' | 'role' | 'isCustom'>): CustomUserAgent {
    const customAgent = new CustomUserAgent({
      ...config,
      id: `agent-extra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'custom',
      isCustom: true,
      enabled: true,
    });

    this.register(customAgent);
    this.saveCustomAgents();
    return customAgent;
  }

  /** 删除自定义 Agent */
  public removeAgent(id: string): boolean {
    const target = this.agents.get(id);
    if (target && target.metadata.isCustom) {
      this.agents.delete(id);
      this.saveCustomAgents();
      return true;
    }
    return false;
  }

  /** 切换 Agent 启用/禁用状态 */
  public toggleAgentEnabled(id: string, enabled: boolean) {
    const target = this.agents.get(id);
    if (target) {
      target.metadata.enabled = enabled;
      if (target.metadata.isCustom) {
        this.saveCustomAgents();
      }
    }
  }

  /** 持久化用户自定义 Agent 到 localStorage */
  private saveCustomAgents() {
    if (typeof window === 'undefined') return;
    const customConfigs = Array.from(this.agents.values())
      .filter((a) => a.metadata.isCustom)
      .map((a) => (a as CustomUserAgent).config);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(customConfigs));
  }

  /** 从 localStorage 恢复用户自定义 Agent */
  private loadCustomAgents() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const configs: CustomAgentConfig[] = JSON.parse(stored);
        configs.forEach((cfg) => {
          this.register(new CustomUserAgent(cfg));
        });
      }
    } catch (e) {
      console.warn('Failed to load custom agents from localStorage:', e);
    }
  }
}

export const agentRegistry = AgentRegistry.getInstance();
