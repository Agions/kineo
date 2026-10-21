import { Plus, Trash2, ZoomIn, ZoomOut, Columns, ChevronsRight } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { formatTime } from '@/common/utils';

import styles from './Timeline.module.less';

// 时间轴片段类型
export interface TimelineClip {
  id: string;
  startTime: number;
  endTime: number;
  type: 'video' | 'audio' | 'text';
  content?: string;
}

interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  clips: TimelineClip[];
}

interface TimelineProps {
  currentTime: number;
  duration: number;
  tracks: Track[];
  onTimeUpdate: (time: number) => void;
}

function Timeline({ currentTime, duration, tracks, onTimeUpdate }: TimelineProps) {
  const [scale, setScale] = useState(100); // 时间轴缩放比例
  const [trackList, setTrackList] = useState<Track[]>(tracks || []);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  // Store document-level event handlers in a ref so cleanup useEffect can remove them
  const handlersRef = useRef<{ move: ((e: MouseEvent) => void) | null; up: (() => void) | null }>({
    move: null,
    up: null,
  });
  const [showTimeline, setShowTimeline] = useState<boolean>(true);

  // Clean up document event listeners on unmount (prevents memory leaks if unmounted mid-drag)
  useEffect(() => {
    const handlers = handlersRef;
    return () => {
      if (handlers.current.move)
        document.removeEventListener('mousemove', handlers.current.move);
      if (handlers.current.up) document.removeEventListener('mouseup', handlers.current.up);
    };
  }, []);

  // 计算时间轴宽度
  const timelineWidth = Math.max(2000, duration * scale); // 每秒100px

  // 计算播放头位置
  const playheadPosition = currentTime * scale;

  // 更新播放头位置
  useEffect(() => {
    if (playheadRef.current) {
      playheadRef.current.style.left = `${playheadPosition}px`;
    }

    // 自动滚动时间轴,确保播放头可见
    if (tracksContainerRef.current) {
      const container = tracksContainerRef.current;
      const playheadX = playheadPosition;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;

      // 如果播放头不在可视区域内,滚动到适当位置
      if (playheadX < scrollLeft || playheadX > scrollLeft + containerWidth - 50) {
        container.scrollLeft = playheadX - containerWidth / 2;
      }
    }
  }, [playheadPosition]);

  // 处理时间轴点击,跳转到指定时间
  const handleTimelineClick = (
    e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (tracksContainerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = 'clientX' in e ? e.clientX - rect.left + tracksContainerRef.current.scrollLeft : 0;
      const time = x / scale;

      if (time >= 0 && time <= duration) {
        onTimeUpdate(time);
      }
    }
  };

  // 处理播放头拖动
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && tracksContainerRef.current && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + tracksContainerRef.current.scrollLeft;
        const time = Math.max(0, Math.min(duration, x / scale));
        onTimeUpdate(time);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      handlersRef.current.move = null;
      handlersRef.current.up = null;
    };

    handlersRef.current.move = handleMouseMove;
    handlersRef.current.up = handleMouseUp;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 缩放时间轴
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 20, 300));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 20, 40));
  };

  // 重置缩放
  const handleResetZoom = () => {
    setScale(100);
  };

  // 添加轨道
  const addTrack = (type: 'video' | 'audio' | 'text') => {
    const newTrack: Track = {
      id: `${type}-${trackList.length + 1}`,
      name: `${type === 'video' ? '视频' : type === 'audio' ? '音频' : '文本'}轨道 ${trackList.length + 1}`,
      type,
      clips: [],
    };

    setTrackList([...trackList, newTrack]);
  };

  // 渲染时间刻度
  const renderTimeRuler = () => {
    const rulerMarks = [];
    const smallMarksPerSecond = 4; // 每秒4个小刻度
    const totalSmallMarks = Math.ceil(duration * smallMarksPerSecond);
    const smallMarkInterval = scale / smallMarksPerSecond;

    for (let i = 0; i <= totalSmallMarks; i++) {
      const isSecondMark = i % smallMarksPerSecond === 0;
      const time = i / smallMarksPerSecond;

      rulerMarks.push(
        <div
          key={i}
          className={`${styles.rulerMark} ${isSecondMark ? styles.secondMark : ''}`}
          style={{ left: `${i * smallMarkInterval}px` }}
        >
          {isSecondMark && <div className={styles.timeLabel}>{formatTime(time)}</div>}
        </div>
      );
    }

    return <div className={styles.timeRuler}>{rulerMarks}</div>;
  };

  // 渲染轨道
  const renderTracks = () => {
    return trackList.map((track) => (
      <div key={track.id} className={`${styles.track} ${styles[track.type]}`}>
        <div className={styles.trackHeader}>
          <div className={styles.trackName}>{track.name}</div>
          <div className={styles.trackType}>
            {track.type === 'video' ? '视频' : track.type === 'audio' ? '音频' : '文本'}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={styles.trackAction}
                onClick={() => setTrackList(trackList.filter((t) => t.id !== track.id))}
              >
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除轨道</TooltipContent>
          </Tooltip>
        </div>
        <div className={styles.trackContent} style={{ width: `${timelineWidth}px` }}>
          {/* 这里将来会渲染轨道上的片段 */}
        </div>
      </div>
    ));
  };

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timelineToolbar}>
        <TooltipProvider>
          <div className={styles.timelineControls}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" onClick={() => addTrack('video')}>
                  <Plus /> 视频轨道
                </Button>
              </TooltipTrigger>
              <TooltipContent>添加视频轨道</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" onClick={() => addTrack('audio')}>
                  <Plus /> 音频轨道
                </Button>
              </TooltipTrigger>
              <TooltipContent>添加音频轨道</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" onClick={() => addTrack('text')}>
                  <Plus /> 文本轨道
                </Button>
              </TooltipTrigger>
              <TooltipContent>添加文本轨道</TooltipContent>
            </Tooltip>
          </div>

          <div className={styles.zoomControls}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={scale <= 40}>
                  <ZoomOut />
                </Button>
              </TooltipTrigger>
              <TooltipContent>缩小</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetZoom}
                  disabled={scale === 100}
                >
                  <Columns />
                </Button>
              </TooltipTrigger>
              <TooltipContent>重置</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={scale >= 300}>
                  <ZoomIn />
                </Button>
              </TooltipTrigger>
              <TooltipContent>放大</TooltipContent>
            </Tooltip>
            <div className={styles.scaleIndicator}>{scale}%</div>
          </div>
        </TooltipProvider>
      </div>

      <div className={styles.timelineContent} ref={tracksContainerRef}>
        <div className={styles.timelineFixed}>
          <div className={styles.timelineHeader}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTimeline(!showTimeline)}
                  className={styles.toggleButton}
                >
                  {showTimeline ? (
                    <ChevronsRight />
                  ) : (
                    <ChevronsRight style={{ transform: 'rotate(180deg)' }} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showTimeline ? '隐藏时间轴' : '显示时间轴'}</TooltipContent>
            </Tooltip>
          </div>
          <div className={styles.trackHeaders}>
            {trackList.map((track) => (
              <div key={track.id} className={styles.trackHeaderPlaceholder}>
                {/* 轨道标题的占位,用于保持对齐 */}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.timelineScrollable}>
          <div className={styles.timelineRulerContainer} style={{ width: `${timelineWidth}px` }}>
            {renderTimeRuler()}
          </div>

          {/* eslint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */}
          <div
            className={styles.tracksArea}
            ref={timelineRef}
            role="application"
            tabIndex={0}
            aria-label="Timeline tracks"
            onClick={handleTimelineClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleTimelineClick(e);
            }}
          >
            <div className={styles.tracksContainer}>{renderTracks()}</div>

            <div
              className={styles.playhead}
              ref={playheadRef}
              style={{ left: `${playheadPosition}px` }}
              onMouseDown={handlePlayheadMouseDown}
              role="slider"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') handleTimelineClick(e);
              }}
              aria-label="timeline playhead"
              aria-valuenow={Math.round(currentTime)}
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
            >
              <div className={styles.playheadHead} />
              <div className={styles.playheadLine} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Timeline;
