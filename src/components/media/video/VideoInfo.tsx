import { Video, Clock, FileVideo } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { formatDurationShort } from '@/common/utils';

import styles from './VideoInfo.module.less';

interface VideoInfoProps {
  name: string;
  duration: number;
  path: string;
  metadata?: {
    width?: number;
    height?: number;
    fps?: number;
    codec?: string;
  };
}

/**
 * 视频信息展示组件
 */
function VideoInfo({ name, duration, path, metadata }: VideoInfoProps) {
  // 格式化路径，只显示最后的文件名部分
  const formatPath = (path: string): string => {
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1];
  };

  return (
    <Card title="视频信息" className={styles.container}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ minWidth: 160 }}>
          <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>视频名称</div>
          <div style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileVideo size={16} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </span>
          </div>
        </div>

        <div style={{ minWidth: 160 }}>
          <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>时长</div>
          <div style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} />
            {formatDurationShort(duration)}
          </div>
        </div>

        <div style={{ minWidth: 160 }}>
          <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>源文件</div>
          <div style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Video size={16} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {formatPath(path)}
            </span>
          </div>
        </div>

        {metadata && (
          <>
            {metadata.width && metadata.height && (
              <div style={{ minWidth: 160 }}>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>
                  分辨率
                </div>
                <div style={{ fontSize: 16 }}>{`${metadata.width} x ${metadata.height}`}</div>
              </div>
            )}

            {metadata.fps && (
              <div style={{ minWidth: 160 }}>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>帧率</div>
                <div style={{ fontSize: 16 }}>{`${metadata.fps.toFixed(2)} FPS`}</div>
              </div>
            )}

            {metadata.codec && (
              <div style={{ minWidth: 160 }}>
                <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14, marginBottom: 4 }}>编码</div>
                <div style={{ fontSize: 16 }}>{metadata.codec}</div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export default VideoInfo;
