/**
 * ProjectDetail 页面 - Presenter 层
 * 项目详情/管理页面，包含小说/剧本/分镜/角色/渲染/合成/配音/成本/导出等功能
 */
import {
  ArrowLeft,
  Edit,
  Trash2,
} from 'lucide-react';
import React, { Suspense, lazy, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import Empty from '@/components/ui/empty';
import { Spin } from '@/components/ui/spin';
import { Tabs, TabPane } from '@/components/ui/tabs';
import type { VideoSegment } from '@/common/types/script';
import { AudioEditorPanel } from '@/components/media/audio/AudioEditorPanel';
import { ExportPanel } from '@/components/project/ExportPanel';

import { useProjectDetail } from './hooks/useProjectDetail';

const importScriptEditor = () => import('@/features/storyboard/components/ScriptEditor');
const importRenderCenter = () => import('@/features/rendering/components/RenderCenter');
const importCharacterDesigner = () =>
  import('@/features/character-consistency/components/CharacterDesigner');
const importCompositionStudio = () => import('@/features/composition/components/CompositionStudio');

const ScriptEditor = lazy(importScriptEditor);
const RenderCenter = lazy(importRenderCenter);
const CharacterDesigner = lazy(importCharacterDesigner);
const CompositionStudio = lazy(importCompositionStudio);

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    loading,
    project,
    activeScript,
    activeTab,
    storyboardFrames,
    exportQualityGate,
    setActiveTab,
    handleApplyRenderedFrame,
    handleScriptChange,
    handleDeleteProject,
    persistProjectPatch,
    preloadTabModules,
  } = useProjectDetail({ projectId: id ?? '' });

  useEffect(() => {
    preloadTabModules(activeTab);
  }, [preloadTabModules, activeTab]);

  const handleEditClick = () => navigate(`/project/edit/${id}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--muted-foreground)]">
        <Spin size="large" tip="正在加载 Kineo 漫剧工程大厅..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[var(--card)] border border-[var(--border)] max-w-lg mx-auto my-12 space-y-4">
        <Empty description="未找到指定的漫剧工程数据" />
        <Button onClick={() => navigate('/')}>返回首页工作台</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 Top Toolbar */}
      <div className="flex items-center justify-between p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] backdrop-blur-2xl shadow-xl flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">{project.name}</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {project.description || 'Kineo 4K 漫剧视听项目'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleEditClick}
            className="bg-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/80 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            编辑工程
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteProject}>
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            删除
          </Button>
        </div>
      </div>

      {/* 选项卡面板大厅 */}
      <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] backdrop-blur-2xl shadow-xl">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="剧本拆解与分镜" key="novel">
            <Suspense fallback={<Spin tip="正在载入剧本编辑器..." />}>
              <ScriptEditor
                segments={(activeScript?.segments as unknown as VideoSegment[]) || []}
                onSegmentsChange={(segs) => handleScriptChange(segs as any)}
              />
            </Suspense>
          </TabPane>

          <TabPane tab="角色一致性设计" key="character">
            <Suspense fallback={<Spin tip="正在载入角色设计器..." />}>
              <CharacterDesigner
                characters={(activeScript as any)?.characters || []}
                onChange={(chars) => {
                  if (activeScript) {
                    handleScriptChange({ ...activeScript, characters: chars } as any);
                  }
                }}
              />
            </Suspense>
          </TabPane>

          <TabPane tab="画面与场景渲染" key="render">
            <Suspense fallback={<Spin tip="正在载入 4K 渲染中心..." />}>
              <RenderCenter
                frames={storyboardFrames}
                projectId={id}
                onApplyRenderedFrame={handleApplyRenderedFrame}
                onNavigateToExport={() => setActiveTab('export')}
              />
            </Suspense>
          </TabPane>

          <TabPane tab="视听极速合成" key="composition">
            <Suspense fallback={<Spin tip="正在载入合成大厅..." />}>
              <CompositionStudio frames={storyboardFrames} />
            </Suspense>
          </TabPane>

          <TabPane tab="配音与音效" key="audio">
            <AudioEditorPanel project={project} onPersistPatch={persistProjectPatch} />
          </TabPane>

          <TabPane tab="4K 完工导出" key="export">
            <ExportPanel
              projectId={id ?? ''}
              project={project}
              qualityGate={exportQualityGate}
              onNavigateToEdit={handleEditClick}
            />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectDetail;
