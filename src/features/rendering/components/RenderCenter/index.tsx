import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { StoryboardFrame } from '@/common/types/storyboard';
import {
  renderQueueService,
  type FrameRenderJob,
  type RenderLog,
} from '@/core/services/project/render-queue-service';

import styles from './index.module.less';

type LogFilter = 'all' | 'info' | 'warning' | 'error';

interface RenderCenterProps {
  frames: StoryboardFrame[];
  projectId?: string;
  onApplyRenderedFrame?: (frameId: string, imageUrl: string) => void;
  onNavigateToExport?: () => void;
}

function RenderCenter({
  frames,
  projectId,
  onApplyRenderedFrame,
  onNavigateToExport,
}: RenderCenterProps) {
  const [jobs, setJobs] = useState<FrameRenderJob[]>([]);
  const [logs, setLogs] = useState<RenderLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [logFilter, setLogFilter] = useState<LogFilter>('all');
  const appliedFrameIds = useRef<Set<string>>(new Set());
  const onApplyRef = useRef(onApplyRenderedFrame);
  onApplyRef.current = onApplyRenderedFrame;

  useEffect(() => {
    return renderQueueService.subscribe((state) => {
      setJobs(state.jobs);
      setLogs(state.logs);
      setIsRunning(state.isRunning);
      setIsPaused(state.isPaused);

      const callback = onApplyRef.current;
      if (callback) {
        for (const job of state.jobs) {
          if (
            job.status === 'completed' &&
            job.imageUrl &&
            !appliedFrameIds.current.has(job.frameId)
          ) {
            appliedFrameIds.current.add(job.frameId);
            callback(job.frameId, job.imageUrl);
          }
        }
      }
    });
  }, []);

  const filteredLogs = useMemo(
    () => logs.filter((log) => logFilter === 'all' || log.level === logFilter),
    [logs, logFilter]
  );

  const pendingCount = jobs.filter((job) => job.status === 'pending').length;
  const runningCount = jobs.filter((job) => job.status === 'running').length;
  const completedCount = jobs.filter((job) => job.status === 'completed').length;

  const enqueueFrames = () => {
    if (frames.length === 0) return;

    const renderedFrameIds = new Set(jobs.map((job) => job.frameId));
    const candidates = frames.filter((frame) => !renderedFrameIds.has(frame.id));

    if (candidates.length === 0) return;

    renderQueueService.enqueue(
      candidates.map((frame) => ({
        frameId: frame.id,
        frameTitle: frame.title,
        prompt: [
          frame.title,
          frame.sceneDescription,
          `构图：${frame.composition}`,
          `镜头：${frame.cameraType}`,
          frame.dialogue ? `对白：${frame.dialogue}` : '',
        ]
          .filter(Boolean)
          .join('，'),
        model: 'seedream-5.0',
        maxRetries: 1,
        projectId,
      }))
    );
  };

  const colorMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    running: 'outline',
    completed: 'default',
    failed: 'destructive',
  };

  const logColorMap: Record<string, 'default' | 'destructive' | 'outline'> = {
    info: 'default',
    warning: 'outline',
    error: 'destructive',
  };

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle>渲染队列</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.stats}>
            <span>待处理: {pendingCount}</span>
            <span>进行中: {runningCount}</span>
            <span>已完成: {completedCount}</span>
          </div>

          <div className={styles.actions}>
            <Button
              onClick={enqueueFrames}
              disabled={frames.length === 0}
              size="sm"
              variant="outline"
            >
              加入分镜
            </Button>
            {!isPaused ? (
              <Button
                onClick={() => renderQueueService.pause()}
                disabled={!isRunning}
                size="sm"
                variant="outline"
              >
                暂停
              </Button>
            ) : (
              <Button onClick={() => renderQueueService.resume()} size="sm" variant="outline">
                继续
              </Button>
            )}
            <Button
              onClick={() => void renderQueueService.run()}
              disabled={isRunning || pendingCount === 0}
              size="sm"
            >
              开始渲染
            </Button>
            <Button onClick={() => renderQueueService.clearFinal()} size="sm" variant="outline">
              清理已完成
            </Button>
            {onNavigateToExport && (
              <Button
                onClick={onNavigateToExport}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium ml-auto"
              >
                🎬 前往 4K 完工导出
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>分镜</TableHead>
                <TableHead style={{ width: 120 }}>状态</TableHead>
                <TableHead style={{ width: 180 }}>进度</TableHead>
                <TableHead style={{ width: 120 }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} style={{ textAlign: 'center' }}>
                    暂无渲染任务
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.frameTitle}</TableCell>
                    <TableCell>
                      <Badge variant={colorMap[job.status] || 'outline'}>{job.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Progress value={job.progress} />
                    </TableCell>
                    <TableCell>
                      {job.error && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => renderQueueService.retry(job.id)}
                        >
                          重试
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>渲染日志</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.logFilter}>
            <Select value={logFilter} onValueChange={(value: LogFilter) => setLogFilter(value)}>
              <SelectTrigger style={{ width: 140 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="info">信息</SelectItem>
                <SelectItem value="warning">警告</SelectItem>
                <SelectItem value="error">错误</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={styles.logList}>
            {filteredLogs.length === 0 ? (
              <div className={styles.emptyLogs}>暂无日志</div>
            ) : (
              filteredLogs.map((item, index) => (
                <div key={index} className={styles.logItem}>
                  <Badge variant={logColorMap[item.level] || 'outline'}>{item.level}</Badge>
                  <span>{item.message}</span>
                  <span className={styles.logTime}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RenderCenter;
