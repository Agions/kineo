/**
 * 音效 Tab 组件
 */

import { Upload, Trash2, PlayCircle, PauseCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Empty from '@/components/ui/empty';
import { message } from '@/components/ui/message';
import { Slider } from '@/components/ui/slider';
import { Space } from '@/components/ui/space';
import { Tag } from '@/components/ui/tag';
import { PRESET_SFX_LIST } from '@/common/constants/media-presets';

import type { SoundEffect } from './types/audio-entities';

interface SfxTabProps {
  soundEffects: SoundEffect[];
  playingSfxId: string | null;
  disabled: boolean;
  onSfxPlay: (effect: SoundEffect) => void;
  onSfxImport: () => void;
  onSfxRemove: (id: string) => void;
  onSfxVolumeChange: (id: string, volume: number) => void;
}

export default function SfxTab({
  soundEffects,
  playingSfxId,
  disabled,
  onSfxPlay,
  onSfxImport,
  onSfxRemove,
  onSfxVolumeChange,
}: SfxTabProps) {
  return (
    <div className="tabContent">
      <div className="toolbar">
        <Space>
          <Button icon={<Upload />} onClick={onSfxImport} disabled={disabled}>
            导入音效
          </Button>
        </Space>
      </div>

      {soundEffects.length > 0 ? (
        <div className="trackTable">
          {soundEffects.map((effect) => (
            <div key={effect.id} className="trackItem">
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={playingSfxId === effect.id ? <PauseCircle /> : <PlayCircle />}
                  onClick={() => onSfxPlay(effect)}
                />
                <span>{effect.name}</span>
                <Tag color="blue">{effect.category}</Tag>
                <Slider
                  min={0}
                  max={100}
                  value={effect.volume}
                  onChange={(value) => onSfxVolumeChange(effect.id, value)}
                  disabled={disabled}
                  style={{ width: 100 }}
                />
                <Button
                  type="text"
                  danger
                  icon={<Trash2 />}
                  onClick={() => onSfxRemove(effect.id)}
                />
              </Space>
            </div>
          ))}
        </div>
      ) : (
        <Empty image={undefined} description="暂无音效，点击上方按钮添加">
          <div className="presetSfxSection">
            <div className="presetTitle">预设音效分类</div>
            <div className="presetList">
              {PRESET_SFX_LIST.map((sfx) => (
                <Tag
                  key={sfx.id}
                  className="presetTag"
                  color="blue"
                  onClick={() => message.info(`将使用预设音效: ${sfx.name}`)}
                >
                  {sfx.name}
                </Tag>
              ))}
            </div>
          </div>
        </Empty>
      )}
    </div>
  );
}

export type { SfxTabProps };
