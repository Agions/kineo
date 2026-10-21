/**
 * 配音轨道 Tab 组件
 */

import { Upload, PlayCircle, PauseCircle, MicOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Empty from '@/components/ui/empty';
import { Slider } from '@/components/ui/slider';
import { Space } from '@/components/ui/space';
import { Tag } from '@/components/ui/tag';
import { formatTime } from '@/common/utils';

import type { VoiceTrack } from './types/audio-entities';

interface VoiceTabProps {
  voiceTracks: VoiceTrack[];
  playingVoiceId: string | null;
  videoDuration: number;
  disabled: boolean;
  isRecording: boolean;
  recordingTime: number;
  onVoicePlay: (track: VoiceTrack) => void;
  onVoiceRemove: (id: string) => void;
  onVoiceVolumeChange: (id: string, volume: number) => void;
  onVoiceImport: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export default function VoiceTab({
  voiceTracks,
  playingVoiceId,
  videoDuration: _videoDuration,
  disabled,
  isRecording,
  recordingTime,
  onVoicePlay,
  onVoiceRemove: _onVoiceRemove,
  onVoiceVolumeChange,
  onVoiceImport,
  onStartRecording,
  onStopRecording,
}: VoiceTabProps) {
  return (
    <div className="tabContent">
      <div className="toolbar">
        <Space>
          <Button
            type="primary"
            icon={<MicOff />}
            onClick={isRecording ? onStopRecording : onStartRecording}
            danger={isRecording}
            disabled={disabled}
          >
            {isRecording ? `停止录音 (${formatTime(recordingTime)})` : '开始录音'}
          </Button>
          <Button icon={<Upload />} onClick={onVoiceImport} disabled={disabled}>
            导入配音
          </Button>
        </Space>
      </div>

      {voiceTracks.length > 0 ? (
        <div className="trackTable">
          {voiceTracks.map((track) => (
            <div key={track.id} className="trackItem">
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={playingVoiceId === track.id ? <PauseCircle /> : <PlayCircle />}
                  onClick={() => onVoicePlay(track)}
                />
                <span>{track.name}</span>
                <Tag>{formatTime(track.duration)}</Tag>
                <Slider
                  min={0}
                  max={100}
                  value={track.volume}
                  onChange={(value) => onVoiceVolumeChange(track.id, value)}
                  disabled={disabled}
                  style={{ width: 100 }}
                />
              </Space>
            </div>
          ))}
        </div>
      ) : (
        <Empty image={undefined} description="暂无配音，点击上方按钮添加" />
      )}
    </div>
  );
}

export type { VoiceTabProps };
