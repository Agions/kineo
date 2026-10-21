/**
 * 增强视频播放器控件
 * 提供播放控制、时间显示、音量调节、全屏等功能
 */

import {
  PlayCircle,
  PauseCircle,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize2,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Tooltip } from '@/components/ui/tooltip';
import { formatTime } from '@/common/utils';

import styles from './EnhancedVideoControls.module.less';

// ============================================
// 类型定义
// ============================================

export interface VideoControlsProps {
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 当前播放时间（秒） */
  currentTime: number;
  /** 总时长（秒） */
  duration: number;
  /** 音量（0-1） */
  volume: number;
  /** 是否静音 */
  muted: boolean;
  /** 是否全屏 */
  isFullscreen: boolean;
  /** 播放速率 */
  playbackRate: number;
  /** 是否显示画质选项 */
  showQuality?: boolean;
  /** 播放速率选项 */
  playbackRates?: number[];
  /** 播放回调 */
  onPlay: () => void;
  /** 暂停回调 */
  onPause: () => void;
  /** 跳转回调 */
  onSeek: (time: number) => void;
  /** 音量变化回调 */
  onVolumeChange: (volume: number) => void;
  /** 静音切换回调 */
  onMuteToggle: () => void;
  /** 全屏切换回调 */
  onFullscreenToggle: () => void;
  /** 播放速率变化回调 */
  onPlaybackRateChange: (rate: number) => void;
  /** 自定义类名 */
  className?: string;
}

// 默认播放速率
const defaultPlaybackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

// ============================================

// ============================================
// 类型定义
// ============================================

/**
 * 视频控制条组件
 */
export function VideoControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  isFullscreen,
  playbackRate = 1,
  playbackRates = defaultPlaybackRates,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  onPlaybackRateChange,
  className,
}: VideoControlsProps) {
  // 处理播放/暂停
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  // 处理进度条点击
  const handleProgressChange = (value: number | number[]) => {
    onSeek(Array.isArray(value) ? value[0] : value);
  };

  // 处理音量变化
  const handleVolumeChange = (value: number | number[]) => {
    onVolumeChange((Array.isArray(value) ? value[0] : value) / 100);
  };

  return (
    <div className={`${styles.controls} ${className || ''}`}>
      {/* 进度条 */}
      <div className={styles.progressContainer}>
        <Slider
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onValueChange={handleProgressChange}
          className={styles.progressSlider}
        />
      </div>

      {/* 控制按钮区 */}
      <div className={styles.controlBar}>
        <div className={styles.leftControls}>
          {/* 播放/暂停 */}
          <Tooltip title={isPlaying ? '暂停' : '播放'}>
            <Button
              variant="ghost"
              size="lg"
              icon={isPlaying ? <PauseCircle size={22} /> : <PlayCircle size={22} />}
              onClick={handlePlayPause}
              className={styles.playButton}
            />
          </Tooltip>

          {/* 上一帧/下一帧 */}
          <Tooltip title="上一帧">
            <Button
              variant="ghost"
              icon={<SkipBack size={18} />}
              onClick={() => onSeek(Math.max(0, currentTime - 1 / 30))}
            />
          </Tooltip>
          <Tooltip title="下一帧">
            <Button
              variant="ghost"
              icon={<SkipForward size={18} />}
              onClick={() => onSeek(Math.min(duration, currentTime + 1 / 30))}
            />
          </Tooltip>

          {/* 时间显示 */}
          <div className={styles.timeDisplay}>
            <span className={styles.currentTime}>{formatTime(currentTime)}</span>
            <span className={styles.timeSeparator}>/</span>
            <span className={styles.duration}>{formatTime(duration)}</span>
          </div>
        </div>

        <div className={styles.rightControls}>
          {/* 播放速率 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={styles.rateButton}>
                {playbackRate}x
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {playbackRates.map((rate) => (
                <DropdownMenuItem
                  key={rate}
                  onClick={() => onPlaybackRateChange(rate)}
                  style={{ fontWeight: rate === playbackRate ? 600 : 400 }}
                >
                  {rate}x
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 音量控制 */}
          <div className={styles.volumeControl}>
            <Tooltip title={muted ? '取消静音' : '静音'}>
              <Button
                variant="ghost"
                icon={muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                onClick={onMuteToggle}
              />
            </Tooltip>
            <Slider
              min={0}
              max={100}
              value={muted ? 0 : volume * 100}
              onValueChange={handleVolumeChange}
              className={styles.volumeSlider}
            />
          </div>

          {/* 全屏切换 */}
          <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
            <Button
              variant="ghost"
              icon={isFullscreen ? <Minimize2 size={18} /> : <Maximize size={18} />}
              onClick={onFullscreenToggle}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 快捷键说明组件
// ============================================

export default VideoControls;
