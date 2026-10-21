/**
 * useAudioEditor - 音频编辑状态与操作主 Hook（重构版）
 *
 * Container 职责：
 * - 管理所有音频状态（voiceTracks / backgroundMusic / soundEffects / volumes）
 * - 处理所有业务逻辑（导入、播放、录音、混音配置）
 * - 暴露状态 + 操作给 AudioEditor.tsx（Presenter）
 * - 管理音频元素生命周期（HTMLAudioElement refs）
 *
 * 重构思路：
 * - 3 套 voice/sfx/music 导入+播放的重复模式提取到 audio-editor-helpers.ts
 * - loadAudioFromPath / importAudioFiles / calculateAudioVolume / getOrCreatePlayer 只定义一次
 * - 主 hook 只负责"组合状态 + 注入 helper + 互斥播放"
 */

import { open } from '@tauri-apps/plugin-dialog';
import { useReducer, useRef, useEffect, useMemo, useCallback } from 'react';

import { message } from '@/components/ui/message';
import { generateId } from '@/common/utils';
import { logger } from '@/core/utils/logger';

import {
  AUDIO_FILE_EXTENSIONS,
  type VoiceTrack,
  type BackgroundMusic,
  type SoundEffect,
  type AudioTrackConfig,
  type AudioPlaybackState,
} from '../types/audio-entities';

import {
  loadAudioFromPath,
  importAudioFiles,
  calculateAudioVolume,
  getOrCreatePlayer,
  removeFromCollection,
} from './audio-editor-helpers';
import {
  audioEditorReducer,
  initialAudioEditorState,
  createAudioEditorSetters,
} from './useAudioEditorReducer';
import { useRecording } from './useRecording';

interface UseAudioEditorOptions {
  projectId?: string;
  initialConfig?: Partial<AudioTrackConfig>;
  onConfigChange?: (config: AudioTrackConfig) => void;
  videoDuration?: number;
  disabled?: boolean;
}

export interface UseAudioEditorReturn {
  // ---- 状态 ----
  voiceTracks: VoiceTrack[];
  backgroundMusic: BackgroundMusic | null;
  soundEffects: SoundEffect[];
  masterVolume: number;
  voiceVolume: number;
  musicVolume: number;
  effectVolume: number;
  playback: AudioPlaybackState;
  activeTab: string;
  isRecording: boolean;
  recordingTime: number;
  audioConfig: AudioTrackConfig;

  // ---- 操作（配音）----
  handleVoiceImport: () => Promise<void>;
  handleVoiceRemove: (id: string) => void;
  handleVoicePlay: (track: VoiceTrack) => void;
  handleVoiceVolumeChange: (id: string, volume: number) => void;
  handleVoiceStartTimeChange: (id: string, startTime: number) => void;

  // ---- 操作（背景音乐）----
  handleMusicSelect: () => Promise<void>;
  handleMusicRemove: () => void;
  handleMusicPlay: () => void;
  handleMusicVolumeChange: (volume: number) => void;
  handleMusicLoopChange: (loop: boolean) => void;

  // ---- 操作（音效）----
  handleSfxImport: () => Promise<void>;
  handleSfxRemove: (id: string) => void;
  handleSfxPlay: (effect: SoundEffect) => void;
  handleSfxVolumeChange: (id: string, volume: number) => void;
  handleSfxStartTimeChange: (id: string, startTime: number) => void;

  // ---- 操作（录音）----
  handleStartRecording: () => Promise<void>;
  handleStopRecording: () => void;

  // ---- 混音操作 ----
  setMasterVolume: (v: number) => void;
  setVoiceVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setEffectVolume: (v: number) => void;
  setActiveTab: (tab: string) => void;
  setBackgroundMusic: (bgm: BackgroundMusic | null) => void;
}

