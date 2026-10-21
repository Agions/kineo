/**
 * MixPanel - 混音设置面板
 * 从 AudioEditor 中提取，专注渲染混音音量配置
 */

import { Headphones, Music, Volume2 } from 'lucide-react';
import React from 'react';

import { Card } from '@/components/ui/card';
import { Row, Col } from '@/components/ui/grid';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';

interface MixPanelProps {
  voiceVolume: number;
  musicVolume: number;
  effectVolume: number;
  masterVolume: number;
  voiceTracksCount: number;
  hasBackgroundMusic: boolean;
  soundEffectsCount: number;
  disabled: boolean;
  onVoiceVolumeChange: (v: number) => void;
  onMusicVolumeChange: (v: number) => void;
  onEffectVolumeChange: (v: number) => void;
  onMasterVolumeChange: (v: number) => void;
}

/**
 * 4 路混音控制（配音 / 音乐 / 音效 / 主音量）。
 * 原来每个 Card 写 12 行 × 4 = 48 行重复；提取为数据驱动的 map，
 * 单一 Card 模板 + 数组配置。
 */
interface ChannelConfig {
  key: 'voice' | 'music' | 'effect' | 'master';
  icon: React.ReactNode;
  title: string;
  value: number;
  onChange: (v: number) => void;
}

export default function MixPanel({
  voiceVolume,
  musicVolume,
  effectVolume,
  masterVolume,
  voiceTracksCount,
  hasBackgroundMusic,
  soundEffectsCount,
  disabled,
  onVoiceVolumeChange,
  onMusicVolumeChange,
  onEffectVolumeChange,
  onMasterVolumeChange,
}: MixPanelProps) {
  const channels: ChannelConfig[] = [
    {
      key: 'voice',
      icon: <Headphones />,
      title: '配音音量',
      value: voiceVolume,
      onChange: onVoiceVolumeChange,
    },
    {
      key: 'music',
      icon: <Music />,
      title: '音乐音量',
      value: musicVolume,
      onChange: onMusicVolumeChange,
    },
    {
      key: 'effect',
      icon: <Volume2 />,
      title: '音效音量',
      value: effectVolume,
      onChange: onEffectVolumeChange,
    },
    {
      key: 'master',
      icon: <span className="masterIcon">M</span>,
      title: '主音量',
      value: masterVolume,
      onChange: onMasterVolumeChange,
    },
  ];

  return (
    <>
      <Row gutter={[24, 24]}>
        {channels.map(({ key, icon, title, value, onChange }) => (
          <Col key={key} xs={24} sm={12} md={6}>
            <Card className="mixCard" size="small">
              <div className="mixTitle">
                {icon} {title}
              </div>
              <Progress percent={value} status="active" />
              <Slider min={0} max={100} value={value} onChange={onChange} disabled={disabled} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="summaryCard" size="small" title="音频轨道概览">
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={8}>
            <div className="summaryItem">
              <Headphones /> 配音轨道: <strong>{voiceTracksCount}</strong>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="summaryItem">
              <Music /> 背景音乐: <strong>{hasBackgroundMusic ? '1' : '0'}</strong>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="summaryItem">
              <Volume2 /> 音效: <strong>{soundEffectsCount}</strong>
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );
}
