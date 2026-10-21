/**
 * 角色服务共享类型与常量
 * @module core/services/domain/character-types
 *
 * 提取自原 character-service.ts 中散落的 interface / const / helper。
 * 其它子模块（factory / template / persistence / subscriber）
 * 共用这套类型 + 字段默认值常量，保持领域模型一致。
 */

import type { Character } from '@/core/types';
import { STORAGE_KEYS } from '@/core/constants/app-config';

/** 角色服务构造选项 */
export interface CharacterServiceOptions {
  projectId?: string;
  autoSave?: boolean;
}

/** localStorage 存储键（保留 "manga-characters" 拼写以兼容既有数据） */
const CHARACTER_STORAGE_KEY = STORAGE_KEYS.CHARACTERS;

/** 默认角色字段值（与原 CharacterService.create / bulkCreate 内联默认值完全一致） */
export const DEFAULT_CHARACTER_FIELDS = {
  role: 'supporting' as Character['role'],
  description: '',
  clothing: [] as Character['clothing'],
  expressions: [] as Character['expressions'],
  tags: [] as Character['tags'],
} as const;

/** 种子随机数上限（与原 Math.floor(Math.random() * 10000) 一致） */
const CHARACTER_SEED_RANGE = 10000;

/** 项目级 storage key 构造（与原 CharacterService.loadFromStorage / saveToStorage 逻辑一致） */
export function buildCharacterStorageKey(projectId?: string): string {
  return projectId ? `${CHARACTER_STORAGE_KEY}-${projectId}` : CHARACTER_STORAGE_KEY;
}

/** 生成 0..(range-1) 的随机整数种子 */
export function generateRandomSeed(): number {
  return Math.floor(Math.random() * CHARACTER_SEED_RANGE);
}

/** 重导出 Character，避免外部导入散落 */
export type { Character };