export function useAudioEditor({
  initialConfig,
  onConfigChange,
  videoDuration: _videoDuration = 60,
  disabled: _disabled = false,
}: UseAudioEditorOptions): UseAudioEditorReturn {
  // ========== 状态 ==========
  // 13 个 useState 已迁移到 useReducer 状态机 (2026-06-11)
  const [state, dispatch] = useReducer(
    audioEditorReducer,
    initialAudioEditorState({
      voiceTracks: initialConfig?.voiceTracks,
      backgroundMusic: initialConfig?.backgroundMusic,
      soundEffects: initialConfig?.soundEffects,
      masterVolume: initialConfig?.masterVolume,
      voiceVolume: initialConfig?.voiceVolume,
      musicVolume: initialConfig?.musicVolume,
      effectVolume: initialConfig?.effectVolume,
    })
  );
  const setters = useMemo(() => createAudioEditorSetters(dispatch), [dispatch]);
  const {
    setVoiceTracks,
    setBackgroundMusic,
    setSoundEffects,
    setMasterVolume,
    setVoiceVolume,
    setMusicVolume,
    setEffectVolume,
    setActiveTab,
    setPlayingVoiceId,
    setPlayingMusic,
    setPlayingSfxId,
    setIsRecording,
    setRecordingTime,
  } = setters;

  const {
    voiceTracks,
    backgroundMusic,
    soundEffects,
    masterVolume,
    voiceVolume,
    musicVolume,
    effectVolume,
    activeTab,
    playingVoiceId,
    playingMusic,
    playingSfxId,
    isRecording,
    recordingTime,
  } = state;

  // 录音
  const { handleStartRecording, handleStopRecording } = useRecording({
    setRecordingTime,
    setIsRecording,
    setVoiceTracks,
  });

  // 音频元素 refs（避免暴露到 UI 层）
  const voiceAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const sfxAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // ========== 计算属性 ==========
  const playback = useMemo<AudioPlaybackState>(
    () => ({ playingVoiceId, playingMusic, playingSfxId }),
    [playingVoiceId, playingMusic, playingSfxId]
  );

  const audioConfig = useMemo<AudioTrackConfig>(
    () => ({
      voiceTracks,
      backgroundMusic,
      soundEffects,
      masterVolume,
      voiceVolume,
      musicVolume,
      effectVolume,
    }),
    [
      voiceTracks,
      backgroundMusic,
      soundEffects,
      masterVolume,
      voiceVolume,
      musicVolume,
      effectVolume,
    ]
  );

  // ========== 副作用：同步配置到父组件 ==========
  useEffect(() => {
    onConfigChange?.(audioConfig);
  }, [audioConfig, onConfigChange]);

  // ========== 副作用：清理音频元素 ==========
  useEffect(() => {
    const voiceRefs = voiceAudioRefs.current;
    const sfxRefs = sfxAudioRefs.current;

    return () => {
      voiceRefs.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      sfxRefs.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      // 释放 blob URLs
      voiceTracks.forEach((track) => {
        if (track.fileUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(track.fileUrl);
        }
      });
    };
  }, [voiceTracks]);

  useEffect(() => {
    return () => {
      const musicAudio = musicAudioRef.current;
      if (musicAudio) {
        musicAudio.pause();
        musicAudio.src = '';
      }
    };
  }, []);

  // ========== 工具方法 ==========

  /** 停止所有音频播放 */
  const stopAllAudio = useCallback(() => {
    voiceAudioRefs.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.currentTime = 0;
    }
    sfxAudioRefs.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    setPlayingVoiceId(null);
    setPlayingMusic(false);
    setPlayingSfxId(null);
  }, [setPlayingVoiceId, setPlayingMusic, setPlayingSfxId]);

  // ========== 配音操作 ==========

  const handleVoiceImport = useCallback(async () => {
    try {
      const loaded = await importAudioFiles(true, '配音音频');
      if (loaded.length === 0) return;

      const newTracks: VoiceTrack[] = loaded.map(({ fileName, filePath, duration, fileUrl }) => ({
        id: generateId(),
        name: fileName,
        filePath,
        fileUrl,
        duration,
        startTime: 0,
        volume: 80,
        fadeIn: 0,
        fadeOut: 0,
        type: 'dubbing' as const,
      }));

      setVoiceTracks((prev) => [...prev, ...newTracks]);
      message.success(`成功导入 ${newTracks.length} 个配音文件`);
    } catch (error) {
      logger.error('导入配音失败:', error);
      message.error('导入配音失败，请重试');
    }
  }, [setVoiceTracks]);

  const handleVoiceRemove = useCallback(
    (id: string) => {
      removeFromCollection(id, voiceTracks, (removeId) => {
        setVoiceTracks((prev) => prev.filter((t) => t.id !== removeId));
      });
      message.success('配音已移除');
    },
    [voiceTracks, setVoiceTracks]
  );

  const handleVoicePlay = useCallback(
    (track: VoiceTrack) => {
      if (playingVoiceId === track.id) {
        const audio = voiceAudioRefs.current.get(track.id);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        setPlayingVoiceId(null);
      } else {
        stopAllAudio();
        getOrCreatePlayer(
          voiceAudioRefs.current,
          track.id,
          track.fileUrl,
          calculateAudioVolume(track.volume, voiceVolume, masterVolume),
          () => setPlayingVoiceId(null)
        );
        setPlayingVoiceId(track.id);
      }
    },
    [playingVoiceId, voiceVolume, masterVolume, stopAllAudio, setPlayingVoiceId]
  );

  const handleVoiceVolumeChange = useCallback((id: string, volume: number) => {
    setVoiceTracks((prev) => prev.map((t) => (t.id === id ? { ...t, volume } : t)));
  }, [setVoiceTracks]);

  const handleVoiceStartTimeChange = useCallback((id: string, startTime: number) => {
    setVoiceTracks((prev) => prev.map((t) => (t.id === id ? { ...t, startTime } : t)));
  }, [setVoiceTracks]);

  // ========== 背景音乐操作 ==========

  const handleMusicSelect = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: '音频文件', extensions: AUDIO_FILE_EXTENSIONS }],
      });
      if (!selected || Array.isArray(selected)) return;

      const filePath = selected as string;
      const fileName = (filePath.split('/').pop() || '背景音乐').replace(/\.[^/.]+$/, '');
      try {
        const { duration, fileUrl } = await loadAudioFromPath(filePath);
        setBackgroundMusic({
          id: generateId(),
          name: fileName,
          filePath,
          fileUrl,
          duration,
          volume: 50,
          fadeIn: 2,
          fadeOut: 2,
          loop: true,
          startTime: 0,
        });
        message.success('背景音乐添加成功');
      } catch {
        message.error('无法加载音频文件');
      }
    } catch (error) {
      logger.error('选择背景音乐失败:', error);
      message.error('选择背景音乐失败，请重试');
    }
  }, [setBackgroundMusic]);

  const handleMusicRemove = useCallback(() => {
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current.src = '';
    }
    setBackgroundMusic(null);
    setPlayingMusic(false);
    message.success('背景音乐已移除');
  }, [setBackgroundMusic, setPlayingMusic]);

  const handleMusicPlay = useCallback(() => {
    if (!backgroundMusic) return;

    if (playingMusic) {
      if (musicAudioRef.current) {
        musicAudioRef.current.pause();
        musicAudioRef.current.currentTime = 0;
      }
      setPlayingMusic(false);
    } else {
      stopAllAudio();

      let audio = musicAudioRef.current;
      if (!audio && backgroundMusic.fileUrl) {
        audio = new Audio(backgroundMusic.fileUrl);
        audio.loop = true;
        musicAudioRef.current = audio;
      }
      if (audio) {
        audio.volume = calculateAudioVolume(backgroundMusic.volume, musicVolume, masterVolume);
        void audio.play().catch(() => {});
        setPlayingMusic(true);
      }
    }
  }, [backgroundMusic, playingMusic, musicVolume, masterVolume, stopAllAudio, setPlayingMusic]);

  const handleMusicVolumeChange = useCallback((volume: number) => {
    setBackgroundMusic((prev) => (prev ? { ...prev, volume } : null));
  }, [setBackgroundMusic]);

  const handleMusicLoopChange = useCallback((loop: boolean) => {
    setBackgroundMusic((prev) => {
      if (!prev) return null;
      if (musicAudioRef.current) musicAudioRef.current.loop = loop;
      return { ...prev, loop };
    });
  }, [setBackgroundMusic]);

  // ========== 音效操作 ==========

  const handleSfxImport = useCallback(async () => {
    try {
      const loaded = await importAudioFiles(true, '音效');
      if (loaded.length === 0) return;

      const newEffects: SoundEffect[] = loaded.map(({ fileName, filePath, duration, fileUrl }) => ({
        id: generateId(),
        name: fileName,
        filePath,
        fileUrl,
        duration,
        volume: 80,
        startTime: 0,
        category: '自定义',
      }));

      setSoundEffects((prev) => [...prev, ...newEffects]);
      message.success(`成功导入 ${newEffects.length} 个音效文件`);
    } catch (error) {
      logger.error('导入音效失败:', error);
      message.error('导入音效失败，请重试');
    }
  }, [setSoundEffects]);

  const handleSfxRemove = useCallback((id: string) => {
    setSoundEffects((prev) => prev.filter((e) => e.id !== id));
    message.success('音效已移除');
  }, [setSoundEffects]);

  const handleSfxPlay = useCallback(
    (effect: SoundEffect) => {
      if (playingSfxId === effect.id) {
        const audio = sfxAudioRefs.current.get(effect.id);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        setPlayingSfxId(null);
      } else {
        stopAllAudio();
        getOrCreatePlayer(
          sfxAudioRefs.current,
          effect.id,
          effect.fileUrl,
          calculateAudioVolume(effect.volume, effectVolume, masterVolume),
          () => setPlayingSfxId(null)
        );
        setPlayingSfxId(effect.id);
      }
    },
    [playingSfxId, effectVolume, masterVolume, stopAllAudio, setPlayingSfxId]
  );

  const handleSfxVolumeChange = useCallback((id: string, volume: number) => {
    setSoundEffects((prev) => prev.map((e) => (e.id === id ? { ...e, volume } : e)));
  }, [setSoundEffects]);

  const handleSfxStartTimeChange = useCallback((id: string, startTime: number) => {
    setSoundEffects((prev) => prev.map((e) => (e.id === id ? { ...e, startTime } : e)));
  }, [setSoundEffects]);

  // ========== 录音操作（由 useRecording 管理） ==========

  return {
    // 状态
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
    audioConfig,
    // 配音
    handleVoiceImport,
    handleVoiceRemove,
    handleVoicePlay,
    handleVoiceVolumeChange,
    handleVoiceStartTimeChange,
    // 背景音乐
    handleMusicSelect,
    handleMusicRemove,
    handleMusicPlay,
    handleMusicVolumeChange,
    handleMusicLoopChange,
    // 音效
    handleSfxImport,
    handleSfxRemove,
    handleSfxPlay,
    handleSfxVolumeChange,
    handleSfxStartTimeChange,
    // 录音
    handleStartRecording,
    handleStopRecording,
    // 混音
    setMasterVolume,
    setVoiceVolume,
    setMusicVolume,
    setEffectVolume,
    setActiveTab,
    setBackgroundMusic,
  };
}
