/**
 * 音频编辑公共 helper
 * ====================
 * 提取 3 套 voice/sfx/music 操作中的重复模式：
 * 1. `loadAudioFromPath`    - 从文件路径加载音频元数据
 * 2. `importAudioFiles`     - 通用文件导入（支持多选/单选）
 * 3. `createAudioPlayer`    - 创建 Audio 对象 + 音量计算 + onended 回调
 * 4. `calculateAudioVolume` - 计算 3 层音量叠加（track * category * master）
 *
 * 单一职责：纯工具函数，无 React state。
 */
import { convertFileSrc } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

import { message } from '@/components/ui/message';

import { AUDIO_FILE_EXTENSIONS } from '../types/audio-entities';

/** 文件导入结果（loadAudioFromPath 返回） */
export interface LoadedAudio {
  duration: number;
  fileUrl: string;
}

/** 从文件路径加载音频元数据 */
export function loadAudioFromPath(filePath: string): Promise<LoadedAudio> {
  return new Promise((resolve, reject) => {
    const fileUrl = convertFileSrc(filePath);
    const audio = new Audio(fileUrl);
    audio.onloadedmetadata = () => resolve({ duration: audio.duration, fileUrl });
    audio.onerror = () => reject(new Error(`无法加载音频: ${filePath}`));
  });
}

/**
 * 通用文件导入
 *
 * @param multiple 是否多选
 * @param defaultName 默认名称（文件名无法解析时用）
 * @returns 加载成功的文件列表 { fileName, filePath, duration, fileUrl }[]
 */
export async function importAudioFiles(
  multiple: boolean,
  defaultName: string
): Promise<Array<{ fileName: string; filePath: string; duration: number; fileUrl: string }>> {
  const selected = await open({
    multiple,
    filters: [{ name: '音频文件', extensions: AUDIO_FILE_EXTENSIONS }],
  });

  if (!selected) return [];
  const paths = Array.isArray(selected) ? selected : [selected];
  const results: Array<{ fileName: string; filePath: string; duration: number; fileUrl: string }> =
    [];

  for (const filePath of paths) {
    const fileName = (filePath.split('/').pop() || defaultName).replace(/\.[^/.]+$/, '');
    try {
      const { duration, fileUrl } = await loadAudioFromPath(filePath);
      results.push({ fileName, filePath, duration, fileUrl });
    } catch {
      message.error(`无法加载音频文件: ${fileName}`);
    }
  }

  return results;
}

/**
 * 计算 3 层音量叠加
 * trackVolume * categoryVolume * masterVolume，范围 0-100 → 0-1
 */
export function calculateAudioVolume(
  trackVolume: number,
  categoryVolume: number,
  masterVolume: number
): number {
  return (trackVolume / 100) * (categoryVolume / 100) * (masterVolume / 100);
}

/**
 * 创建播放器（复用现有或新建）
 *
 * @param refs 音频元素 ref Map
 * @param fileUrl 音频文件 URL
 * @param volume 音量 (0-1)
 * @param onEnded 播放结束回调
 * @returns Audio 对象
 */
export function getOrCreatePlayer(
  refs: Map<string, HTMLAudioElement>,
  id: string,
  fileUrl: string | undefined,
  volume: number,
  onEnded: () => void
): HTMLAudioElement | null {
  let audio = refs.get(id);
  if (!audio && fileUrl) {
    audio = new Audio(fileUrl);
    refs.set(id, audio);
  }
  if (audio) {
    audio.volume = volume;
    void audio.play().catch(() => {});
    audio.onended = onEnded;
    return audio;
  }
  return null;
}

/** 通用移除操作：清理 blob URL + 从集合中删除 */
export function removeFromCollection<T extends { id: string; fileUrl?: string }>(
  id: string,
  items: T[],
  onRemove: (id: string) => void
): void {
  const item = items.find((t) => t.id === id);
  if (item?.fileUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(item.fileUrl);
  }
  onRemove(id);
}
