/**
 * 视频处理 Hook
 * 统一的视频上传、分析和处理
 */

import { useReducer, useCallback, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { VideoInfo, VideoAnalysis, TaskStatus, VideoScene, Keyframe } from '@/core/types';
import { formatDurationShort } from '@/core/utils';
import { delay } from '@/core/utils/timing';
import { captureVideoFrameAsDataURL } from '@/core/utils/video-thumbnail';

import { videoReducer, initialVideoState, createVideoSetters } from './useVideoReducer';

export interface UseVideoReturn {
  // 视频信息
  video: VideoInfo | null;
  analysis: VideoAnalysis | null;

  // 上传状态
  isUploading: boolean;
  uploadProgress: number;

  // 分析状态
  isAnalyzing: boolean;
  analysisProgress: number;

  // 任务状态
  taskStatus: TaskStatus | null;

  // 操作方法
  uploadVideo: (file: File) => Promise<VideoInfo | null>;
  analyzeVideo: (videoId: string) => Promise<VideoAnalysis | null>;
  cancelAnalysis: () => void;
  extractThumbnail: (timestamp: number) => Promise<string | null>;
  extractKeyframes: (interval?: number) => Promise<string[]>;

  // 状态
  error: string | null;
  isLoading: boolean;
}

// 支持的格式
const SUPPORTED_FORMATS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'];
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

// 获取视频信息
const getVideoInfo = (file: File): Promise<VideoInfo> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      // Don't revoke the URL here — it is returned as VideoInfo.path and must remain valid
      // for the caller to use. Revoke only on error or when the caller is done.
      const info: VideoInfo = {
        id: uuidv4(),
        path: url,
        name: file.name,
        size: file.size,
        format: file.name.split('.').pop()?.toLowerCase() || 'mp4',
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        fps: 30,
        createdAt: new Date().toISOString(),
      };
      resolve(info);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法读取视频文件'));
    };

    video.src = url;
  });
};

