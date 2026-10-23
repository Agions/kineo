import React from 'react';
import { render, screen } from '@testing-library/react';
import { EpisodeBatchStudio } from '@/features/episode/components/EpisodeBatchStudio';
import type { ProjectData } from '@/core/project/types/project';

jest.mock('@/components/ui/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

describe('EpisodeBatchStudio Component Test', () => {
  const mockProject: ProjectData = {
    id: 'test_project_episodes',
    name: '天王修罗传',
    content: `
林澈手握长剑，剑气纵横，雷电交织！
“苏晴快走，这里由我来挡！”林澈怒吼。
四面杀手疯狂扑杀而来，刀光剑影撕裂天穹。
林澈一剑斩落三名杀手首领。
黑衣人冷笑：“你逃不掉的，全城已被封锁。”
林澈冷笑，绝境爆发，雷霆战意冲天而起！
“那就以命相搏，杀出一条生路！”
利刃刺入肩膀，林澈强忍剧痛反手击毙敌酋。
天际警报尖鸣，数十台神级装甲轰然降临，死局降临！
林澈命悬一线，缓缓倒在血泊之中……
    `,
    characters: [
      { id: 'c1', name: '林澈', role: 'protagonist', gender: 'male' },
      { id: 'c2', name: '苏晴', role: 'supporting', gender: 'female' },
    ] as any,
  };

  it('应成功渲染多集连载工作台并展示各集卡片', () => {
    render(<EpisodeBatchStudio project={mockProject} />);

    expect(screen.getByText(/漫剧多集短剧连载工作台/i)).toBeInTheDocument();
    expect(screen.getByText(/连载总集数/i)).toBeInTheDocument();
    expect(screen.getAllByText(/第 1 集/i).length).toBeGreaterThan(0);
  });

  it('应正确展示黄金3秒开篇与尾镜卡点徽章', () => {
    render(<EpisodeBatchStudio project={mockProject} />);

    expect(screen.getAllByText(/黄金3秒/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/尾镜卡点/i).length).toBeGreaterThan(0);
  });
});
