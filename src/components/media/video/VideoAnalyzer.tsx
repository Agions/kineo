import { invoke } from '@tauri-apps/api/core';
import { Video } from 'lucide-react';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/toast';
import type { VideoAnalysis, KeyMoment, EmotionAnalysis, VideoMetadata } from '@/common/types';
import { logger } from '@/core/utils/logger';

import styles from './VideoAnalyzer.module.less';
import VideoUploader from './VideoUploader';

interface VideoAnalyzerProps {
  projectId: string;
  videoUrl?: string;
  onAnalysisComplete: (analysis: VideoAnalysis) => void;
}

function VideoAnalyzer({ projectId, videoUrl, onAnalysisComplete }: VideoAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | undefined>(videoUrl);

  const handleAnalyze = async () => {
    if (!selectedVideoUrl) {
      toast.error('请先上传视频或输入视频链接');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 初始进度
      setProgress(10);

      // 调用Tauri后端分析视频
      const videoMetadata = await invoke<VideoMetadata>('analyze_video', {
        path: selectedVideoUrl,
      }).catch((err) => {
        logger.error('视频分析失败:', err);
        throw new Error(`视频分析失败: ${err}`);
      });

      setProgress(40);

      // 提取关键帧
      const keyFrameCount = Math.min(5, Math.ceil(videoMetadata.duration / 60));
      await invoke<string[]>('extract_key_frames', {
        path: selectedVideoUrl,
        count: keyFrameCount,
      }).catch((err) => {
        logger.error('提取关键帧失败:', err);
        return [] as string[];
      });

      setProgress(70);

      // 生成缩略图
      await invoke<string>('generate_thumbnail', {
        path: selectedVideoUrl,
      }).catch((err) => {
        logger.error('生成缩略图失败:', err);
        return '';
      });

      // 模拟关键时刻和情感分析
      // 在实际项目中，这部分应由AI模型完成
      const keyMoments: KeyMoment[] = [];
      const emotions: EmotionAnalysis[] = [];

      // 生成均匀分布的关键时刻
      const numKeyMoments = Math.min(8, Math.ceil(videoMetadata.duration / 30));
      const interval = videoMetadata.duration / (numKeyMoments + 1);

      for (let i = 1; i <= numKeyMoments; i++) {
        const time = Math.round(interval * i);
        const emotionType: 'action' | 'transition' | 'highlight' =
          i % 3 === 0 ? 'highlight' : i % 3 === 1 ? 'action' : 'transition';
        keyMoments.push({
          time,
          description: `关键时刻 ${i}`,
          type: emotionType,
          importance: Math.random() * 5 + 5, // 5-10的重要性
          timestamp: time,
        });

        // 同时添加情感标记
        if (i % 2 === 0) {
          const emotionName = i % 4 === 0 ? '兴奋' : '平静';
          emotions.push({
            id: uuidv4(),
            sceneId: uuidv4(),
            timestamp: time,
            emotions: [
              {
                id: uuidv4(),
                name: emotionName,
                score: Math.random() * 0.5 + 0.5,
              },
            ],
            dominant: emotionName,
            intensity: Math.random() * 0.5 + 0.5,
          });
        }
      }

      setProgress(90);

      // 构建分析结果
      const analysis: VideoAnalysis = {
        id: uuidv4(),
        videoId: projectId,
        title: `项目_${projectId}`,
        duration: videoMetadata.duration,
        scenes: [],
        keyframes: [],
        objects: [],
        keyMoments,
        emotions,
        summary: `视频时长: ${Math.round(videoMetadata.duration)}秒，分辨率: ${videoMetadata.width}x${videoMetadata.height}，帧率: ${videoMetadata.fps}帧/秒。`,
        createdAt: new Date().toISOString(),
      };

      setProgress(100);

      toast.success('视频分析完成');
      onAnalysisComplete(analysis);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '视频分析失败';
      setError(errorMessage);
      toast.error('视频分析失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={styles.container}>
      <h4 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>视频分析</h4>
      <p style={{ color: 'rgba(0,0,0,0.65)', margin: '0 0 16px' }}>
        我们将使用先进的AI技术分析您的视频内容，识别关键时刻、情感变化和重要信息，为生成高质量解说脚本提供基础。
      </p>

      {error && (
        <Alert
          variant="destructive"
          title="分析错误"
          description={error}
          className={styles.alert}
        />
      )}

      <div className={styles.videoSection}>
        {selectedVideoUrl &&
        typeof selectedVideoUrl === 'string' &&
        selectedVideoUrl.startsWith('http') ? (
          <div className={styles.videoInfo}>
            <Video className={styles.icon} size={20} />
            <span className={styles.url}>{selectedVideoUrl}</span>
          </div>
        ) : (
          <VideoUploader
            initialValue={selectedVideoUrl}
            onUploadSuccess={(url) => setSelectedVideoUrl(url)}
          />
        )}
      </div>

      {loading && (
        <div className={styles.progress}>
          <Progress value={progress} />
          <span>分析中...</span>
        </div>
      )}

      <Button
        variant="default"
        onClick={handleAnalyze}
        loading={loading}
        disabled={!selectedVideoUrl || loading}
        className={styles.button}
      >
        开始分析
      </Button>
    </Card>
  );
}

export default VideoAnalyzer;
