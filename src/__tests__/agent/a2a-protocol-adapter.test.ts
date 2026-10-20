/**
 * a2a-protocol-adapter.test.ts — Agent-to-Agent (A2A) Protocol Adapter Test Suite
 */

import {
  a2aProtocolAdapter,
  type A2AMessage,
} from '@/core/services/agent/A2AProtocolAdapter';

describe('A2A (Agent-to-Agent) Protocol Adapter Suite', () => {
  it('Should discover registered agents as A2A descriptors', () => {
    const descriptors = a2aProtocolAdapter.discoverAgents();
    expect(descriptors.length).toBeGreaterThan(0);
    expect(descriptors.some((d) => d.name === 'STORY' || d.role === 'script_ingestion')).toBe(true);
    expect(descriptors[0].protocolVersion).toBe('a2a/1.0');
    expect(descriptors[0].status).toBe('online');
  });

  it('Should format and dispatch outbound A2A messages', async () => {
    let capturedMessage: A2AMessage | null = null;
    const unsubscribe = a2aProtocolAdapter.onMessage((msg) => {
      capturedMessage = msg;
    });

    const msg = await a2aProtocolAdapter.sendA2AMessage(
      'agent-chief',
      { id: 'voko-runtime-agent', name: 'VOKO Runtime Agent', role: 'external_host' },
      'kineo:storyboard_sync',
      { sceneCount: 5 }
    );

    expect(msg.action).toBe('kineo:storyboard_sync');
    expect(msg.protocolVersion).toBe('a2a/1.0');
    expect(msg.recipient.id).toBe('voko-runtime-agent');
    expect(capturedMessage).not.toBeNull();
    expect((capturedMessage as any)?.action).toBe('kineo:storyboard_sync');

    unsubscribe();
  });

  it('Should handle inbound A2A messages and generate protocol acknowledgment', async () => {
    const inboundMessage: A2AMessage = {
      id: 'inbound-msg-001',
      protocolVersion: 'a2a/1.0',
      type: 'command',
      sender: {
        id: 'external-voko-client',
        name: 'VOKO IM Chat',
        role: 'im_client',
      },
      recipient: {
        id: 'agent-chief',
        name: 'CHIEF',
        role: 'director',
      },
      action: 'kineo:request_render_status',
      payload: { projectId: 'test-123' },
      timestamp: Date.now(),
    };

    const ack = await a2aProtocolAdapter.handleIncomingA2AMessage(inboundMessage);

    expect(ack.type).toBe('response');
    expect(ack.action).toBe('kineo:request_render_status:ack');
    expect(ack.recipient.id).toBe('external-voko-client');
    expect(ack.payload.status).toBe('success');
  });

  it('Should manage connection status properly', () => {
    expect(a2aProtocolAdapter.getConnectionStatus()).toBe(false);
    a2aProtocolAdapter.setConnectionStatus(true);
    expect(a2aProtocolAdapter.getConnectionStatus()).toBe(true);
    a2aProtocolAdapter.setConnectionStatus(false);
  });
});
