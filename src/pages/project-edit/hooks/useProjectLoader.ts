import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useProjectStore } from '@/stores';
import type { AudioTrackConfig } from '@/core/audio/types/audio';
import type { CompositionProject } from '@/core/audio/types/composition';
import type { ProjectData } from '@/core/project/types/project';
import type { StoryAnalysis, Character } from '@/core/script/types/novel';
import { tauriService } from '@/core/services';
import type { ScriptImportMetadata } from '@/features/storyboard/components/NovelImporter';

/** Page-local extension of canonical ProjectData with strongly-typed fields. */
export interface ProjectEditData extends ProjectData {
  name: string;
  content?: string;
  script?: string;
  novelMetadata?: ScriptImportMetadata;
}

/** 项目加载结果 — 用于初始化 ProjectEditProvider 的 state。 */
export interface ProjectLoadResult {
  name: string;
  description: string;
  content?: string;
  novelMetadata?: ScriptImportMetadata;
  storyAnalysis?: StoryAnalysis;
  storyboardFrames?: unknown[];
  storyboardComments?: unknown[];
  storyboardVersions?: unknown[];
  audioConfig?: AudioTrackConfig;
  characters?: Character[];
  composition?: CompositionProject;
  script?: string;
  exportPreset?: '9:16' | '16:9' | '1:1';
  exportSettings?: Record<string, unknown>;
  cameraDirectingPlans?: Record<string, unknown>;
  spatialMemory?: Record<string, unknown>;
  auditReports?: unknown[];
  subtitles?: unknown[];
  /** 根据 URL 参数或项目数据推断的初始 step */
  initialStep: number;
  /** URL 中的 frameId 参数（如有） */
  frameId?: string;
}

/**
 * 封装项目加载逻辑的 hook。
 * 仅负责读取原始数据 + 解析，返回 ProjectEditData。
 * 初始 state 注入由 ProjectEditProvider 完成。
 */
export function useProjectLoader(projectId: string | undefined): {
  loading: boolean;
  error: string | null;
  data: ProjectLoadResult | null;
} {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProjectLoadResult | null>(null);

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      const loadFromStore = () => {
        const storeState = useProjectStore.getState();
        const fallbackProject =
          storeState.projects.find((p) => String(p.id) === String(projectId)) ||
          storeState.currentProject;

        if (fallbackProject && !cancelled) {
          const search = new URLSearchParams(location.search);
          const frameId = search.get('frameId');
          const stepValue = search.get('step');
          let initialStep = 1;
          if (frameId) {
            initialStep = 1;
          } else if (stepValue) {
            const parsedStep = Number(stepValue);
            if (Number.isInteger(parsedStep) && parsedStep >= 0 && parsedStep <= 3) {
              initialStep = parsedStep;
            }
          }

          const legacyFallback = fallbackProject as unknown as {
            novelText?: string;
            parsedScenes?: unknown[];
          };

          setData({
            name: fallbackProject.name || '未命名漫剧工程',
            description: fallbackProject.description ?? '',
            content: fallbackProject.content || legacyFallback.novelText,
            novelMetadata: fallbackProject.novelMetadata as ScriptImportMetadata | undefined,
            storyAnalysis: fallbackProject.storyAnalysis as StoryAnalysis | undefined,
            storyboardFrames: fallbackProject.storyboardFrames || legacyFallback.parsedScenes,
            storyboardComments: fallbackProject.storyboardComments,
            storyboardVersions: fallbackProject.storyboardVersions,
            audioConfig: fallbackProject.audioConfig,
            characters: fallbackProject.characters,
            composition: fallbackProject.composition,
            script: fallbackProject.script || legacyFallback.novelText,
            exportPreset: (fallbackProject.exportPreset as '9:16' | '16:9' | '1:1') || '16:9',
            exportSettings: fallbackProject.exportSettings,
            cameraDirectingPlans: (fallbackProject as any).cameraDirectingPlans,
            spatialMemory: (fallbackProject as any).spatialMemory,
            auditReports: (fallbackProject as any).auditReports,
            subtitles: (fallbackProject as any).subtitles,
            initialStep,
            frameId: frameId ?? undefined,
          });
          setError(null);
          setLoading(false);
          return true;
        }
        return false;
      };

      // 先打通 Zustand Store 快速路径
      if (loadFromStore()) return;

      setLoading(true);
      tauriService
        .readProjectFile(projectId)
        .then((projectText) => {
          if (cancelled) return;
          const project = JSON.parse(projectText) as ProjectEditData;
          const search = new URLSearchParams(location.search);
          const frameId = search.get('frameId');
          const stepValue = search.get('step');

          let initialStep = 1;
          if (frameId) {
            initialStep = 1;
          } else if (stepValue) {
            const nextStep = Number(stepValue);
            if (Number.isInteger(nextStep) && nextStep >= 0 && nextStep <= 3) {
              initialStep = nextStep;
            }
          }

          setData({
            name: project.name,
            description: project.description ?? '',
            content: project.content,
            novelMetadata: project.novelMetadata,
            storyAnalysis: project.storyAnalysis,
            storyboardFrames: project.storyboardFrames,
            storyboardComments: project.storyboardComments,
            storyboardVersions: project.storyboardVersions,
            audioConfig: project.audioConfig,
            characters: project.characters,
            composition: project.composition,
            script: project.script,
            exportPreset: project.exportPreset,
            exportSettings: project.exportSettings,
            cameraDirectingPlans: (project as any).cameraDirectingPlans,
            spatialMemory: (project as any).spatialMemory,
            auditReports: (project as any).auditReports,
            subtitles: (project as any).subtitles,
            initialStep,
            frameId: frameId ?? undefined,
          });
          setError(null);
        })
        .catch(() => {
          if (cancelled) return;
          if (!loadFromStore()) {
            const search = new URLSearchParams(location.search);
            const stepValue = search.get('step');
            const initialStep = stepValue ? Number(stepValue) : 1;
            setData({
              name: `漫剧工程 (${projectId.slice(0, 8)})`,
              description: '已恢复漫剧工程上下文',
              initialStep: Number.isNaN(initialStep) ? 1 : initialStep,
            });
            setError(null);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [projectId, location.search]);

  return { loading, error, data };
}
