/**
 * A2AProtocolAdapter.ts — 原生 Agent-to-Agent (A2A) 跨平台智能体通信协议适配器
 *
 * 规范参考：
 * 支持 A2A 开放协议，打破不同 AI 智能体框架之间的孤岛，
 * 允许外部 Agent 运行时（如 VOKO、OpenClaw、AstrBot 等生态）与 Kineo 智能体无缝即时互通。
 */

import { logger } from '@/core/utils/logger';

import { agentRegistry } from './AgentRegistry';

export type A2AMessageType = 'handshake' | 'query' | 'command' | 'event' | 'response';

export interface A2AAgentInfo {
  id: string;
  name: string;
  role: string;
  endpoint?: string;
}

export interface A2AMessage<T = any> {
  id: string;
  protocolVersion: 'a2a/1.0';
  type: A2AMessageType;
  sender: A2AAgentInfo;
  recipient: A2AAgentInfo;
  action: string;
  payload: T;
  timestamp: number;
  traceId?: string;
}

export interface A2AAgentDescriptor {
  id: string;
  name: string;
  role: string;
  description: string;
  capabilities: string[];
  protocolVersion: 'a2a/1.0';
  status: 'online' | 'busy' | 'offline';
}

export class A2AProtocolAdapter {
  private static instance: A2AProtocolAdapter;
  private messageListeners: Array<(message: A2AMessage) => void> = [];
  private isConnected = false;

  private constructor() {}

  public static getInstance(): A2AProtocolAdapter {
    if (!A2AProtocolAdapter.instance) {
      A2AProtocolAdapter.instance = new A2AProtocolAdapter();
    }
    return A2AProtocolAdapter.instance;
  }

  /**
   * 发现与导出 Kineo 本地运行时的所有 A2A 智能体描述符 (A2A Agent Discovery)
   */
  public discoverAgents(): A2AAgentDescriptor[] {
    const agents = agentRegistry.getAll();
    return agents.map((agent) => ({
      id: agent.metadata.id,
      name: agent.metadata.name,
      role: agent.metadata.role,
      description: agent.metadata.description,
      capabilities: [
        `stage:${agent.metadata.triggerPhase}`,
        ...agent.metadata.readKeys.map((k) => `read:${k}`),
        ...agent.metadata.writeKeys.map((k) => `write:${k}`),
      ],
      protocolVersion: 'a2a/1.0',
      status: 'online',
    }));
  }

  /**
   * 发送 A2A 消息至外部智能体运行时 (Outbound A2A Dispatch)
   */
  public async sendA2AMessage<T = any>(
    senderId: string,
    recipient: A2AAgentInfo,
    action: string,
    payload: T,
    type: A2AMessageType = 'command'
  ): Promise<A2AMessage<T>> {
    const senderAgent = agentRegistry.getAll().find((a) => a.metadata.id === senderId);
    const message: A2AMessage<T> = {
      id: `a2a-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      protocolVersion: 'a2a/1.0',
      type,
      sender: {
        id: senderId,
        name: senderAgent?.metadata.name || 'KineoDirector',
        role: senderAgent?.metadata.role || 'director',
      },
      recipient,
      action,
      payload,
      timestamp: Date.now(),
      traceId: `trace-${Date.now()}`,
    };

    logger.info(`[A2A Protocol] 发送 A2A 消息: ${action} -> ${recipient.name || recipient.id}`);
    // 广播至监听器
    this.notifyListeners(message);
    return message;
  }

  /**
   * 接收来自外部 Agent (如 VOKO/OpenClaw 等) 的 A2A 消息并分发 (Inbound A2A Ingestion)
   */
  public async handleIncomingA2AMessage(message: A2AMessage): Promise<A2AMessage> {
    logger.info(`[A2A Protocol] 接收到来自 ${message.sender.name} 的 A2A 消息 [${message.action}]`);

    if (message.protocolVersion !== 'a2a/1.0') {
      logger.warn(`[A2A Protocol] 协议版本不匹配: ${message.protocolVersion}`);
    }

    this.notifyListeners(message);

    // 默认回执响应
    const responseMessage: A2AMessage = {
      id: `a2a-resp-${Date.now()}`,
      protocolVersion: 'a2a/1.0',
      type: 'response',
      sender: {
        id: 'agent-chief',
        name: 'CHIEF',
        role: 'director',
      },
      recipient: message.sender,
      action: `${message.action}:ack`,
      payload: {
        status: 'success',
        processedAt: Date.now(),
        echoAction: message.action,
      },
      timestamp: Date.now(),
      traceId: message.traceId,
    };

    return responseMessage;
  }

  /**
   * 订阅 A2A 通信总线消息
   */
  public onMessage(listener: (message: A2AMessage) => void): () => void {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(message: A2AMessage) {
    this.messageListeners.forEach((listener) => {
      try {
        listener(message);
      } catch (err: any) {
        logger.error(`[A2A Protocol] 监听器处理消息出错: ${err?.message}`);
      }
    });
  }

  public setConnectionStatus(connected: boolean): void {
    this.isConnected = connected;
    logger.info(`[A2A Protocol] 连接状态变更为: ${connected ? '已连接' : '已断开'}`);
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const a2aProtocolAdapter = A2AProtocolAdapter.getInstance();
