import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { useEffect, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmptyState, Skeleton } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { useProjectStore } from '@/stores';
import type { ProjectData } from '@/common/types';
import { formatDate } from '@/common/utils/format-ui';
import { logger } from '@/core/utils/logger';

/**
 * 项目列表视图组件
 * 展示所有项目的列表视图
 */

interface ProjectCardProps {
  project: ProjectData;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (project: ProjectData) => void;
}

const ProjectCard = memo(function ProjectCard({
  project,
  onOpen,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  return (
    <Card
      key={project.id}
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onOpen(project.id)}
    >
      {project.thumbnail ? (
        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
          <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-32 bg-muted rounded-t-lg flex items-center justify-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <CardContent className="pt-4">
        <h3 className="font-medium truncate mb-1">{project.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {project.description || '暂无描述'}
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          创建于: {formatDate(project.createdAt)}
        </p>
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="h-4 w-4" />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(project.id);
            }}
          >
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="h-4 w-4 text-destructive" />}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project);
            }}
          >
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

function ProjectListView() {
  const navigate = useNavigate();
  const { projects, deleteProject } = useProjectStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateProject = useCallback(() => {
    void navigate('/project/new');
  }, [navigate]);

  const handleEditProject = useCallback(
    (id: string) => {
      void navigate(`/project/${id}/edit`);
    },
    [navigate]
  );

  const handleOpenProject = useCallback(
    (id: string) => {
      void navigate(`/editor/${id}`);
    },
    [navigate]
  );

  const handleDeleteProject = useCallback(
    (project: ProjectData) => {
      try {
        deleteProject(project.id);
        toast.success(`项目 "${project.name}" 已删除`);
      } catch (error) {
        logger.error('删除项目失败', error);
        toast.error('删除失败');
      }
    },
    [deleteProject]
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">我的项目</h2>
          <Button
            variant="default"
            icon={<Plus className="h-4 w-4" />}
            onClick={handleCreateProject}
          >
            新建项目
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={`skeleton-${i}`} className="p-4">
              <Skeleton className="h-32 w-full rounded-md mb-3" />
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">我的项目</h2>
        <Button variant="default" icon={<Plus className="h-4 w-4" />} onClick={handleCreateProject}>
          新建项目
        </Button>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={handleOpenProject}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="暂无项目"
          description="点击「新建项目」开始创作您的第一个漫剧项目"
          action={{ text: '新建项目', onClick: handleCreateProject }}
        />
      )}
    </div>
  );
}

export default ProjectListView;
