import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import ProjectDetail from '@/pages/project-detail/ProjectDetailPage';
import { useProjectStore } from '@/stores';

const mockNavigate = jest.fn();
const mockUpdateProject = jest.fn();
const mockDeleteProject = jest.fn();
const mockSaveProjectToFile = jest.fn().mockResolvedValue(undefined);
const mockInvoke = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'p-detail-1' }),
}));

jest.mock('@/stores', () => ({
  useProjectStore: jest.fn(),
}));

jest.mock('@/core/services', () => ({
  tauriService: {
    writeText: (...args: unknown[]) => mockSaveProjectToFile(...args),
    readText: jest.fn(),
  },
  aiService: { generate: jest.fn() },
  qualityGateService: {
    evaluate: jest.fn().mockReturnValue({ pass: true, score: 85, issues: [] }),
    checkThresholds: jest.fn(),
  },
  collaborationService: {
    hydrate: jest.fn(),
    listComments: jest.fn().mockReturnValue([]),
    listVersions: jest.fn().mockReturnValue([]),
    addComment: jest.fn(),
    saveVersion: jest.fn(),
    diffVersions: jest.fn(),
    rollback: jest.fn(),
  },
  costService: {
    getBudget: jest.fn(),
    getProjectStats: jest.fn(),
    getRecords: jest.fn().mockReturnValue([]),
  },
  reviewExportService: {
    exportNotes: jest.fn(),
    saveMarkdownToFile: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('@tauri-apps/api', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

jest.mock('@/features/cost/components/CostDashboard', () => () => (
  <div data-testid="mock-cost-dashboard">CostDashboard</div>
));
jest.mock('@/components/ai/ScriptEditor/ScriptEditor', () => () => (
  <div data-testid="mock-script-editor">ScriptEditor</div>
));
jest.mock('@/features/rendering/components/RenderCenter', () => () => (
  <div data-testid="mock-render-center">RenderCenter</div>
));
jest.mock('@/features/character-consistency/index', () => () => (
  <div data-testid="mock-character-designer">CharacterDesigner</div>
));
jest.mock('@/features/composition/components/CompositionStudio', () => () => (
  <div data-testid="mock-composition-studio">CompositionStudio</div>
));
jest.mock('@/features/audio/components/AudioEditor', () => () => (
  <div data-testid="mock-audio-editor">AudioEditor</div>
));

describe('ProjectDetail page collaboration regression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    (useProjectStore as unknown as jest.Mock).mockReturnValue({
      projects: [
        {
          id: 'p-detail-1',
          name: '测试项目',
          description: 'desc',
          content: '小说内容',
          evaluationSummary: {
            consistency: 84,
            pacing: 79,
            readability: 81,
            cost: 77,
            overall: 80,
          },
          scripts: [
            {
              id: 'script-1',
              content: [{ text: '第一幕' }],
              createdAt: '2026-03-08T10:00:00.000Z',
              updatedAt: '2026-03-08T10:00:00.000Z',
            },
          ],
          storyboardFrames: [
            {
              id: 'frame-1',
              title: '镜头1',
              sceneDescription: '开场',
              cameraType: 'wide',
              duration: 5,
            },
          ],
          storyboardComments: [],
          storyboardVersions: [],
          createdAt: '2026-03-08T09:00:00.000Z',
          updatedAt: '2026-03-08T09:00:00.000Z',
        },
      ],
      updateProject: mockUpdateProject,
      deleteProject: mockDeleteProject,
    });
  });

  it('adds storyboard comment and persists project patch', async () => {
    render(<ProjectDetail />);

    fireEvent.click(await screen.findByRole('tab', { name: /分镜/ }));
    const input = await screen.findByPlaceholderText('对 镜头1 添加评论');
    fireEvent.change(input, { target: { value: '节奏可以更快' } });
    fireEvent.click(screen.getByRole('button', { name: /添\s*加/ }));

    await waitFor(() => {
      expect(screen.getByText('节奏可以更快')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockSaveProjectToFile).toHaveBeenCalled();
    });
    const lastCall = mockSaveProjectToFile.mock.calls[mockSaveProjectToFile.mock.calls.length - 1];
    expect(lastCall[0]).toBe('p-detail-1');
    expect(String(lastCall[1])).toContain('storyboardComments');
    expect(mockUpdateProject).toHaveBeenCalled();
  });

  it('saves storyboard version and supports rollback', async () => {
    render(<ProjectDetail />);

    fireEvent.click(await screen.findByRole('tab', { name: /分镜/ }));
    fireEvent.click(await screen.findByRole('button', { name: '保存快照' }));

    await waitFor(() => {
      const hasVersionPersist = mockSaveProjectToFile.mock.calls.some((call) =>
        String(call[1]).includes('storyboardVersions')
      );
      expect(hasVersionPersist).toBe(true);
    });

    fireEvent.click(screen.getByRole('button', { name: '回滚到版本A' }));

    await waitFor(() => {
      const hasFramePersist = mockSaveProjectToFile.mock.calls.some((call) =>
        String(call[1]).includes('storyboardFrames')
      );
      expect(hasFramePersist).toBe(true);
    });
  });

  it('exports review notes from cost quick action', async () => {
    mockInvoke.mockResolvedValueOnce('/tmp/review.md').mockResolvedValueOnce(undefined);

    render(<ProjectDetail />);

    fireEvent.click(await screen.findByRole('tab', { name: /成本/ }));
    const exportButtons = await screen.findAllByRole('button', { name: /导出评审记录/ });
    fireEvent.click(exportButtons[exportButtons.length - 1]);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('save_file_dialog', expect.any(Object));
    });
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        'write_text_file',
        expect.objectContaining({
          path: '/tmp/review.md',
        })
      );
    });
    const writeCall = mockInvoke.mock.calls.find((call) => call[0] === 'write_text_file');
    expect(String(writeCall?.[1]?.content ?? '')).toContain('- 综合: 80.0');
    const activities = JSON.parse(localStorage.getItem('kineo_review_export_activities') ?? '[]');
    expect(activities[0]).toMatchObject({
      projectId: 'p-detail-1',
      projectName: '测试项目',
      source: 'project_detail',
      status: 'success',
    });
  });
});
