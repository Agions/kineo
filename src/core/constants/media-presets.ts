/**
 * 导出常量 — 视频/音频格式、质量预设等
 * 归属于 shared/constants，零外部依赖
 */

// ============================================
// 视频导出格式
// ============================================

export const EXPORT_FORMATS = ['MP4', 'MOV', 'WebM'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const RESOLUTIONS = ['480p', '720p', '1080p', '4K'] as const;
export type Resolution = (typeof RESOLUTIONS)[number];

export const FRAME_RATES = [24, 30, 60] as const;
export type FrameRate = (typeof FRAME_RATES)[number];

export const RESOLUTION_VALUES: Record<Resolution, { width: number; height: number }> = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4K': { width: 3840, height: 2160 },
};

/** 1080P 标准分辨率常量（最常用，作为合成/编码默认值） */
export const RESOLUTION_1080P = RESOLUTION_VALUES['1080p'];

/** 默认视频帧率 / 格式 / 质量 */
export const DEFAULT_FPS = 30;
export const DEFAULT_VIDEO_FORMAT = 'mp4';
export const DEFAULT_QUALITY = 'high';

export interface QualityPreset {
  label: string;
  description: string;
  bitrate: string;
}

export const QUALITY_PRESETS: Record<string, QualityPreset> = {
  low: { label: '低', description: '文件小，适合快速预览', bitrate: '2Mbps' },
  medium: { label: '中', description: '平衡质量与文件大小', bitrate: '5Mbps' },
  high: { label: '高', description: '高质量，适合分享', bitrate: '10Mbps' },
  ultra: { label: '超清', description: '最高质量，适合专业用途', bitrate: '20Mbps' },
};

// ============================================
// 音频预设
// ============================================

interface BgmPreset {
  id: string;
  name: string;
  category: string;
  duration: number;
}

interface SfxPreset {
  id: string;
  name: string;
  category: string;
}

export const PRESET_BGM_LIST: BgmPreset[] = [
  { id: 'bgm-1', name: '温馨回忆', category: '温暖', duration: 180 },
  { id: 'bgm-2', name: '紧张悬疑', category: '悬疑', duration: 120 },
  { id: 'bgm-3', name: '欢快节奏', category: '欢快', duration: 150 },
  { id: 'bgm-4', name: '浪漫钢琴', category: '浪漫', duration: 200 },
  { id: 'bgm-5', name: '史诗大片', category: '史诗', duration: 240 },
  { id: 'bgm-6', name: '轻松午后', category: '轻松', duration: 160 },
];

export const PRESET_SFX_LIST: SfxPreset[] = [
  { id: 'sfx-1', name: '门铃声', category: '环境' },
  { id: 'sfx-2', name: '电话铃', category: '环境' },
  { id: 'sfx-3', name: '脚步声', category: '动作' },
  { id: 'sfx-4', name: '敲门声', category: '动作' },
  { id: 'sfx-5', name: '鼓掌声', category: '动作' },
  { id: 'sfx-6', name: '笑声', category: '情感' },
  { id: 'sfx-7', name: '哭声', category: '情感' },
  { id: 'sfx-8', name: '风声', category: '自然' },
  { id: 'sfx-9', name: '雨声', category: '自然' },
  { id: 'sfx-10', name: '雷声', category: '自然' },
];

// ============================================
// 音频轨道默认值
// ============================================

export const DEFAULT_VOLUME = {
  master: 80,
  voice: 80,
  music: 50,
  effect: 70,
} as const;

export const AUDIO_FILE_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'] as const;
