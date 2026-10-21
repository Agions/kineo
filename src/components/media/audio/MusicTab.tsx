/**
 * 背景音乐 Tab 组件
 */

import { Folder, PlayCircle, PauseCircle, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { message } from '@/components/ui/message';
import { Popconfirm } from '@/components/ui/popconfirm';
import { Slider } from '@/components/ui/slider';
import { Tag } from '@/components/ui/tag';
import { PRESET_BGM_LIST } from '@/common/constants/media-presets';
import { formatTime } from '@/common/utils';

import type { BackgroundMusic } from './types/audio-entities';

interface MusicTabProps {
  backgroundMusic: BackgroundMusic | null;
  playingMusic: boolean;
  disabled: boolean;
  onMusicSelect: () => void;
  onMusicPlay: () => void;
  onMusicRemove: () => void;
  onMusicVolumeChange: (volume: number) => void;
  onMusicLoopChange: (loop: boolean) => void;
  onFadeInChange: (fadeIn: number) => void;
  onFadeOutChange: (fadeOut: number) => void;
}

export default function MusicTab({
  backgroundMusic,
  playingMusic,
  disabled,
  onMusicSelect,
  onMusicPlay,
  onMusicRemove,
  onMusicVolumeChange,
  onMusicLoopChange,
  onFadeInChange,
  onFadeOutChange,
}: MusicTabProps) {
  return (
    <div className="tabContent">
      <div className="musicSection">
        {backgroundMusic ? (
          <Card className="musicCard" size="small">
            <div className="musicInfo">
              <div className="musicName">{backgroundMusic.name}</div>
              <div className="musicMeta">
                <span>时长: {formatTime(backgroundMusic.duration)}</span>
                <span>
                  循环:{' '}
                  <Button
                    type="text"
                    size="small"
                    onClick={() => onMusicLoopChange(!backgroundMusic.loop)}
                    disabled={disabled}
                  >
                    {backgroundMusic.loop ? '开' : '关'}
                  </Button>
                </span>
              </div>
            </div>

            <div className="musicControls">
              <Button
                type="primary"
                icon={playingMusic ? <PauseCircle /> : <PlayCircle />}
                onClick={onMusicPlay}
                disabled={disabled}
              >
                {playingMusic ? '暂停' : '播放'}
              </Button>
              <Popconfirm
                title="确认移除背景音乐?"
                onConfirm={onMusicRemove}
                okText="确认"
                cancelText="取消"
              >
                <Button danger icon={<Trash2 />} disabled={disabled}>
                  移除
                </Button>
              </Popconfirm>
            </div>

            <div className="volumeControl">
              <span>音量:</span>
              <Slider
                min={0}
                max={100}
                value={backgroundMusic.volume}
                onChange={onMusicVolumeChange}
                disabled={disabled}
              />
              <span>{backgroundMusic.volume}%</span>
            </div>

            <div className="fadeControl">
              <div className="fadeItem">
                <span>淡入:</span>
                <Slider
                  min={0}
                  max={10}
                  step={0.5}
                  value={backgroundMusic.fadeIn}
                  onChange={onFadeInChange}
                  disabled={disabled}
                />
                <span>{backgroundMusic.fadeIn}s</span>
              </div>
              <div className="fadeItem">
                <span>淡出:</span>
                <Slider
                  min={0}
                  max={10}
                  step={0.5}
                  value={backgroundMusic.fadeOut}
                  onChange={onFadeOutChange}
                  disabled={disabled}
                />
                <span>{backgroundMusic.fadeOut}s</span>
              </div>
            </div>
          </Card>
        ) : (
          <div className="musicSelectArea">
            <div className="selectButtons">
              <Button
                type="primary"
                icon={<Folder />}
                onClick={onMusicSelect}
                disabled={disabled}
                size="large"
              >
                选择本地音乐
              </Button>
            </div>

            <div className="presetSection">
              <div className="presetTitle">推荐背景音乐</div>
              <div className="presetList">
                {PRESET_BGM_LIST.map((bgm) => (
                  <Tag
                    key={bgm.id}
                    className="presetTag"
                    onClick={() => message.info(`将使用预设音乐: ${bgm.name}`)}
                  >
                    {bgm.name}
                    <span className="presetMeta">- {bgm.category}</span>
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type { MusicTabProps };
