import { FileDown, Copy, FileText, Clock, ListOrdered, Calendar } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Script } from '@/common/types';
import { formatTime } from '@/common/utils';
import { logger } from '@/core/utils/logger';

import styles from './ScriptPreview.module.less';

interface ScriptPreviewProps {
  script: Script;
  onEdit: () => void;
  onExport: () => void;
}

function ScriptPreview({ script, onEdit, onExport }: ScriptPreviewProps) {
  const [_copying, setCopying] = useState(false);

  const copyToClipboard = () => {
    setCopying(true);
    const text = script.segments
      .map(
        (segment) =>
          `[${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}] ${segment.content}`
      )
      .join('\n\n');

    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('脚本已复制到剪贴板');
        setCopying(false);
      },
      (err) => {
        logger.error('复制失败:', err);
        toast.error('复制失败，请重试');
        setCopying(false);
      }
    );
  };

  const totalDuration = script.segments.reduce(
    (acc, segment) => acc + (segment.endTime - segment.startTime),
    0
  );

  const getSegmentTypeInfo = (type: string) => {
    switch (type) {
      case 'narration':
        return { color: 'default', text: '旁白' };
      case 'dialogue':
        return { color: 'default', text: '对话' };
      default:
        return { color: 'secondary', text: '描述' };
    }
  };

  return (
    <Card className={styles.container}>
      <CardHeader>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>脚本预览</h3>
            <div className={styles.meta}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={styles.metaTag}>
                    <Clock /> {Math.round(totalDuration / 60)} 分钟
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>总时长</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={styles.metaTag}>
                    <ListOrdered /> {script.segments.length} 段
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>段落数</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={styles.metaTag}>
                    <Calendar /> {new Date(script.createdAt).toLocaleDateString()}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>创建时间</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className={styles.actions}>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className={styles.actionButton}
            >
              <Copy /> 复制全文
            </Button>
            <Button variant="outline" size="sm" onClick={onExport} className={styles.actionButton}>
              <FileDown /> 导出 PDF
            </Button>
            <Button
              size="sm"
              onClick={onEdit}
              className={`${styles.actionButton} ${styles.editButton}`}
            >
              <FileText /> 编辑脚本
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className={styles.scriptContent}>
          {script.segments.map((segment, index) => {
            const typeInfo = getSegmentTypeInfo(segment.type);
            return (
              <div key={segment.id} className={styles.segment}>
                <div className={styles.segmentHeader}>
                  <span className={styles.timeCode}>
                    {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                  </span>
                  <Badge variant="outline">{typeInfo.text}</Badge>
                </div>
                <p className={styles.content}>{segment.content}</p>
                {index < script.segments.length - 1 && <div className={styles.divider} />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default ScriptPreview;
