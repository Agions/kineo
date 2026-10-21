/**
 * 角色工厂
 * @module core/services/domain/character-factory
 *
 * 集中处理"字段默认值 + uuid + 时间戳 + consistency 兜底"逻辑。
 *
 * 原 CharacterService.create / bulkCreate 两处各自手写了一遍：
 *   { id, name, role: 'supporting', description: '', appearance, clothing: [],
 *     expressions: [], consistency: { seed, weights, referenceImages },
 *     voice, tags: [], createdAt: now, updatedAt: now }
 *
 * 本模块消除该重复——字段调整只改一处。
 */

import { v4 as uuidv4 } from 'uuid';

import type { Character, CharacterAppearance, CharacterConsistency } from '@/core/types';

import {
  DEFAULT_CHARACTER_FIELDS,
  generateRandomSeed,
} from './character-types';

/** create / bulkCreate 接受的最小必填输入 */
export interface CreateCharacterInput {
  name: string;
  appearance: CharacterAppearance;
  id?: string;
  role?: Character['role'];
  description?: string;
  clothing?: Character['clothing'];
  expressions?: Character['expressions'];
  consistency?: Partial<CharacterConsistency>;
  voice?: Character['voice'];
  tags?: Character['tags'];
}

/**
 * 把"部分输入 + 一致性配置"归一为完整 Character
 *
 * 行为与原 CharacterService.create / bulkCreate 内的字段映射字节级一致：
 *   - seed 来自 consistency?.seed，否则随机 0..9999
 *   - weights / referenceImages 透传（undefined 不补默认）
 *   - createdAt / updatedAt 由调用方传入（保证 bulkCreate 全部帧同时间戳）
 */
export function createCharacter(
  data: CreateCharacterInput,
  now: string = new Date().toISOString()
): Character {
  return {
    id: data.id || uuidv4(),
    name: data.name,
    role: data.role ?? DEFAULT_CHARACTER_FIELDS.role,
    description: data.description ?? DEFAULT_CHARACTER_FIELDS.description,
    appearance: data.appearance,
    clothing: data.clothing ?? DEFAULT_CHARACTER_FIELDS.clothing,
    expressions: data.expressions ?? DEFAULT_CHARACTER_FIELDS.expressions,
    consistency: {
      seed: data.consistency?.seed ?? generateRandomSeed(),
      weights: data.consistency?.weights,
      referenceImages: data.consistency?.referenceImages,
    },
    voice: data.voice,
    tags: data.tags ?? DEFAULT_CHARACTER_FIELDS.tags,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 复制一个角色并分配新 id / 新种子 / 新时间戳
 *
 * 行为与原 CharacterService.duplicate 字节级一致：
 *   - id: uuidv4()（新）
 *   - name: "${original.name} (副本)"
 *   - createdAt / updatedAt: 当前时间
 *   - consistency: 继承原 consistency 但 seed 用新随机值
 */
export function duplicateCharacter(original: Character): Character {
  return {
    ...original,
    id: uuidv4(),
    name: `${original.name} (副本)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    consistency: {
      ...(original.consistency as CharacterConsistency),
      seed: generateRandomSeed(),
    },
  };
}
