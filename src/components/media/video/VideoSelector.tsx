import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Upload, Trash2, PlayCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { VideoMetadata } from '@/common/types';
import { formatDurationShort } from '@/common/utils';
import { tauriService } from '@/core/services';
import { logger } from '@/core/utils/logger';

import styles from './VideoSelector.module.less';

// 格式化分辨率
const formatResolution = (width: number, height: number): string => `${width}x${height}`;

interface VideoSelectorProps {
  initialVideoPath?: string;
  onVideoSelect: (filePath: string, metadata?: VideoMetadata) => void;
  onVideoRemove?: () => void;
  loading?: boolean;
}

/**
 * 视频选择器组件
 * 支持选择本地视频文件，并显示视频预览及基本信息
 */
function VideoSelector({
  initialVideoPath,
  onVideoSelect,
  onVideoRemove,
  loading = false,
}: VideoSelectorProps) {
  const [videoPath, setVideoPath] = useState<string | null>(initialVideoPath || null);
  const [videoSrc, setVideoSrc] = useState<string | null>(
    initialVideoPath ? convertFileSrc(initialVideoPath) : null
  );
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  /**
   * 选择视频文件
   */
  const handleSelectVideo = async () => {
    try {
      // 打开文件选择对话框
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: '视频文件',
            extensions: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv'],
          },
        ],
      });

      // 如果用户取消选择，selected将是null
      if (!selected || Array.isArray(selected)) {
        return;
      }

      // 设置视频路径
      const filePath = selected as string;
      setVideoPath(filePath);
      setVideoSrc(convertFileSrc(filePath));

      // 分析视频获取元数据
      setIsAnalyzing(true);
      try {
        const videoMetadata = await tauriService.analyzeVideo(filePath);
        setMetadata(videoMetadata);
        onVideoSelect(filePath, videoMetadata);
      } catch (error) {
        logger.error('分析视频失败:', error);
        // 即使分析失败也允许选择视频
        onVideoSelect(filePath);
      } finally {
        setIsAnalyzing(false);
      }
    } catch (error) {
      logger.error('选择视频失败:', error);
      toast.error('选择视频失败，请重试');
    }
  };

  /**
   * 移除选中的视频
   */
  const handleRemoveVideo = () => {
    setVideoPath(null);
    setVideoSrc(null);
    setMetadata(null);
    if (onVideoRemove) {
      onVideoRemove();
    }
  };

  /**
   * 在默认播放器中播放视频
   */
  const handlePlayVideo = async () => {
    if (!videoPath) return;

    try {
      await invoke('open_file', { path: videoPath });
    } catch (error) {
      logger.error('打开视频失败:', error);
      toast.error('无法打开视频，请确保系统有关联的视频播放器');
    }
  };

  return (
    <div className={styles.videoSelector}>
      <div style={{ position: 'relative' }}>
        {(loading || isAnalyzing) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <span>{isAnalyzing ? '分析视频中...' : '加载中...'}</span>
          </div>
        )}
        {!videoPath ? (
          <div className={styles.uploadArea} onClick={handleSelectVideo}>
            <Upload className={styles.uploadIcon} size={32} />
            <p>点击选择视频文件</p>
            <p className={styles.uploadTip}>支持 MP4, MOV, AVI 等格式</p>
          </div>
        ) : (
          <div className={styles.videoPreviewContainer}>
            <div className={styles.videoPreview}>
              <video src={videoSrc || undefined} controls className={styles.videoPlayer} />
            </div>

            {metadata && (
              <Card className={styles.metadataCard} title="视频信息">
                <p>
                  <strong>文件名:</strong> {videoPath.split('/').pop()}
                </p>
                <p>
                  <strong>时长:</strong> {formatDurationShort(metadata.duration)}
                </p>
                <p>
                  <strong>分辨率:</strong> {formatResolution(metadata.width, metadata.height)}
                </p>
                <p>
                  <strong>帧率:</strong> {metadata.fps} fps
                </p>
                <p>
                  <strong>编码:</strong> {metadata.codec}
                </p>
              </Card>
            )}

            <div className={styles.videoActions}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="outline" icon={<Trash2 size={16} />} onClick={handleRemoveVideo}>
                  移除
                </Button>
                <Button variant="default" icon={<PlayCircle size={16} />} onClick={handlePlayVideo}>
                  在播放器中打开
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoSelector;
