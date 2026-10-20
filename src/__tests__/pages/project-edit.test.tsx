import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useEffect } from 'react';

import ProjectEdit from '@/pages/project-edit/ProjectEditPage';

const mockNavigate = jest.fn();
const mockLoadProjectFromFile = jest.fn();
const mockSaveProjectToFile = jest.fn().mockResolvedValue(undefined);
const mockInvoke = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ projectId: 'p-edit-1' }),
  useLocation: () => ({ search: '' }),
}));

jest.mock('@/components/ai/ScriptEditor/ScriptEditor', () => () => <div>ScriptEditor</div>);
jest.mock('@/features/cost/components/CostDashboard', () => () => (
  <div data-testid="mock-cost-dashboard">CostDashboard</div>
));
jest.mock(
  '@/features/storyboard/components/StoryboardEditor',
  ({
    onFrameSelect,
  }: {
    initialFrames: Array<{ id: string; title: string }>;
    onFrameSelect?: (frame: { id: string; title: string }) => void;
  }) => {
    React.useEffect(() => {
      if (onFrameSelect) onFrameSelect({ id: 'frame-1', title: '镜头1' });
    }, [onFrameSelect]);
    return <div>StoryboardEditor</div>;
  }
);

jest.mock('@/core/services', () => ({
  tauriService: {
    readText: (...args: unknown[]) => mockLoadProjectFromFile(...args),
    writeText: (...args: unknown[]) => mockSaveProjectToFile(...args),
  },
  aiService: { generate: jest.fn() },
  qualityGateService: {
    evaluate: jest.fn().mockReturnValue({ pass: true, score: 85 }),
    checkThresholds: jest.fn(),
  },
  collaborationService: {
    hydrate: jest.fn(),
    listComments: jest.fn().mockReturnValue([]),
    listVersions: jest.fn().mockReturnValue([]),
    addComment: jest.fn(),
    saveVersion: jest.fn(),
  },
  costService: { getBudget: jest.fn() },
  reviewExportService: { exportNotes: jest.fn() },
  audioPipelineService: { generateVoiceTracks: jest.fn() },
  storyAnalysisService: { analyze: jest.fn() },
}));

jest.mock('@tauri-apps/api', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe('ProjectEdit collaboration regression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockLoadProjectFromFile.mockResolvedValue(
      JSON.stringify({
        id: 'p-edit-1',
        name: '编辑测试项目',
        description: 'desc',
        content: '小说内容',
        script: '已有剧本',
        evaluationSummary: {
          consistency: 86,
          pacing: 80,
          readability: 82,
          cost: 78,
          overall: 82,
        },
        storyboardFrames: [
          { id: 'frame-1', title: '镜头1', sceneDescription: '开场', duration: 5 },
        ],
        storyboardComments: [],
        storyboardVersions: [],
        createdAt: '2026-03-08T09:00:00.000Z',
        updatedAt: '2026-03-08T09:00:00.000Z',
      })
    );
  });

  it('adds collaboration data and persists on save', async () => {
    render(<ProjectEdit />);

    fireEvent.click(await screen.findByText('分镜'));
    await screen.findByText('镜头评论');
    const commentInput = await screen.findByPlaceholderText(/添加评论|先选中一个分镜/);
    fireEvent.change(commentInput, { target: { value: '这里建议缩短1秒' } });
    fireEvent.click(screen.getByRole('button', { name: /添\s*加/ }));
    await screen.findByText('这里建议缩短1秒');

    fireEvent.click(screen.getByRole('button', { name: '保存快照' }));

    fireEvent.click(screen.getByRole('button', { name: /保存项目/ }));

    await waitFor(() => {
      expect(mockSaveProjectToFile).toHaveBeenCalled();
    });
    const [, savedText] =
      mockSaveProjectToFile.mock.calls[mockSaveProjectToFile.mock.calls.length - 1];
    const savedPayload = JSON.parse(savedText);
    expect(savedPayload.storyboardComments?.length).toBeGreaterThan(0);
    expect(savedPayload.storyboardVersions?.length).toBeGreaterThan(0);
  });

  it('exports review notes from edit header action', async () => {
    mockInvoke.mockResolvedValueOnce('/tmp/edit-review.md').mockResolvedValueOnce(undefined);

    render(<ProjectEdit />);

    fireEvent.click(await screen.findByRole('button', { name: /导出评审记录/ }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('save_file_dialog', expect.any(Object));
    });
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        'write_text_file',
        expect.objectContaining({
          path: '/tmp/edit-review.md',
        })
      );
    });
    const writeCall = mockInvoke.mock.calls.find((call) => call[0] === 'write_text_file');
    expect(String(writeCall?.[1]?.content ?? '')).toContain('- 综合: 82.0');
    const activities = JSON.parse(localStorage.getItem('kineo_review_export_activities') ?? '[]');
    expect(activities[0]).toMatchObject({
      projectId: 'p-edit-1',
      projectName: '编辑测试项目',
      source: 'project_edit',
      status: 'success',
    });
  });
});
