import type { FrameComment, StoryboardVersion } from '@/core/services/domain/collaboration-service';
import type { CostStats } from '@/core/services/project/cost-service';

const mockInvoke = jest.fn();

jest.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

const getService = async () => {
  const mod = await import('@/core/services/pipeline/review-export-service');
  return mod.reviewExportService;
};

describe('reviewExportService', () => {
  const costStats: CostStats = {
    total: 1.2345,
    today: 0.12,
    thisWeek: 0.8,
    thisMonth: 1.23,
    byType: { llm: 0.8, video: 0.43 },
    byProvider: { openai: 0.8, kling: 0.43 },
    byModel: { 'gpt-5': 0.8 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    localStorage.clear();
  });

  it('should generate markdown with project meta, comments, versions and costs', async () => {
    const reviewExportService = await getService();
    const comments: FrameComment[] = [
      {
        id: 'c1',
        projectId: 'p1',
        frameId: 'f1',
        content: '节奏偏慢',
        author: 'qa',
        createdAt: '2026-03-08T10:00:00.000Z',
      },
    ];
    const versions: StoryboardVersion[] = [
      {
        id: 'v1',
        projectId: 'p1',
        label: '初版',
        createdAt: '2026-03-08T11:00:00.000Z',
        createdBy: 'pm',
        payload: [{ id: 'f1' }],
      },
    ];

    const markdown = reviewExportService.toMarkdown({
      project: { id: 'p1', name: '测试项目', storyboardFrameCount: 8 },
      comments,
      versions,
      costStats,
      costRecords: [
        {
          id: 'r1',
          type: 'llm',
          provider: 'openai',
          model: 'gpt-5',
          cost: 0.0456,
          timestamp: '2026-03-08T12:00:00.000Z',
        },
      ],
      evaluationSummary: {
        consistency: 88,
        pacing: 80,
        readability: 84,
        cost: 78,
        overall: 83,
      },
      generatedAt: new Date('2026-03-08T12:30:00.000Z'),
    });

    expect(markdown).toContain('Kineo AI 评审记录导出');
    expect(markdown).toContain('- 项目ID: p1');
    expect(markdown).toContain('- 评论数量: 1');
    expect(markdown).toContain('## 评论时间线');
    expect(markdown).toContain('节奏偏慢');
    expect(markdown).toContain('## 分镜版本快照');
    expect(markdown).toContain('初版');
    expect(markdown).toContain('## 成本摘要');
    expect(markdown).toContain('- 总成本: $1.2345');
    expect(markdown).toContain('## 成本记录（最近30条）');
    expect(markdown).toContain('llm/openai/gpt-5: $0.0456');
    expect(markdown).toContain('## 评测摘要');
    expect(markdown).toContain('- 综合: 83.0');
  });

  it('should fallback to empty text when comments and versions are empty', async () => {
    const reviewExportService = await getService();
    const markdown = reviewExportService.toMarkdown({
      project: { id: 'p2', name: '空项目', storyboardFrameCount: 0 },
      comments: [],
      versions: [],
      costStats: { ...costStats, total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
      costRecords: [],
      generatedAt: new Date('2026-03-08T13:00:00.000Z'),
    });

    expect(markdown).toContain('- 暂无评论');
    expect(markdown).toContain('- 暂无版本快照');
    expect(markdown).toContain('- 暂无成本记录');
    expect(markdown).toContain('- 当前项目暂无可用评测摘要');
  });

  it('should record success activity after saving markdown', async () => {
    const reviewExportService = await getService();
    mockInvoke.mockResolvedValueOnce('/tmp/review-success.md').mockResolvedValueOnce(undefined);

    const result = await reviewExportService.saveMarkdownToFile('test.md', '# content', {
      projectId: 'p-success',
      projectName: '成功项目',
      source: 'project_edit',
    });

    expect(result).toBe(true);
    const activities = reviewExportService.getActivities('p-success');
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      projectId: 'p-success',
      projectName: '成功项目',
      source: 'project_edit',
      status: 'success',
      fileName: 'review-success.md',
      filePath: '/tmp/review-success.md',
    });
  });

  it('should record cancelled activity when user cancels file picker', async () => {
    const reviewExportService = await getService();
    mockInvoke.mockResolvedValueOnce('');

    const result = await reviewExportService.saveMarkdownToFile('cancel.md', '# content', {
      projectId: 'p-cancel',
      source: 'project_detail',
    });

    expect(result).toBe(false);
    const activities = reviewExportService.getActivities('p-cancel');
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      projectId: 'p-cancel',
      source: 'project_detail',
      status: 'cancelled',
      fileName: 'cancel.md',
    });
  });

  it('should record failed activity when save throws', async () => {
    const reviewExportService = await getService();
    mockInvoke
      .mockResolvedValueOnce('/tmp/review-failed.md')
      .mockRejectedValueOnce(new Error('disk full'));

    await expect(
      reviewExportService.saveMarkdownToFile('failed.md', '# content', {
        projectId: 'p-fail',
        source: 'project_detail',
      })
    ).rejects.toThrow('disk full');

    const activities = reviewExportService.getActivities('p-fail');
    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      projectId: 'p-fail',
      source: 'project_detail',
      status: 'failed',
      fileName: 'failed.md',
      errorMessage: 'disk full',
    });
  });
});
