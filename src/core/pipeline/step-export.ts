/**
 * Pipeline 步骤：导出与发布 (Export & Publish)
 * ========================================================
 * 负责：生成最终导出文件、项目数据持久化、发布元数据生成
 *
 * 本步骤是漫剧流程的最后一环，接收 VIDEO_EDITING 的输出，
 * 生成可交付的漫剧视频文件 + 项目快照。
 *
 * @module core/pipeline/step-export
 */

import { projectImportExportService } from '@/core/services/project/project-import-export-service';
import { logger } from '@/core/utils/logger';

import { BasePipelineStep } from './base-pipeline-step';
import { PipelineStepId, QualityGateDecision } from './pipeline-types';
import type { PipelineStep, StepInput } from './pipeline-types';
import { getContext } from './step-helpers';

/** 导出步骤输出 */
export interface ExportOutput {
  /** 最终视频 URL */
  videoUrl: string;
  /** 导出文件名 */
  filename: string;
  /** 文件格式 */
  format: 'mp4';
  /** 视频时长（秒） */
  duration: number;
  /** 分辨率 */
  resolution: { width: number; height: number };
  /** 项目数据 JSON（用于备份/分享） */
  projectDataJson?: string;
  /** 导出时间戳 */
  exportedAt: string;
  /** 是否成功 */
  success: boolean;
}

export class ExportStep extends BasePipelineStep {
  constructor(config?: Partial<PipelineStep>) {
    super({
      ...config,
      id: config?.id ?? 'step-export',
      name: config?.name ?? '导出发布',
      stepId: config?.stepId ?? PipelineStepId.EXPORT,
      dependencies: config?.dependencies ?? [PipelineStepId.VIDEO_EDITING],
    });
  }

  protected computeMetrics(result: unknown): Record<string, unknown> {
    return {
      exported: result && typeof result === 'object' && (result as ExportOutput).success ? 1 : 0,
    };
  }

  protected computeQualityGate(result: unknown): QualityGateDecision | undefined {
    if (result && typeof result === 'object') {
      const output = result as ExportOutput;
      if (!output.success) {
        return QualityGateDecision.FAIL;
      }
      if (!output.videoUrl || output.videoUrl.length === 0) {
        return QualityGateDecision.WARN;
      }
      return QualityGateDecision.PASS;
    }
    return undefined;
  }

  protected async executeImpl(input: StepInput): Promise<unknown> {
    const context = getContext(input)!;
    logger.info(`[ExportStep] Starting export for workflow ${input.workflowId}`);

    // 从上游步骤读取视频编辑结果
    const finalVideoUrl = context.getVariable<string>('finalVideoUrl');
    const finalVideoDuration = context.getVariable<number>('finalVideoDuration');
    const finalVideoResolution = context.getVariable<{ width: number; height: number }>(
      'finalVideoResolution'
    );

    if (!finalVideoUrl) {
      throw new Error('No final video URL available for export');
    }

    this.reportProgress(20, '正在生成导出文件...');

    // 构造导出输出
    const output: ExportOutput = {
      videoUrl: finalVideoUrl,
      filename: `kineo_${input.workflowId}_${Date.now()}.mp4`,
      format: 'mp4',
      duration: finalVideoDuration ?? 0,
      resolution: finalVideoResolution ?? { width: 1920, height: 1080 },
      exportedAt: new Date().toISOString(),
      success: true,
    };

    this.reportProgress(50, '正在生成项目数据快照...');

    // 导出项目数据 JSON（用于备份/分享）
    try {
      const project = context.getVariable<{ id: string; name: string }>('project');
      if (project) {
        output.projectDataJson = projectImportExportService.exportToJSON(
          project as Parameters<typeof projectImportExportService.exportToJSON>[0],
          { format: 'json', includeMedia: false }
        );
      }
    } catch (err) {
      logger.warn(`[ExportStep] Failed to export project data: ${err}`);
      // 非阻塞：视频导出仍可继续
    }

    this.reportProgress(80, '正在验证导出完整性...');

    // 验证输出
    const qualityGate = this.computeQualityGate(output);
    if (qualityGate === QualityGateDecision.FAIL) {
      output.success = false;
      throw new Error('Export quality gate failed: video output is invalid');
    }

    this.reportProgress(100, '导出完成');

    // 将输出写入 context，供下游/UI 使用
    context.setVariable('exportOutput', output);
    context.setVariable('exportSuccess', output.success);
    context.setVariable('exportFilename', output.filename);

    const totalMs = Date.now() - ((input as { startTime?: number }).startTime ?? 0);
    logger.success(
      `[ExportStep] Export completed in ${(totalMs / 1000).toFixed(1)}s: ${output.filename}`
    );

    return output;
  }
}

/** Factory function — used by pipeline/index.ts and pipeline-step-factories.ts */
export function createExportStep(config?: Partial<PipelineStep>): ExportStep {
  return new ExportStep(config);
}
