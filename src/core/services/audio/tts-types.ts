/**
 * TTS 类型定义与默认配置
 *
 * 从 tts-service.ts 提取：
 *   - 默认 TTSConfig 工厂常量
 *   - 类型别名重新导出（保持外部导入路径稳定）
 */

import type { TTSConfig } from '@/core/types';

/** TTS 默认配置（用于 provider=edge + 标准中文晓晓音色） */
export const DEFAULT_TTS_CONFIG: TTSConfig = {
  provider: 'edge',
  voice: 'zh-CN-XiaoxiaoNeural',
  speed: 1.0,
  pitch: 1.0,
  volume: 100,
  format: 'audio-24khz-48kbitrate-mono-mp3',
};
