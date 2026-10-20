/**
 * 评测基线与回归服务（D2）
 */

import type { EvaluationScores } from '@/common/types/project';
import benchmarkStories from '@/core/data/benchmark-stories.zh-CN.json';

export interface BenchmarkSample {
  id: string;
  title: string;
  genre: string;
  text: string;
  targetDurationSec: number;
  targetCostUSD: number;
}

export interface EvaluationCaseResult {
  sampleId: string;
  generatedDurationSec: number;
  generatedCostUSD: number;
  shotCount: number;
  characterConsistency: number; // 0-100
  subtitleReadability: number; // 0-100
  pacing: number; // 0-100
}

/** @deprecated Use @/common/types/project. Re-exported for backward compat. */
export type { EvaluationScores };

export interface EvaluationItemReport {
  sampleId: string;
  title: string;
  scores: EvaluationScores;
  notes: string[];
}

export interface EvaluationReport {
  generatedAt: string;
  summary: EvaluationScores;
  items: EvaluationItemReport[];
  failedSampleIds: string[];
}

class EvaluationService {
  getBenchmarkSamples(): BenchmarkSample[] {
    return benchmarkStories as BenchmarkSample[];
  }

  evaluate(results: EvaluationCaseResult[]): EvaluationReport {
    const samples = this.getBenchmarkSamples();
    const sampleMap = new Map(samples.map((sample) => [sample.id, sample]));

    const items: EvaluationItemReport[] = [];

    for (const result of results) {
      const sample = sampleMap.get(result.sampleId);
      if (!sample) continue;

      const consistency = clamp(result.characterConsistency);
      const pacing = clamp(
        this.scorePacing(result.generatedDurationSec, sample.targetDurationSec, result.pacing)
      );
      const readability = clamp(result.subtitleReadability);
      const cost = clamp(this.scoreCost(result.generatedCostUSD, sample.targetCostUSD));
      const overall = clamp(consistency * 0.35 + pacing * 0.25 + readability * 0.2 + cost * 0.2);

      const notes: string[] = [];
      if (consistency < 70) notes.push('角色一致性偏低，建议提升角色锁定权重');
      if (pacing < 70) notes.push('节奏偏离目标时长，建议调整分镜时长分配');
      if (readability < 70) notes.push('字幕可读性不足，建议缩短单句长度');
      if (cost < 70) notes.push('成本超预算明显，建议降级部分模型档位');
      if (notes.length === 0) notes.push('指标稳定，可作为基线版本');

      items.push({
        sampleId: sample.id,
        title: sample.title,
        scores: { consistency, pacing, readability, cost, overall },
        notes,
      });
    }

    const failedSampleIds = samples
      .map((sample) => sample.id)
      .filter((sampleId) => !items.some((item) => item.sampleId === sampleId));

    return {
      generatedAt: new Date().toISOString(),
      summary: this.aggregate(items),
      items,
      failedSampleIds,
    };
  }

  toMarkdown(report: EvaluationReport): string {
    const lines: string[] = [];
    lines.push('# Kineo AI 评测回归报告');
    lines.push('');
    lines.push(`生成时间: ${report.generatedAt}`);
    lines.push('');
    lines.push('## 总览分数');
    lines.push('');
    lines.push(`- 一致性: ${report.summary.consistency.toFixed(1)}`);
    lines.push(`- 节奏: ${report.summary.pacing.toFixed(1)}`);
    lines.push(`- 可读性: ${report.summary.readability.toFixed(1)}`);
    lines.push(`- 成本: ${report.summary.cost.toFixed(1)}`);
    lines.push(`- 综合: ${report.summary.overall.toFixed(1)}`);
    lines.push('');
    lines.push('## 样例明细');
    lines.push('');
    lines.push('| ID | 标题 | 一致性 | 节奏 | 可读性 | 成本 | 综合 |');
    lines.push('|---|---|---:|---:|---:|---:|---:|');
    report.items.forEach((item) => {
      lines.push(
        `| ${item.sampleId} | ${item.title} | ${item.scores.consistency.toFixed(1)} | ${item.scores.pacing.toFixed(1)} | ${item.scores.readability.toFixed(1)} | ${item.scores.cost.toFixed(1)} | ${item.scores.overall.toFixed(1)} |`
      );
    });

    lines.push('');
    lines.push('## 失败样例');
    lines.push('');
    lines.push(report.failedSampleIds.length > 0 ? report.failedSampleIds.join(', ') : '无');

    lines.push('');
    lines.push('## 重点建议');
    lines.push('');
    const topNotes = this.collectTopNotes(report.items);
    topNotes.forEach((note) => lines.push(`- ${note}`));

    return lines.join('\n');
  }

  private collectTopNotes(items: EvaluationItemReport[]): string[] {
    const counter = new Map<string, number>();
    items.forEach((item) =>
      item.notes.forEach((note) => counter.set(note, (counter.get(note) || 0) + 1))
    );
    return [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([note, count]) => `${note}（${count}条）`);
  }

  private scorePacing(actual: number, target: number, baseScore: number): number {
    const diffRatio = target > 0 ? Math.abs(actual - target) / target : 0;
    const penalty = Math.min(diffRatio * 100, 40);
    return baseScore - penalty;
  }

  private scoreCost(actual: number, target: number): number {
    if (target <= 0) return 100;
    const ratio = actual / target;
    if (ratio <= 1) return 100 - ratio * 10;
    const overPenalty = Math.min((ratio - 1) * 80, 80);
    return 100 - overPenalty;
  }

  private aggregate(items: EvaluationItemReport[]): EvaluationScores {
    if (items.length === 0) {
      return { consistency: 0, pacing: 0, readability: 0, cost: 0, overall: 0 };
    }

    const sum = items.reduce(
      (acc, item) => {
        acc.consistency += item.scores.consistency;
        acc.pacing += item.scores.pacing;
        acc.readability += item.scores.readability;
        acc.cost += item.scores.cost;
        acc.overall += item.scores.overall;
        return acc;
      },
      { consistency: 0, pacing: 0, readability: 0, cost: 0, overall: 0 }
    );

    return {
      consistency: sum.consistency / items.length,
      pacing: sum.pacing / items.length,
      readability: sum.readability / items.length,
      cost: sum.cost / items.length,
      overall: sum.overall / items.length,
    };
  }
}

function clamp(num: number): number {
  if (Number.isNaN(num)) return 0;
  if (num < 0) return 0;
  if (num > 100) return 100;
  return num;
}

export const evaluationService = new EvaluationService();
export default EvaluationService;
