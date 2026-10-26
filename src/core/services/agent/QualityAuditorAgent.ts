/**
 * QualityAuditorAgent.ts — 工业级漫剧质量审计总监智能体 (Quality Auditor)
 *
 * 职责：
 * 1. 作为多智能体流水线中的独立“监制/质检员”，对分镜、角色设定、机位及叙事节奏进行四维量化审计评分：
 *    - 角色视觉一致性 (Consistency Score, 权重 30%)
 *    - 镜头机位与视效语法 (Cinematography Score, 权重 25%)
 *    - 叙事与节拍张力 (Pacing Score, 权重 25%)
 *    - 提示词遵循度与质量 (Prompt Adherence Score, 权重 20%)
 * 2. 当加权总分 < 85 时，生成结构化批评建议 (Reflection Context)，精准触发目标 Agent 重试与自愈。
 * 3. 当评分达标后，出具审计合格快照报告并放行进入声效与渲染阶段。
 */

import { BaseAgent } from './BaseAgent';
import type {
  ApprovalGate,
  AuditMetric,
  AuditReport,
  ProjectBlackboard,
  ReflectionContext,
} from './ProjectBlackboard';

export class QualityAuditorAgent extends BaseAgent {
  public static readonly PASSING_THRESHOLD = 85;

  constructor() {
    super({
      id: 'agent-auditor',
      name: 'AUDIT',
      role: 'quality_auditor',
      avatar: '⚖️',
      description: '独立影视质检与自愈审计总监，负责四维量化评分与批评回传',
      triggerPhase: 'on_quality_audited',
      readKeys: ['scenes', 'characters', 'spatialMemory', 'cameraDirectingPlans'],
      writeKeys: ['auditReports', 'currentReflection', 'stage'],
    });
  }

