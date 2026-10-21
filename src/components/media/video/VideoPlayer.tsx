import { PlayCircle, PauseCircle, Volume2, Maximize, Minimize2 } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip } from '@/components/ui/tooltip';
import { formatTime } from '@/common/utils';

import styles from './VideoPlayer.module.less';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  width?: number | string;
  height?: number | string;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  ref?: React.RefObject<HTMLVideoElement>;
}

function VideoPlayer({
  src,
  poster,
  autoPlay = false,
  width = '100%',
  height = 'auto',
  onTimeUpdate,
  onEnded,
  ref: externalRef,
}: VideoPlayerProps): React.ReactElement {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalRef || internalVideoRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
      onTimeUpdate?.(videoElement.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(videoElement.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('durationchange', handleDurationChange);
    videoElement.addEventListener('ended', handleEnded);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('durationchange', handleDurationChange);
      videoElement.removeEventListener('ended', handleEnded);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [videoRef, onTimeUpdate, onEnded]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      void videoElement.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (value: number | number[]) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const v = Array.isArray(value) ? value[0] : value;

    videoElement.currentTime = v;
    setCurrentTime(v);
  };

  const handleVolumeChange = (value: number | number[]) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const v = Array.isArray(value) ? value[0] : value;

    videoElement.volume = v;
    setVolume(v);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void container.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className={styles.videoPlayerContainer} ref={containerRef}>
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          className={styles.videoElement}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          width={width}
          height={height}
          onClick={togglePlay}
        />
        {!isPlaying && (
          <div className={styles.centerPlayButton} onClick={togglePlay}>
            <PlayCircle size={48} />
          </div>
        )}
      </div>
      <div className={styles.controls}>
        <div className={styles.progressBar}>
          <Slider
            min={0}
            max={duration || 100}
            value={currentTime}
            onValueChange={handleSliderChange}
          />
        </div>
        <div className={styles.controlButtons}>
          <div>
            <Button
              variant="ghost"
              className={styles.controlButton}
              onClick={togglePlay}
              icon={isPlaying ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
            />
            <span className={styles.timeDisplay}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className={styles.rightControls}>
            <div
              className={styles.volumeControl}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Button
                variant="ghost"
                className={styles.controlButton}
                icon={<Volume2 size={18} />}
              />
              {showVolumeSlider && (
                <div className={styles.volumeSlider}>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onValueChange={handleVolumeChange}
                    orientation="vertical"
                    style={{ height: 80 }}
                  />
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              className={styles.controlButton}
              onClick={toggleFullscreen}
              icon={isFullscreen ? <Minimize2 size={18} /> : <Maximize size={18} />}
            />
          </div>
        </div>
      </div>

      {/* 预览按钮 */}
      <div className={styles.previewButtonContainer}>
        <Tooltip title="全屏预览">
          <Button
            variant="default"
            size="lg"
            icon={isFullscreen ? <Minimize2 size={18} /> : <Maximize size={18} />}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? '退出预览' : '预览'}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

export default VideoPlayer;
