/**
 * 评审记录导出服务
 * 负责将协同评审与成本信息组装为 Markdown 文本
 */

import { getErrorMessage } from '@/common/utils';
import { STORAGE_KEYS } from '@/core/constants/app-config';
import type { FrameComment, StoryboardVersion } from '@/core/services/domain/collaboration-service';
import type { CostRecord, CostStats } from '@/core/services/project/cost-service';
import type { EvaluationScores } from '@/core/services/project/evaluation-service';

const REVIEW_EXPORT_ACTIVITY_KEY = STORAGE_KEYS.REVIEW_EXPORT_ACTIVITIES;

export interface ReviewExportProjectMeta {
  id: string;
  name: string;
  storyboardFrameCount: number;
}

export interface ReviewExportInput {
  project: ReviewExportProjectMeta;
  comments: FrameComment[];
  versions: StoryboardVersion[];
  costStats: CostStats;
  costRecords: CostRecord[];
  evaluationSummary?: EvaluationScores;
  generatedAt?: Date;
}

export type ReviewExportSource = 'project_edit' | 'project_detail' | 'unknown';
export type ReviewExportStatus = 'success' | 'cancelled' | 'failed';

export interface ReviewExportActivity {
  id: string;
  projectId?: string;
  projectName?: string;
  source: ReviewExportSource;
  status: ReviewExportStatus;
  fileName?: string;
  filePath?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface SaveReviewMarkdownOptions {
  projectId?: string;
  projectName?: string;
  source?: ReviewExportSource;
}

class ReviewExportService {
  private activities: ReviewExportActivity[] = [];
  private listeners: Set<(activities: ReviewExportActivity[]) => void> = new Set();

  constructor() {
    this.loadActivities();
  }

  toMarkdown(input: ReviewExportInput): string {
    const generatedAt = input.generatedAt || new Date();
    const lines: string[] = [];

    lines.push('# Kineo AI 评审记录导出');
    lines.push('');
    lines.push(`- 项目ID: ${input.project.id}`);
    lines.push(`- 项目名称: ${input.project.name}`);
    lines.push(`- 导出时间: ${generatedAt.toLocaleString('zh-CN')}`);
    lines.push(`- 分镜数量: ${input.project.storyboardFrameCount}`);
    lines.push(`- 评论数量: ${input.comments.length}`);
    lines.push(`- 版本数量: ${input.versions.length}`);
    lines.push('');
    lines.push('## 评论时间线');
    lines.push('');

    if (input.comments.length === 0) {
      lines.push('- 暂无评论');
    } else {
      input.comments.forEach((item) => {
        lines.push(
          `- [${new Date(item.createdAt).toLocaleString()}] (${item.frameId}) ${item.author}: ${item.content}`
        );
      });
    }

    lines.push('');
    lines.push('## 分镜版本快照');
    lines.push('');

    if (input.versions.length === 0) {
      lines.push('- 暂无版本快照');
    } else {
      input.versions.forEach((version) => {
        const frameCount = Array.isArray(version.payload) ? version.payload.length : 0;
        lines.push(
          `- ${version.label} (${version.id}) | ${new Date(version.createdAt).toLocaleString()} | by ${version.createdBy} | frames: ${frameCount}`
        );
      });
    }

    lines.push('');
    lines.push('## 成本摘要');
    lines.push('');
    const totalCost = (input.costStats?.total ?? 0).toFixed(4);
    const todayCost = (input.costStats?.today ?? 0).toFixed(4);
    const thisWeekCost = (input.costStats?.thisWeek ?? 0).toFixed(4);
    const thisMonthCost = (input.costStats?.thisMonth ?? 0).toFixed(4);
    lines.push(`- 总成本: $${totalCost}`);
    lines.push(
      `- 今日: $${todayCost} | 本周: $${thisWeekCost} | 本月: $${thisMonthCost}`
    );
    lines.push('');
    lines.push('## 成本记录（最近30条）');
    lines.push('');

    if (input.costRecords.length === 0) {
      lines.push('- 暂无成本记录');
    } else {
      input.costRecords.slice(0, 30).forEach((record) => {
        lines.push(
          `- [${new Date(record.timestamp).toLocaleString()}] ${record.type}/${record.provider}${record.model ? `/${record.model}` : ''}: $${record.cost.toFixed(4)}`
        );
      });
    }

    lines.push('');
    lines.push('## 评测摘要');
    lines.push('');
    if (input.evaluationSummary) {
      lines.push(`- 一致性: ${input.evaluationSummary.consistency.toFixed(1)}`);
      lines.push(`- 节奏: ${input.evaluationSummary.pacing.toFixed(1)}`);
      lines.push(`- 可读性: ${input.evaluationSummary.readability.toFixed(1)}`);
      lines.push(`- 成本: ${input.evaluationSummary.cost.toFixed(1)}`);
      lines.push(`- 综合: ${input.evaluationSummary.overall.toFixed(1)}`);
    } else {
      lines.push('- 当前项目暂无可用评测摘要');
    }

    return lines.join('\n');
  }

  addActivity(input: Omit<ReviewExportActivity, 'id' | 'createdAt'>): ReviewExportActivity {
    const activity: ReviewExportActivity = {
      ...input,
      id: `review_export_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    this.activities = [activity, ...this.activities].slice(0, 200);
    this.saveActivities();
    this.notify();
    return activity;
  }

  getActivities(projectId?: string): ReviewExportActivity[] {
    const list = projectId
      ? this.activities.filter((item) => item.projectId === projectId)
      : this.activities;
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  subscribe(listener: (activities: ReviewExportActivity[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async saveMarkdownToFile(
    defaultFileName: string,
    content: string,
    options: SaveReviewMarkdownOptions = {}
  ): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const filePath = await invoke<string>('save_file_dialog', {
        defaultPath: defaultFileName,
        filters: [{ name: 'Markdown Files', extensions: ['md'] }],
      });

      if (!filePath) {
        this.addActivity({
          projectId: options.projectId,
          projectName: options.projectName,
          source: options.source || 'unknown',
          status: 'cancelled',
          fileName: defaultFileName,
        });
        return false;
      }

      await invoke('write_text_file', {
        path: filePath,
        content,
      });

      this.addActivity({
        projectId: options.projectId,
        projectName: options.projectName,
        source: options.source || 'unknown',
        status: 'success',
        fileName: this.extractFileName(filePath),
        filePath,
      });
      return true;
    } catch (error) {
      this.addActivity({
        projectId: options.projectId,
        projectName: options.projectName,
        source: options.source || 'unknown',
        status: 'failed',
        fileName: defaultFileName,
        errorMessage: getErrorMessage(error),
      });
      throw error;
    }
  }

  private extractFileName(path: string): string {
    const parts = path.split(/[\\/]/);
    return parts[parts.length - 1] || path;
  }

  private notify(): void {
    const list = this.getActivities();
    this.listeners.forEach((listener) => listener(list));
  }

  private saveActivities(): void {
    try {
      localStorage.setItem(REVIEW_EXPORT_ACTIVITY_KEY, JSON.stringify(this.activities));
    } catch {
      // ignore
    }
  }

  private loadActivities(): void {
    try {
      const raw = localStorage.getItem(REVIEW_EXPORT_ACTIVITY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ReviewExportActivity[];
      if (Array.isArray(parsed)) {
        this.activities = parsed;
      }
    } catch {
      this.activities = [];
    }
  }
}

export const reviewExportService = new ReviewExportService();
export default ReviewExportService;
