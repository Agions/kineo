/**
 * multi-agent-orchestration.test.ts — Multi-Agent Director 2.0 (ACS-2.0) 集成测试套件
 */

import { agentRegistry } from '@/core/services/agent/AgentRegistry';
import { HierarchicalScriptParser } from '@/core/services/agent/HierarchicalScriptParser';
import { MasterDirectorAgent } from '@/core/services/agent/MasterDirectorAgent';

describe('Multi-Agent Director 2.0 (ACS-2.0) Architecture Suite', () => {
  it('Should ensure all native agents have 5-letter uppercase names', () => {
    const allAgents = agentRegistry.getAll().filter((a) => !a.metadata.isCustom);
    const names = allAgents.map((a) => a.metadata.name);

    // 校验每个原生 Agent 名称为严格 5 个英文字母的大写单词
    names.forEach((name) => {
      expect(name).toMatch(/^[A-Z]{5}$/);
    });

    expect(names).toEqual(
      expect.arrayContaining(['STORY', 'ACTOR', 'FRAME', 'AUDIT', 'AUDIO', 'VIDEO'])
    );
  });

  it('Should execute Hierarchical 4-Pass Script Ingestion correctly', async () => {
    const novelText = `【第一章：天道降临】
林晨手握破天剑，剑锋上流转着微蓝色的灵力光焰。
苏雪：“林晨，护宗大阵即将破碎，不要硬撑了！”
林晨眼神凌厉，嘴角泛起一抹冷意：“区区天劫，何足挂齿！”`;

    const parsed = await HierarchicalScriptParser.parse(novelText);

    expect(parsed.worldview.style).toContain('国漫玄幻古风');
    expect(parsed.characters.length).toBeGreaterThan(0);
    expect(parsed.scenes.length).toBeGreaterThan(0);
    expect(Object.keys(parsed.shotVectors).length).toBe(parsed.scenes.length);

    const firstVector = Object.values(parsed.shotVectors)[0];
    expect(firstVector.visualPrompt).toContain('anime cinematic masterpiece');
    expect(firstVector.cameraMotion).toBeDefined();
  });

  it('Should successfully execute full Multi-Agent Director 2.0 DAG Swarm pipeline', async () => {
    const novelText = `【第一章：黑客归来】
林修站在天道大厦的楼顶，机械手臂上冰冷的雨水流淌。
苏瑶：“林修，黑客舰队离你只有 100 米了！”
林修：“3 秒够了。”`;

    const director = new MasterDirectorAgent(novelText, 'novel_text', '测试漫剧工程');
    const blackboard = director.getBlackboard();

    expect(blackboard.getData().stage).toBe('idle');
    expect(blackboard.getData().rawInput).toBe(novelText);

    // 执行 ACS-2.0 DAG 拓扑推导与质检闭环
    await director.execute();

    const data = blackboard.getData();
    expect(data.stage).toBe('completed');
    expect(data.scenes.length).toBeGreaterThan(0);
    expect(data.characters.length).toBeGreaterThan(0);

    // 验证 DAG 节点状态
    expect(data.dagNodes).toBeDefined();
    expect(data.dagNodes['task-script']?.status).toBe('completed');
    expect(data.dagNodes['task-character']?.status).toBe('completed');
    expect(data.dagNodes['task-storyboard']?.status).toBe('completed');
    expect(data.dagNodes['task-auditor']?.status).toBe('completed');
    expect(data.dagNodes['task-sound']?.status).toBe('completed');
    expect(data.dagNodes['task-video']?.status).toBe('completed');

    // 验证全息角色 DNA 与 IP-Adapter 锁脸权重
    expect(data.spatialMemory.assetHitRate).toBeGreaterThanOrEqual(0.95);
    const charAnchors = data.spatialMemory.characterAnchors;
    expect(Object.keys(charAnchors).length).toBeGreaterThan(0);
    expect(Object.values(charAnchors)[0].faceLocked).toBe(true);

    // 验证 QualityAuditor 独立质量审计报告
    expect(data.auditReports.length).toBeGreaterThan(0);
    const latestReport = data.auditReports[data.auditReports.length - 1];
    expect(latestReport.overallScore).toBeGreaterThanOrEqual(80);
    expect(latestReport.metrics.length).toBe(4);

    // 验证情感声效与字幕轴
    expect(data.audioConfig).toBeDefined();
    expect(data.subtitles?.length).toBeGreaterThan(0);
    expect(data.renderQueue).toBeDefined();
  });

  it('Should support user-defined custom agent registration and execution', async () => {
    const customAgent = agentRegistry.registerCustomAgent({
      name: 'EXTRA',
      avatar: '🗣️',
      description: '自定义方言润色 Agent',
      triggerPhase: 'on_script_parsed',
      systemPrompt: '将台词增加地方方言语气助词',
      readKeys: ['rawInput'],
      writeKeys: ['scriptContent'],
    });

    expect(customAgent.metadata.isCustom).toBe(true);
    expect(customAgent.metadata.name).toBe('EXTRA');
    expect(agentRegistry.getAll().some((a) => a.metadata.id === customAgent.metadata.id)).toBe(true);

    // 删除自定义 Agent 测试
    const removed = agentRegistry.removeAgent(customAgent.metadata.id);
    expect(removed).toBe(true);
  });
});
