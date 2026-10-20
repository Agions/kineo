import { evaluationService } from '@/core/services/project/evaluation-service';

describe('evaluationService', () => {
  it('should load 20 benchmark samples', () => {
    const samples = evaluationService.getBenchmarkSamples();
    expect(samples.length).toBe(20);
  });

  it('should evaluate and generate markdown report', () => {
    const samples = evaluationService.getBenchmarkSamples();
    const report = evaluationService.evaluate([
      {
        sampleId: samples[0].id,
        generatedDurationSec: samples[0].targetDurationSec,
        generatedCostUSD: samples[0].targetCostUSD,
        shotCount: 10,
        characterConsistency: 85,
        subtitleReadability: 82,
        pacing: 80,
      },
    ]);

    expect(report.items.length).toBe(1);
    expect(report.failedSampleIds.length).toBe(19);
    expect(report.summary.overall).toBeGreaterThan(0);

    const md = evaluationService.toMarkdown(report);
    expect(md).toContain('Kineo AI 评测回归报告');
    expect(md).toContain('| ID | 标题 |');
  });
});
