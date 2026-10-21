/**
 * 角色持久化
 * @module core/services/domain/character-persistence
 *
 * 提取自原 CharacterService.loadFromStorage + saveToStorage，
 * 抽出为纯函数（接收 projectId / characters / autoSave），不再耦合于类成员。
 */

import type { Character } from '@/core/types';
import { logger } from '@/core/utils/logger';

import { buildCharacterStorageKey } from './character-types';

/**
 * 从 localStorage 加载角色数组
 *
 * @param projectId 当前项目 ID（可选）
 * @returns 加载到的角色数组；若不存在或解析失败，返回空数组
 */
export function loadCharactersFromStorage(
  projectId?: string
): Character[] {
  try {
    const key = buildCharacterStorageKey(projectId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as Character[];
    }
  } catch (error) {
    logger.error('Failed to load characters from storage:', error);
  }
  return [];
}

/**
 * 把角色数组写入 localStorage
 *
 * @param projectId 当前项目 ID（可选）
 * @param characters 待保存角色数组
 * @param autoSave false 时跳过保存（与原 CharacterService.autoSave 开关对齐）
 * @returns 写入成功与否
 */
export function saveCharactersToStorage(
  projectId: string | undefined,
  characters: Character[],
  autoSave: boolean
): boolean {
  if (!autoSave) return false;

  try {
    const key = buildCharacterStorageKey(projectId);
    localStorage.setItem(key, JSON.stringify(characters));
    return true;
  } catch (error) {
    logger.error('Failed to save characters to storage:', error);
    return false;
  }
}
