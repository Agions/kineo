/**
 * AudioEditor - 音频编辑主组件（Presenter 层）
 *
 * 职责：
 * - 仅处理 UI 渲染，无状态逻辑
 * - 通过 useAudioEditor Hook 获取所有状态和操作
 *
 * 拆分后行数目标：< 200 行（原 990 行）
 */

import { Volume2, Headphones, Music, Settings } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Space } from '@/components/ui/space';
import { Tabs } from '@/components/ui/tabs';
import { Tag } from '@/components/ui/tag';
import { Tooltip } from '@/components/ui/tooltip';

import styles from './AudioEditor.module.less';
import { useAudioEditor } from './hooks/useAudioEditor';
import MixPanel from './MixPanel';
import MusicTab from './MusicTab';
import SfxTab from './SfxTab';
import type { AudioTrackConfig } from './types/audio-entities';
import VoiceTab from './VoiceTab';

// ========== Re-export types for backward compatibility ==========
export type {
  VoiceTrack,
  BackgroundMusic,
  SoundEffect,
  AudioTrackConfig,
} from './types/audio-entities';

// ========== Props ==========

interface AudioEditorProps {
  projectId?: string;
  onSave?: (config: AudioTrackConfig) => void;
  initialConfig?: Partial<AudioTrackConfig>;
  onConfigChange?: (config: AudioTrackConfig) => void;
  videoDuration?: number;
  disabled?: boolean;
}

// ========== 主组件 ==========

export default function AudioEditor({
  initialConfig,
  onConfigChange,
  videoDuration = 60,
  disabled = false,
}: AudioEditorProps) {
  const {
    voiceTracks,
    backgroundMusic,
    soundEffects,
    masterVolume,
    voiceVolume,
    musicVolume,
    effectVolume,
    playback,
    activeTab,
    isRecording,
    recordingTime,
    handleVoiceImport,
    handleVoiceRemove,
    handleVoicePlay,
    handleVoiceVolumeChange,
    handleMusicSelect,
    handleMusicPlay,
    handleMusicRemove,
    handleMusicVolumeChange,
    handleMusicLoopChange,
    handleSfxImport,
    handleSfxRemove,
    handleSfxPlay,
    handleSfxVolumeChange,
    handleStartRecording,
    handleStopRecording,
    setMasterVolume,
    setVoiceVolume,
    setMusicVolume,
    setEffectVolume,
    setActiveTab,
    setBackgroundMusic,
  } = useAudioEditor({ initialConfig, onConfigChange, videoDuration, disabled });

  return (
    <Card
      title={
        <Space>
          <Volume2 />
          <span>配音配乐编辑</span>
        </Space>
      }
      className={styles.audioEditor}
      extra={
        <Space>
          <Tooltip title="总音量">
            <div className={styles.masterVolumeControl}>
              <Volume2 />
              <Slider
                min={0}
                max={100}
                value={masterVolume}
                onChange={setMasterVolume}
                disabled={disabled}
                className={styles.masterSlider}
              />
              <span>{masterVolume}%</span>
            </div>
          </Tooltip>
        </Space>
      }
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={[
          {
            key: 'voice',
            label: (
              <Space>
                <Headphones />
                <span>配音轨道</span>
                <Tag color="blue">{voiceTracks.length}</Tag>
              </Space>
            ),
            children: (
              <VoiceTab
                voiceTracks={voiceTracks}
                playingVoiceId={playback.playingVoiceId}
                videoDuration={videoDuration}
                disabled={disabled}
                isRecording={isRecording}
                recordingTime={recordingTime}
                onVoicePlay={handleVoicePlay}
                onVoiceRemove={handleVoiceRemove}
                onVoiceVolumeChange={handleVoiceVolumeChange}
                onVoiceImport={handleVoiceImport}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
              />
            ),
          },
          {
            key: 'music',
            label: (
              <Space>
                <Music />
                <span>背景音乐</span>
                {backgroundMusic && <Tag color="green">已添加</Tag>}
              </Space>
            ),
            children: (
              <MusicTab
                backgroundMusic={backgroundMusic}
                playingMusic={playback.playingMusic}
                disabled={disabled}
                onMusicSelect={handleMusicSelect}
                onMusicPlay={handleMusicPlay}
                onMusicRemove={handleMusicRemove}
                onMusicVolumeChange={handleMusicVolumeChange}
                onMusicLoopChange={handleMusicLoopChange}
                onFadeInChange={(value) =>
                  setBackgroundMusic({ ...backgroundMusic!, fadeIn: value })
                }
                onFadeOutChange={(value) =>
                  setBackgroundMusic({ ...backgroundMusic!, fadeOut: value })
                }
              />
            ),
          },
          {
            key: 'effects',
            label: (
              <Space>
                <Volume2 />
                <span>音效</span>
                <Tag color="purple">{soundEffects.length}</Tag>
              </Space>
            ),
            children: (
              <SfxTab
                soundEffects={soundEffects}
                playingSfxId={playback.playingSfxId}
                disabled={disabled}
                onSfxImport={handleSfxImport}
                onSfxPlay={handleSfxPlay}
                onSfxRemove={handleSfxRemove}
                onSfxVolumeChange={handleSfxVolumeChange}
              />
            ),
          },
          {
            key: 'mix',
            label: (
              <Space>
                <Settings />
                <span>混音设置</span>
              </Space>
            ),
            children: (
              <div className={styles.tabContent}>
                <MixPanel
                  voiceVolume={voiceVolume}
                  musicVolume={musicVolume}
                  effectVolume={effectVolume}
                  masterVolume={masterVolume}
                  voiceTracksCount={voiceTracks.length}
                  hasBackgroundMusic={!!backgroundMusic}
                  soundEffectsCount={soundEffects.length}
                  disabled={disabled}
                  onVoiceVolumeChange={setVoiceVolume}
                  onMusicVolumeChange={setMusicVolume}
                  onEffectVolumeChange={setEffectVolume}
                  onMasterVolumeChange={setMasterVolume}
                />
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
}