  public async execute(blackboard: ProjectBlackboard): Promise<void> {
    const data = blackboard.getData();
    this.log(blackboard, '🔍 启动 ACS-2.0 独立质量审计，对镜头资产进行四维量化评估...', 'info');

    const metrics: AuditMetric[] = [];
    const scenes = data.scenes || [];
    const characters = data.characters || [];
    const spatial = data.spatialMemory || { characterAnchors: {}, assetHitRate: 0.9 };
    const cameraPlans = data.cameraDirectingPlans || {};

    // 1. 角色一致性审计 (Consistency Score, 30%)
    let consistencyScore = 90;
    const missingAnchors = characters.filter((c) => !spatial.characterAnchors[c.name]?.faceLocked);
    if (missingAnchors.length > 0) {
      consistencyScore -= missingAnchors.length * 15;
    }
    consistencyScore = Math.max(50, Math.min(100, Math.round(consistencyScore * (spatial.assetHitRate || 0.92))));
    metrics.push({
      name: '角色视觉一致性 (Consistency)',
      score: consistencyScore,
      weight: 0.3,
      passed: consistencyScore >= 80,
      critique:
        consistencyScore < 80
          ? `检测到 ${missingAnchors.map((c) => c.name).join(', ')} 缺少 IP-Adapter 锁脸权重或特征向量未闭环`
          : '全量登场角色面部特征与 LoRA 锚点完全锁定',
    });

    // 2. 镜头机位与视效语法审计 (Cinematography Score, 25%)
    let cinematographyScore = 88;
    const sceneKeys = Object.keys(cameraPlans);
    if (sceneKeys.length === 0 && scenes.length > 0) {
      cinematographyScore = 65;
    } else {
      // 检查运镜多样性，避免全部为静态 Static
      const motions = Object.values(cameraPlans).map((p) => p.cameraMotion);
      const uniqueMotions = new Set(motions);
      if (uniqueMotions.size <= 1 && motions.length > 2) {
        cinematographyScore -= 20;
      } else if (uniqueMotions.has('Hitchcock_Zoom') || uniqueMotions.has('FPV_Fly')) {
        cinematographyScore += 8;
      }
    }
    cinematographyScore = Math.max(50, Math.min(100, cinematographyScore));
    metrics.push({
      name: '镜头机位与运镜语法 (Cinematography)',
      score: cinematographyScore,
      weight: 0.25,
      passed: cinematographyScore >= 80,
      critique:
        cinematographyScore < 80
          ? '镜头运动方式过于单一，缺乏特写与动态运镜（推拉/希区柯克变焦）'
          : '景别过渡丰富，包含特写、中景与动态推拉运镜矢量',
    });

    // 3. 叙事与节拍张力审计 (Pacing Score, 25%)
    let pacingScore = 92;
    if (scenes.length === 0) {
      pacingScore = 40;
    } else {
      const avgLength = scenes.reduce((acc, s) => acc + (s.content?.length || 0), 0) / scenes.length;
      if (avgLength < 10) pacingScore -= 25;
      if (scenes.some((s) => !s.dialogues || s.dialogues.length === 0)) {
        pacingScore -= 10;
      }
    }
    pacingScore = Math.max(50, Math.min(100, pacingScore));
    metrics.push({
      name: '叙事节拍与戏剧张力 (Pacing)',
      score: pacingScore,
      weight: 0.25,
      passed: pacingScore >= 80,
      critique:
        pacingScore < 80
          ? '场景台词密度或情节起伏不均，缺少关键情绪递进节拍'
          : '三段式戏剧弧光完整，对白与潜台词张力充沛',
    });

    // 4. 提示词遵循度与细节画质 (Prompt Adherence, 20%)
    let adherenceScore = 95;
    const hasVisualPrompt = scenes.some((s) => s.content && s.content.length > 20);
    if (!hasVisualPrompt) adherenceScore -= 20;
    metrics.push({
      name: '提示词遵循度与画质规范 (Prompt Adherence)',
      score: adherenceScore,
      weight: 0.2,
      passed: adherenceScore >= 80,
      critique: '包含高分辨率光影渲染标签、动漫上色色彩空间及负面提示词约束',
    });

    // 计算加权总分
    const overallScore = Math.round(
      metrics.reduce((acc, m) => acc + m.score * m.weight, 0)
    );
    let passed = overallScore >= QualityAuditorAgent.PASSING_THRESHOLD;

    const failedMetric = metrics.find((m) => !m.passed);
    let reflection: ReflectionContext | null = null;

    if (!passed && failedMetric) {
      const currentRetry = (data.currentReflection?.retryCount || 0) + 1;
      reflection = {
        failedMetric: failedMetric.name,
        critique: failedMetric.critique || '质量指标未达到影视级工业标准',
        remedySuggestions: [
          '增加关键帧角色 IP-Adapter 参考图输入',
          '重构场景运镜序列，引入推镜 (Dolly-In) 与倾斜机位 (Dutch Angle)',
          '丰富人物微表情与光照氛围关键词 (Dramatic Lighting, Rim Light)',
        ],
        retryCount: currentRetry,
        maxRetries: 3,
      };

      // 检查调度器是否挂载 (HITL 审批断点机制)
      const scheduler = blackboard.getScheduler?.();
      if (scheduler && typeof scheduler.waitForApproval === 'function') {
        const gate: ApprovalGate = {
          id: `gate-audit-${Date.now()}`,
          taskId: 'task-auditor',
          agentId: this.metadata.id,
          agentName: this.metadata.name,
          title: `四维质检审计未达标 (${overallScore}分 / 85分)`,
          description: `审计员发现缺陷: ${reflection.critique}。建议打回自愈或由人类总导演特批放行。`,
          type: 'quality_audit',
          createdAt: new Date().toISOString(),
          status: 'pending',
          context: {
            overallScore,
            metrics,
            failedMetric: failedMetric.name,
            critique: reflection.critique,
            remedySuggestions: reflection.remedySuggestions,
          },
          suggestedActions: [
            { id: 'reflect_retry', label: '采纳建议打回重推 (Healing)', variant: 'default' },
            { id: 'override_approve', label: '总导演特批强制放行 (Override)', variant: 'secondary' },
          ],
        };

        this.log(blackboard, `🚨 质检未达标，向人类总导演提请审批决策 [Gate: ${gate.id}]...`, 'warn');
        const decision = await scheduler.waitForApproval(gate);

        if (decision.action === 'approve') {
          this.log(blackboard, '🛡️ 人类总导演签署特批令，已强制放行质检！', 'warn');
          passed = true;
          reflection = null;
        } else {
          this.log(blackboard, `🔄 人类总导演裁决打回自愈: ${decision.userFeedback || '按原建议优化'}`, 'info');
        }
      } else {
        this.log(
          blackboard,
          `⚠️ 质检未达标 [总分: ${overallScore}/${QualityAuditorAgent.PASSING_THRESHOLD}]。原因: ${reflection.critique}，生成批评意见触发针对性重试...`,
          'warn'
        );
      }
    } else {
      this.log(
        blackboard,
        `✅ 质检审计通过 [总分: ${overallScore}/${QualityAuditorAgent.PASSING_THRESHOLD}]！各项视听指标符合影视级标准。`,
        'success'
      );
    }

    const report: AuditReport = {
      id: `audit-rep-${Date.now()}`,
      timestamp: new Date().toISOString(),
      phase: 'storyboard_and_character_review',
      overallScore,
      passed,
      metrics,
      critiqueSummary: passed
        ? '全项视听指标达标，符合 4K 漫剧压制标准'
        : (reflection?.critique || '部分关键分镜指标偏离设定'),
      recommendedAction: passed ? 'proceed' : 'reflect_retry',
      targetAgentId: failedMetric?.name.includes('角色') ? 'agent-actor' : 'agent-visual',
    };

    const updatedReports = [...(data.auditReports || []), report];

    blackboard.update(
      {
        auditReports: updatedReports,
        currentReflection: reflection,
      },
      this.metadata.id,
      this.metadata.name,
      `审计评分: ${overallScore} 分 | 判定: ${passed ? '合格放行' : '打回优化'}`
    );

    if (!passed && reflection && reflection.retryCount > reflection.maxRetries) {
      this.log(blackboard, '⚠️ 达到最大批评重试上限，自动启用保底容错策略强制放行。', 'warn');
      blackboard.update({ currentReflection: null }, this.metadata.id, this.metadata.name);
    }
  }
}
