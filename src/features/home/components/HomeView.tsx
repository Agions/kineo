import React from 'react';

import { useProjectStore } from '@/stores';

import HeroSection from './HeroSection';
import styles from './Home.module.less';
import ProjectGrid from './ProjectGrid';

/**
 * 首页视图组件 — 极简 Linear Studio 商业级版 (彻底移除冗余 StatsCards 与 底部系统诊断 Bar)
 */
const HomeView = () => {
  const store = useProjectStore();

  const handleProjectRefresh = () => {
    // 项目数据由 store 自动同步
  };

  const projects =
    typeof store?.recentProjects === 'function' ? store.recentProjects() : store?.projects || [];

  return (
    <div className={`${styles.container} space-y-6`}>
      {/* 漫剧创作车间 Hero 头部区 */}
      <HeroSection />

      {/* 漫剧工程画廊网格 (与 Gemini 最新设计稿 100% 对齐) */}
      <ProjectGrid projects={projects} loading={false} onRefresh={handleProjectRefresh} />
    </div>
  );
};

export default HomeView;