export function useVideo(): UseVideoReturn {
  // ── 8 useState 已迁移到 useReducer 状态机 (2026-06-11) ──
  // 死代码清理: 原 L121 isLoading setter 从未使用, 已删除.
  const [state, dispatch] = useReducer(videoReducer, initialVideoState);
  const setters = useMemo(() => createVideoSetters(dispatch), [dispatch]);
  const {
    setVideo,
    setAnalysis,
    setIsUploading,
    setUploadProgress,
    setIsAnalyzing,
    setAnalysisProgress,
    setTaskStatus,
    setError,
  } = setters;

  const {
    video,
    analysis,
    isUploading,
    uploadProgress,
    isAnalyzing,
    analysisProgress,
    taskStatus,
    error,
    isLoading,
  } = state;

  const abortControllerRef = useRef<AbortController | null>(null);

  // 上传视频
  const uploadVideo = useCallback(async (file: File): Promise<VideoInfo | null> => {
    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 验证文件类型
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !SUPPORTED_FORMATS.includes(ext)) {
        throw new Error(`不支持的格式: ${ext}。请使用: ${SUPPORTED_FORMATS.join(', ')}`);
      }

      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`文件过大: ${(file.size / 1024 / 1024).toFixed(0)}MB。最大支持 2GB`);
      }

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      try {
        // 获取视频信息
        const info = await getVideoInfo(file);

        // 生成缩略图
        if (info.path) {
          const thumbnail = await captureVideoFrameAsDataURL(info.path);
          info.thumbnail = thumbnail;
        }

        clearInterval(progressInterval);
        setUploadProgress(100);
        setVideo(info);

        return info;
      } catch (err) {
        clearInterval(progressInterval);
        throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [setError, setIsUploading, setUploadProgress, setVideo]);

  // 分析视频
  const analyzeVideo = useCallback(
    async (videoId: string): Promise<VideoAnalysis | null> => {
      if (!video) return null;

      setError(null);
      setIsAnalyzing(true);
      setAnalysisProgress(0);

      // 创建任务状态
      const task: TaskStatus = {
        id: uuidv4(),
        type: 'analysis',
        status: 'running',
        progress: 0,
        message: '开始分析视频...',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTaskStatus(task);

      try {
        // 模拟分析过程
        const steps = [
          { progress: 10, message: '提取关键帧...', delay: 1000 },
          { progress: 30, message: '场景检测...', delay: 2000 },
          { progress: 50, message: '对象识别...', delay: 2000 },
          { progress: 70, message: '情感分析...', delay: 1500 },
          { progress: 90, message: '生成摘要...', delay: 1000 },
        ];

        for (const step of steps) {
          await delay(step.delay);
          setAnalysisProgress(step.progress);
          setTaskStatus((prev) =>
            prev
              ? {
                  ...prev,
                  progress: step.progress,
                  message: step.message,
                  updatedAt: new Date().toISOString(),
                }
              : null
          );
        }

        // 生成模拟分析结果
        const analysisResult: VideoAnalysis = {
          id: uuidv4(),
          videoId,
          scenes: generateMockScenes(video.duration ?? 0),
          keyframes: generateMockKeyframes(video.duration ?? 0),
          objects: [],
          emotions: [],
          summary: `视频时长 ${formatDurationShort(video.duration ?? 0)}，分辨率 ${video.width ?? 0}x${video.height ?? 0}，包含 ${Math.floor((video.duration ?? 0) / 30)} 个场景。`,
          createdAt: new Date().toISOString(),
        };

        setAnalysisProgress(100);
        setAnalysis(analysisResult);
        setTaskStatus((prev) =>
          prev
            ? {
                ...prev,
                status: 'completed',
                progress: 100,
                message: '分析完成',
                completedAt: new Date().toISOString(),
              }
            : null
        );

        return analysisResult;
      } catch (err) {
        setError(err instanceof Error ? err.message : '分析失败');
        setTaskStatus((prev) =>
          prev
            ? {
                ...prev,
                status: 'failed',
                error: err instanceof Error ? err.message : '分析失败',
              }
            : null
        );
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [video, setError, setIsAnalyzing, setAnalysisProgress, setTaskStatus, setAnalysis]
  );

  // 取消分析
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
    setTaskStatus((prev) =>
      prev ? { ...prev, status: 'cancelled' as const, message: '已取消' } : null
    );
  }, [setIsAnalyzing, setTaskStatus]);

  // 提取缩略图
  const extractThumbnail = useCallback(
    async (timestamp: number): Promise<string | null> => {
      if (!video) return null;

      try {
        return await captureVideoFrameAsDataURL(video.path!, timestamp);
      } catch {
        setError('提取缩略图失败');
        return null;
      }
    },
    [video, setError]
  );

  // 提取关键帧
  const extractKeyframes = useCallback(
    async (interval: number = 5): Promise<string[]> => {
      if (!video) return [];

      const keyframes: string[] = [];
      const count = Math.floor(video.duration! / interval);

      for (let i = 0; i < count; i++) {
        const timestamp = i * interval;
        const thumbnail = await extractThumbnail(timestamp);
        if (thumbnail) {
          keyframes.push(thumbnail);
        }
      }

      return keyframes;
    },
    [video, extractThumbnail]
  );

  return {
    video,
    analysis,
    isUploading,
    uploadProgress,
    isAnalyzing,
    analysisProgress,
    taskStatus,
    uploadVideo,
    analyzeVideo,
    cancelAnalysis,
    extractThumbnail,
    extractKeyframes,
    error,
    isLoading,
  };
}

// 辅助函数
function generateMockScenes(duration: number): VideoScene[] {
  const scenes: VideoScene[] = [];
  const sceneCount = Math.floor(duration / 30);

  for (let i = 0; i < sceneCount; i++) {
    scenes.push({
      id: uuidv4(),
      startTime: i * 30,
      endTime: Math.min((i + 1) * 30, duration),
      thumbnail: '',
      description: `场景 ${i + 1}`,
      tags: ['场景', `片段${i + 1}`],
    });
  }

  return scenes;
}

function generateMockKeyframes(duration: number): Keyframe[] {
  const keyframes: Keyframe[] = [];
  const count = Math.floor(duration / 5);

  for (let i = 0; i < count; i++) {
    keyframes.push({
      id: uuidv4(),
      timestamp: i * 5,
      thumbnail: '',
      description: `关键帧 ${i + 1}`,
    });
  }

  return keyframes;
}
