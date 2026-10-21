import {
  Plus,
  Edit3,
  Trash2,
  Play,
  ImageIcon,
  FolderOpen,
  Search,
} from 'lucide-react';
import React, { useCallback, memo, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import CreateProjectModal from '@/common/components/project/CreateProjectModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { useProjectStore } from '@/stores';
import type { ProjectData } from '@/common/types';

interface ProjectGridProps {
  projects: ProjectData[];
  loading: boolean;
  onRefresh?: () => void;
}

interface ProjectCardProps {
  project: ProjectData;
  onView: (id: string) => void;
  onEdit: (id: string, e: React.MouseEvent) => void;
  onOpenWorkflow: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const ProjectCard = memo(function ProjectCard({
  project,
  onView,
  onEdit,
  onOpenWorkflow,
  onDelete,
}: ProjectCardProps) {
  return (
    <div
      key={project.id}
      onClick={() => onView(project.id)}
      className="studio-card group relative cursor-pointer overflow-hidden p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between space-y-3 shadow-lg hover:shadow-2xl hover:-translate-y-1"
    >
      {/* 16:9 视听缩略图预览 */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[var(--accent)] border border-[var(--border)] flex items-center justify-center shadow-inner">
        {project.thumbnail ? (
          <img
            alt={project.name}
            src={project.thumbnail}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-[var(--muted-foreground)]">
            <ImageIcon className="w-8 h-8 opacity-40 stroke-1 text-indigo-400" />
            <span className="text-[10px] font-mono tracking-widest">4K 漫剧画布</span>
          </div>
        )}

        {/* 悬浮中央发光 Play 按钮 */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px] shadow-lg shadow-indigo-500/40 group-hover:scale-110 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
              <Play className="w-5 h-5 text-indigo-400 fill-current ml-0.5" />
            </div>
          </div>
        </div>

        {/* 快捷悬浮栏 */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => onEdit(project.id, e)}
            className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white hover:bg-indigo-600 transition-colors cursor-pointer"
            title="编辑工程"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => onDelete(project.id, e)}
            className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
            title="删除工程"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 标题、元数据与快捷按钮 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-[var(--foreground)] group-hover:text-indigo-400 transition-colors truncate">
            {project.name}
          </h4>
          <span className="text-[10px] font-mono font-bold text-indigo-400">100% 就绪</span>
        </div>

        <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">
          {project.description || '全流程 AI 漫剧工程 · 支持 4K GPU 硬件压制'}
        </p>

        {/* 纯中文元数据标签组 */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="px-2 py-0.5 rounded-md bg-[var(--accent)] border border-[var(--border)] text-[10px] font-mono font-semibold text-[var(--muted-foreground)]">
            4K 超清
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[var(--accent)] border border-[var(--border)] text-[10px] font-mono font-semibold text-[var(--muted-foreground)]">
            16:9
          </span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono font-bold text-indigo-400">
            {project.status === 'completed' ? '已就绪' : '创作中'}
          </span>
        </div>

        {/* 快捷操作按钮组 */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[var(--border)] text-center">
          <button
            onClick={(e) => onOpenWorkflow(project.id, e)}
            className="px-2 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 text-[11px] font-bold transition-all cursor-pointer"
          >
            继续创作
          </button>
          <button
            onClick={(e) => onEdit(project.id, e)}
            className="px-2 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)] text-[11px] font-medium transition-all cursor-pointer"
          >
            工程编辑
          </button>
          <button
            onClick={() => onView(project.id)}
            className="px-2 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--border)] text-[var(--foreground)] border border-[var(--border)] text-[11px] font-medium transition-all cursor-pointer"
          >
            预览画幅
          </button>
        </div>
      </div>
    </div>
  );
});

function ProjectGrid({ projects, loading, onRefresh }: ProjectGridProps) {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter] = useState<'all' | 'processing' | 'completed'>('all');

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [projects, searchQuery, activeFilter]);

  const handleCreateProject = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleViewProject = useCallback(
    (id: string) => {
      const store = useProjectStore.getState();
      const targetProj = store.projects.find((p) => p.id === id);
      if (targetProj && typeof store.setCurrentProject === 'function') {
        store.setCurrentProject(targetProj);
      }
      void navigate(`/project/${id}`);
    },
    [navigate]
  );

  const handleEditProject = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const store = useProjectStore.getState();
      const targetProj = store.projects.find((p) => p.id === id);
      if (targetProj && typeof store.setCurrentProject === 'function') {
        store.setCurrentProject(targetProj);
      }
      void navigate(`/project/edit/${id}`);
    },
    [navigate]
  );

  const handleOpenWorkflow = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const store = useProjectStore.getState();
      const targetProj = store.projects.find((p) => p.id === id);
      if (targetProj && typeof store.setCurrentProject === 'function') {
        store.setCurrentProject(targetProj);
      }
      void navigate(`/workflow`, { state: { projectId: id } });
    },
    [navigate]
  );

  const handleDeleteProject = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const store = useProjectStore.getState();
        if (typeof store.deleteProject === 'function') {
          store.deleteProject(id);
        }
        toast.success('已成功删除漫剧工程！');
        onRefresh?.();
      } catch (err) {
        console.error('Delete project failed:', err);
      }
    },
    [onRefresh]
  );

  return (
    <div className="space-y-6">
      {/* 网格 Header 与 搜索过滤栏 */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-[var(--border)]">
        <div>
          <h3 className="text-base font-extrabold text-[var(--foreground)] flex items-center gap-2">
            我的漫剧工程大厅
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono font-bold">
              {projects.length} 部工程
            </span>
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            实时管理所有漫剧视听工程，快速进入 6 步 SOP 车间
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索漫剧工程名称..."
              className="pl-8 text-xs bg-[var(--accent)] border-[var(--border)] text-[var(--foreground)] rounded-xl py-1.5 h-8"
            />
          </div>

          <Button
            size="sm"
            onClick={handleCreateProject}
            className="studio-btn-primary px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer rounded-xl border-0 shadow-md shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            新建漫剧工程
          </Button>
        </div>
      </div>

      {/* 漫剧工程网格区 */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--muted-foreground)]">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
          正在加载工程列表中...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="studio-card border border-[var(--border)] bg-[var(--card)] flex flex-col items-center justify-center py-16 text-center p-8 rounded-3xl space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/20">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-[var(--foreground)]">
              {searchQuery ? '未找到匹配的漫剧工程' : '暂无漫剧创作工程'}
            </h4>
            <p className="text-xs text-[var(--muted-foreground)] max-w-md leading-relaxed">
              {searchQuery
                ? '尝试更换搜索关键词，或新建一个漫剧工程。'
                : '点击下方按钮开启全新的 AI 漫剧工程，导入小说剧本文本即可开始自动化生成。'}
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleCreateProject}
            className="studio-btn-primary px-6 py-2.5 text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            创建漫剧工程
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onView={handleViewProject}
              onEdit={handleEditProject}
              onOpenWorkflow={handleOpenWorkflow}
              onDelete={handleDeleteProject}
            />
          ))}

          {/* 新建工程 Card */}
          <div
            onClick={handleCreateProject}
            className="studio-card group cursor-pointer p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[240px] border border-dashed border-indigo-500/30 hover:border-indigo-500 bg-[var(--card)] hover:bg-[var(--accent)] transition-all rounded-2xl hover:scale-105"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-indigo-400 transition-colors">
              新建漫剧工程
            </span>
          </div>
        </div>
      )}

      {/* 新建工程 Modal */}
      <CreateProjectModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </div>
  );
}

export default ProjectGrid;
