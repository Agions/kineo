import type { StoryboardFrame } from '@/core/storyboard/types/storyboard';
import type { EvaluationScores } from '@/core/services/project/evaluation-service';

export type QualityGateIssueLevel = 'error' | 'warning';

export interface QualityGateIssue {
  code: string;
  level: QualityGateIssueLevel;
  title: string;
  detail: string;
  frameId?: string;
  frameIndex?: number;
  field?: keyof StoryboardFrame;
}

export interface QualityGateThresholds {
  minFrameCount: number;
  minSceneCoverage: number;
  minRenderedCoverage: number;
  maxFrameDurationSec: number;
  minConsistency: number;
  minPacing: number;
  minReadability: number;
  minCostScore: number;
  minOverall: number;
  requireEvaluationSummary: boolean;
}

export interface QualityGateInput {
  storyboardFrames: StoryboardFrame[];
  evaluationSummary?: EvaluationScores;
  thresholds?: Partial<QualityGateThresholds>;
}

export interface QualityGateMetrics {
  frameCount: number;
  sceneCoverage: number;
  renderedCoverage: number;
  maxFrameDurationSec: number;
}

export interface QualityGateResult {
  passed: boolean;
  metrics: QualityGateMetrics;
  thresholds: QualityGateThresholds;
  issues: QualityGateIssue[];
}

const DEFAULT_THRESHOLDS: QualityGateThresholds = {
  minFrameCount: 6,
  minSceneCoverage: 0.8,
  minRenderedCoverage: 0.6,
  maxFrameDurationSec: 12,
  minConsistency: 75,
  minPacing: 72,
  minReadability: 72,
  minCostScore: 65,
  minOverall: 74,
  requireEvaluationSummary: false,
};

class QualityGateService {
  evaluate(input: QualityGateInput): QualityGateResult {
    const thresholds: QualityGateThresholds = {
      ...DEFAULT_THRESHOLDS,
      ...(input.thresholds || {}),
    };

    const frames = Array.isArray(input.storyboardFrames) ? input.storyboardFrames : [];
    const frameCount = frames.length;
    const describedCount = frames.filter((frame) => Boolean(frame.sceneDescription?.trim())).length;
    const renderedCount = frames.filter((frame) => Boolean(frame.imageUrl?.trim())).length;
    const maxFrameDurationSec = frames.reduce(
      (max, frame) => Math.max(max, Number(frame.duration || 0)),
      0
    );
    const firstMissingDescription = frames.find((frame) => !frame.sceneDescription?.trim());
    const firstUnrenderedFrame = frames.find((frame) => !frame.imageUrl?.trim());
    const maxDurationFrame = frames.find(
      (frame) => Number(frame.duration || 0) === maxFrameDurationSec
    );

    const sceneCoverage = frameCount > 0 ? describedCount / frameCount : 0;
    const renderedCoverage = frameCount > 0 ? renderedCount / frameCount : 0;

    const issues: QualityGateIssue[] = [];

    if (frameCount < thresholds.minFrameCount) {
      issues.push({
        code: 'frame_count_low',
        level: 'error',
        title: '分镜数量不足',
        detail: `当前 ${frameCount} 镜，低于建议最小值 ${thresholds.minFrameCount}。`,
      });
    }

    if (sceneCoverage < thresholds.minSceneCoverage) {
      const frameIndex = firstMissingDescription
        ? frames.findIndex((frame) => frame.id === firstMissingDescription.id)
        : -1;
      issues.push({
        code: 'scene_coverage_low',
        level: 'warning',
        title: '场景描述覆盖不足',
        detail: `当前覆盖率 ${(sceneCoverage * 100).toFixed(0)}%，建议不低于 ${(thresholds.minSceneCoverage * 100).toFixed(0)}%。`,
        frameId: firstMissingDescription?.id,
        frameIndex: frameIndex >= 0 ? frameIndex : undefined,
        field: firstMissingDescription ? 'sceneDescription' : undefined,
      });
    }

    if (renderedCoverage < thresholds.minRenderedCoverage) {
      const frameIndex = firstUnrenderedFrame
        ? frames.findIndex((frame) => frame.id === firstUnrenderedFrame.id)
        : -1;
      issues.push({
        code: 'rendered_coverage_low',
        level: 'warning',
        title: '已渲染镜头占比偏低',
        detail: `当前渲染率 ${(renderedCoverage * 100).toFixed(0)}%，建议不低于 ${(thresholds.minRenderedCoverage * 100).toFixed(0)}%。`,
        frameId: firstUnrenderedFrame?.id,
        frameIndex: frameIndex >= 0 ? frameIndex : undefined,
        field: firstUnrenderedFrame ? 'imageUrl' : undefined,
      });
    }

    if (maxFrameDurationSec > thresholds.maxFrameDurationSec) {
      const frameIndex = maxDurationFrame
        ? frames.findIndex((frame) => frame.id === maxDurationFrame.id)
        : -1;
      issues.push({
        code: 'frame_duration_high',
        level: 'warning',
        title: '单镜头时长偏大',
        detail: `最长镜头 ${maxFrameDurationSec}s，建议不超过 ${thresholds.maxFrameDurationSec}s。`,
        frameId: maxDurationFrame?.id,
        frameIndex: frameIndex >= 0 ? frameIndex : undefined,
        field: maxDurationFrame ? 'duration' : undefined,
      });
    }

    this.checkEvaluationSummary(input.evaluationSummary, thresholds, issues);

    return {
      passed: !issues.some((issue) => issue.level === 'error'),
      metrics: {
        frameCount,
        sceneCoverage,
        renderedCoverage,
        maxFrameDurationSec,
      },
      thresholds,
      issues,
    };
  }

  private checkEvaluationSummary(
    summary: EvaluationScores | undefined,
    thresholds: QualityGateThresholds,
    issues: QualityGateIssue[]
  ): void {
    if (!summary) {
      if (thresholds.requireEvaluationSummary) {
        issues.push({
          code: 'evaluation_missing',
          level: 'error',
          title: '缺少评测摘要',
          detail: '请先运行评测回归，生成一致性/节奏/可读性/成本评分。',
        });
      } else {
        issues.push({
          code: 'evaluation_missing',
          level: 'warning',
          title: '缺少评测摘要',
          detail: '建议先运行评测回归再导出，以降低回归风险。',
        });
      }
      return;
    }

    this.checkMinScore(
      'consistency_low',
      '角色一致性偏低',
      summary.consistency,
      thresholds.minConsistency,
      issues
    );
    this.checkMinScore('pacing_low', '节奏评分偏低', summary.pacing, thresholds.minPacing, issues);
    this.checkMinScore(
      'readability_low',
      '可读性评分偏低',
      summary.readability,
      thresholds.minReadability,
      issues
    );
    this.checkMinScore(
      'cost_score_low',
      '成本评分偏低',
      summary.cost,
      thresholds.minCostScore,
      issues
    );
    this.checkMinScore(
      'overall_low',
      '综合评分偏低',
      summary.overall,
      thresholds.minOverall,
      issues
    );
  }

  private checkMinScore(
    code: string,
    title: string,
    actual: number,
    expected: number,
    issues: QualityGateIssue[]
  ): void {
    if (Number.isFinite(actual) && actual >= expected) return;

    issues.push({
      code,
      level: actual < expected - 8 ? 'error' : 'warning',
      title,
      detail: `当前 ${Number.isFinite(actual) ? actual.toFixed(1) : '0.0'}，建议不低于 ${expected.toFixed(1)}。`,
    });
  }
}

export const qualityGateService = new QualityGateService();
export default QualityGateService;
