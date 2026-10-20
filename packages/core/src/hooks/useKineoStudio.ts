import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DramaProject, Episode } from '../types';

export interface HardwareAccelInfo {
  nvenc: boolean;
  videotoolbox: boolean;
  qsv: boolean;
  active_encoder: string;
}

export function useKineoStudio() {
  const [project, setProject] = useState<DramaProject | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState<HardwareAccelInfo | null>(null);

  const createProject = useCallback(async (name: string, author: string) => {
    try {
      const res = await invoke<DramaProject>('create_new_project', { name, author });
      setProject(res);
      return res;
    } catch (e) {
      console.warn('Fallback to local project creation:', e);
      const fallback: DramaProject = {
        metadata: {
          id: `prj-${Date.now()}`,
          name,
          author,
          version: '0.0.1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          stage: 'Draft',
        },
        episodes: [
          {
            id: 'ep-1',
            order: 1,
            title: '第一集：漫织纪元',
            scenes: [],
          },
        ],
      };
      setProject(fallback);
      return fallback;
    }
  }, []);

  const parseNovelScript = useCallback(
    async (text: string, stylePreset: string = 'modern_anime') => {
      setIsParsing(true);
      try {
        const episodes = await invoke<Episode[]>('execute_advanced_pipeline', {
          text,
          stylePreset,
        });
        setProject((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            episodes,
          };
        });
        return episodes;
      } catch (e) {
        console.warn('Parsing fallback:', e);
        return [];
      } finally {
        setIsParsing(false);
      }
    },
    []
  );

  const checkHardwareAccel = useCallback(async () => {
    try {
      const info = await invoke<HardwareAccelInfo>('detect_hardware_accel');
      setHardwareInfo(info);
      return info;
    } catch (e) {
      console.warn('Hardware detection fallback:', e);
      return null;
    }
  }, []);

  return {
    project,
    isParsing,
    hardwareInfo,
    createProject,
    parseNovelScript,
    checkHardwareAccel,
  };
}
