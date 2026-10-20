import React, { useState } from 'react';
import { MangaCard, MangaButton } from '@kineo/ui';

export interface AudioTrack {
  id: string;
  name: string;
  type: 'dialogue' | 'bgm' | 'sfx';
  volume: number;
  mute: boolean;
}

export function createAudioTrack(name: string, type: 'dialogue' | 'bgm' | 'sfx'): AudioTrack {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    type,
    volume: 1.0,
    mute: false,
  };
}

export interface AudioStudioProps {
  tracks?: AudioTrack[];
  onAddTrack?: (type: 'dialogue' | 'bgm' | 'sfx') => void;
  onSynthesizeTTS?: (text: string, voiceId: string) => void;
}

export const AudioStudio: React.FC<AudioStudioProps> = ({
  tracks: initialTracks = [
    createAudioTrack('角色主对白轨', 'dialogue'),
    createAudioTrack('古风背景音乐 (BGM)', 'bgm'),
    createAudioTrack('打击环境音效 (SFX)', 'sfx'),
  ],
  onAddTrack,
  onSynthesizeTTS,
}) => {
  const [tracks, setTracks] = useState<AudioTrack[]>(initialTracks);
  const [selectedVoice, setSelectedVoice] = useState('v2');
  const [sampleText, setSampleText] = useState('萧炎: “三十年河东，三十年河西，莫欺少年穷！”');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggleMute = (id: string) => {
    setTracks(tracks.map((t) => (t.id === id ? { ...t, mute: !t.mute } : t)));
  };

  const handleVolumeChange = (id: string, vol: number) => {
    setTracks(tracks.map((t) => (t.id === id ? { ...t, volume: vol } : t)));
  };

  const handleAddTrackInternal = (type: 'dialogue' | 'bgm' | 'sfx') => {
    const labelMap = { dialogue: '新角色对白轨', bgm: '新背景音乐轨', sfx: '新环境音效轨' };
    const newT = createAudioTrack(labelMap[type], type);
    setTracks([...tracks, newT]);
    onAddTrack?.(type);
  };

  return (
    <MangaCard title="多音轨 TTS 与音频配音工作台" className="w-full">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2">
          <MangaButton
            size="sm"
            variant="primary"
            onClick={() => handleAddTrackInternal('dialogue')}
          >
            + 对白轨
          </MangaButton>
          <MangaButton size="sm" variant="secondary" onClick={() => handleAddTrackInternal('bgm')}>
            + 背景音乐轨
          </MangaButton>
          <MangaButton size="sm" variant="secondary" onClick={() => handleAddTrackInternal('sfx')}>
            + 音效轨
          </MangaButton>
        </div>
        <span className="text-xs text-indigo-400 font-medium">
          已连接 EdgeTTS / CosyVoice 多角色语音合成通道
        </span>
      </div>

      {/* TTS 试听生成面板 */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">🗣️ 角色 TTS 音色对齐试听</span>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded px-3 py-1 focus:outline-none"
          >
            {DEFAULT_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.gender === 'male' ? '男声' : '女声'} - {v.provider})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
          />
          <MangaButton
            size="sm"
            variant="primary"
            onClick={() => {
              setIsPlaying(true);
              onSynthesizeTTS?.(sampleText, selectedVoice);
              setTimeout(() => setIsPlaying(false), 2000);
            }}
          >
            {isPlaying ? '🔊 合成播放中...' : '试听配音'}
          </MangaButton>
        </div>
      </div>

      {/* 多音轨列表 */}
      <div className="space-y-2">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  track.type === 'dialogue'
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : track.type === 'bgm'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {track.type.toUpperCase()}
              </span>
              <span className="text-xs font-semibold text-slate-200">{track.name}</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">音量</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={track.volume}
                  onChange={(e) => handleVolumeChange(track.id, parseFloat(e.target.value))}
                  className="w-20 accent-indigo-500 cursor-pointer"
                />
              </div>

              <MangaButton
                size="sm"
                variant={track.mute ? 'danger' : 'outline'}
                onClick={() => handleToggleMute(track.id)}
              >
                {track.mute ? '已静音' : '正常'}
              </MangaButton>
            </div>
          </div>
        ))}
      </div>
    </MangaCard>
  );
};

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  provider: 'edge-tts' | 'cosyvoice' | 'azure';
  sampleUrl?: string;
}

export const DEFAULT_VOICES: TTSVoice[] = [
  { id: 'v1', name: '晓晓 (热情女声)', language: 'zh-CN', gender: 'female', provider: 'edge-tts' },
  {
    id: 'v2',
    name: '云希 (热血青年男声)',
    language: 'zh-CN',
    gender: 'male',
    provider: 'edge-tts',
  },
  {
    id: 'v3',
    name: '云健 (沉稳老者男声)',
    language: 'zh-CN',
    gender: 'male',
    provider: 'edge-tts',
  },
  {
    id: 'v4',
    name: '晓伊 (娇柔女主女声)',
    language: 'zh-CN',
    gender: 'female',
    provider: 'edge-tts',
  },
  {
    id: 'v5',
    name: 'CosyVoice 零样本声线',
    language: 'zh-CN',
    gender: 'male',
    provider: 'cosyvoice',
  },
];

export const AudioTimeline: React.FC<{
  tracks: AudioTrack[];
  totalDuration: number;
  currentTime: number;
  onSeek?: (time: number) => void;
}> = ({ tracks, totalDuration, currentTime, onSeek }) => {
  return (
    <div className="w-full bg-slate-900 p-4 rounded-xl mt-4 border border-slate-800">
      <div className="flex justify-between text-slate-400 text-xs mb-2">
        <span className="font-semibold text-slate-200">音频波形与时间轴对齐</span>
        <span className="font-mono">
          {currentTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
        </span>
      </div>
      <div
        className="relative h-28 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          onSeek?.(ratio * totalDuration);
        }}
      >
        {tracks.map((track, idx) => (
          <div
            key={track.id}
            className="absolute left-0 right-0 h-8 border-b border-slate-800/60 bg-slate-800/30 flex items-center px-2"
            style={{ top: `${idx * 28}px` }}
          >
            <span className="text-[10px] font-bold text-slate-400">{track.name}</span>
          </div>
        ))}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)] z-10 transition-all"
          style={{ left: `${(currentTime / (totalDuration || 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};
