/**
 * 角色数据管理服务 - Character Service（facade）
 *
 * 历史背景：本文件原为 418 行单类，承担 CRUD / 模板加载 / 持久化 / 订阅 / 导入导出
 * 五类职责 + 三个 static 工具方法。第 16 轮重构拆为 5 个子模块（types / factory /
 * template / persistence / subscriber），本 facade 保留所有对外公开 API 签名以保证
 * 调用方零改动。
 *
 * 拆分思路：
 * 1. 字段默认值集中在 factory（消除 create / bulkCreate 重复）
 * 2. 模板加载与验证剥离到 template 模块（static 方法脱离类）
 * 3. 持久化为纯函数 persistence（不再耦合类成员）
 * 4. 订阅封装为 subscriber 工厂
 * 5. 类主流程只剩"编排"——读 / 写 / 通知三件事
 */

import type { Character, CharacterAppearance, CharacterConsistency } from '@/core/types';

import { createCharacter, duplicateCharacter } from './character-factory';
import { loadCharactersFromStorage, saveCharactersToStorage } from './character-persistence';
import { createCharacterSubscriber } from './character-subscriber';
import { buildCharacterFromTemplate, type CharacterTemplateOverrides } from './character-template';
import type { CharacterServiceOptions } from './character-types';

// 重导出公共类型，保持 `@/core/services/domain/character-service` 一站式导入
export type { Character, CharacterServiceOptions };

/**
 * 角色服务
 *
 * 内部维护：
 *   - characters: 当前项目下的角色数组
 *   - subscriber: 订阅器实例
 */
export class CharacterService {
  private characters: Character[] = [];
  private projectId?: string;
  private autoSave: boolean;
  private subscriber = createCharacterSubscriber();

  constructor(options: CharacterServiceOptions = {}) {
    this.projectId = options.projectId;
    this.autoSave = options.autoSave ?? true;

    // 启动时从 localStorage 加载
    this.characters = loadCharactersFromStorage(this.projectId);
  }

  // ========== 基础 CRUD ==========

  /** 获取所有角色（返回副本，避免外部修改内部数组） */
  getAll(): Character[] {
    return [...this.characters];
  }

  /** 根据 ID 查找角色 */
  getById(id: string): Character | undefined {
    return this.characters.find((c) => c.id === id);
  }

  /** 按角色定位筛选（protagonist / antagonist / supporting） */
  getByRole(role: Character['role']): Character[] {
    return this.characters.filter((c) => c.role === role);
  }

  /** 按标签筛选（角色 tags 数组包含指定 tag） */
  getByTag(tag: string): Character[] {
    return this.characters.filter((c) => c.tags?.includes(tag));
  }

  /** 创建单个角色 */
  create(
    characterData: Partial<Character> & { name: string; appearance: CharacterAppearance }
  ): Character {
    const consistencyObj = characterData.consistency as CharacterConsistency | undefined;
    const character = createCharacter({
      id: characterData.id,
      name: characterData.name,
      role: characterData.role,
      description: characterData.description,
      appearance: characterData.appearance,
      clothing: characterData.clothing,
      expressions: characterData.expressions,
      consistency: consistencyObj,
      voice: characterData.voice,
      tags: characterData.tags,
    });
    this.appendCharacters([character]);
    return character;
  }

  /** 从模板创建角色（模板未找到返回 null） */
  createFromTemplate(templateId: string, overrides?: CharacterTemplateOverrides): Character | null {
    const data = buildCharacterFromTemplate(templateId, overrides);
    if (!data) return null;
    return this.create(
      data as Partial<Character> & { name: string; appearance: CharacterAppearance }
    );
  }

  /** 更新角色字段；返回更新后的角色，未找到时返回 null */
  update(id: string, updates: Partial<Character>): Character | null {
    const index = this.characters.findIndex((c) => c.id === id);
    if (index === -1) return null;

    this.characters[index] = {
      ...this.characters[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.commit();
    return this.characters[index];
  }

  /** 删除角色；返回是否实际删除 */
  delete(id: string): boolean {
    const index = this.characters.findIndex((c) => c.id === id);
    if (index === -1) return false;

    this.characters.splice(index, 1);
    this.commit();
    return true;
  }

  /** 批量创建（所有角色使用同一时间戳，与原 bulkCreate 行为一致） */
  bulkCreate(
    characters: Array<Partial<Character> & { name: string; appearance: CharacterAppearance }>
  ): Character[] {
    const now = new Date().toISOString();
    const newCharacters = characters.map((data) => {
      const consistencyObj = data.consistency as CharacterConsistency | undefined;
      return createCharacter(
        {
          id: data.id,
          name: data.name,
          role: data.role,
          description: data.description,
          appearance: data.appearance,
          clothing: data.clothing,
          expressions: data.expressions,
          consistency: consistencyObj,
          voice: data.voice,
          tags: data.tags,
        },
        now
      );
    });
    this.appendCharacters(newCharacters);
    return newCharacters;
  }

  /** 复制角色（新种子 + "(副本)" 后缀） */
  duplicate(id: string): Character | null {
    const original = this.getById(id);
    if (!original) return null;

    const copy = duplicateCharacter(original);
    this.appendCharacters([copy]);
    return copy;
  }

  /**
   * 追加参考图到角色的 consistency.referenceImages
   * @returns 是否成功更新
   */
  updateReferenceImage(id: string, imageUrl: string): boolean {
    const char = this.getById(id);
    if (!char) return false;

    const consistency = char.consistency as CharacterConsistency;
    return (
      this.update(id, {
        consistency: {
          ...consistency,
          referenceImages: [...(consistency?.referenceImages ?? []), imageUrl],
        },
      }) !== null
    );
  }

  /**
   * 锁定 / 解锁角色种子
   *
   * 行为与原实现字节级一致：
   *   - lock=true 且无 seed → 分配新随机 seed 并更新
   *   - lock=true 且有 seed → 直接返回 true（已锁定）
   *   - lock=false → 直接返回 true（不解锁数据）
   */
  lockConsistency(id: string, lock: boolean): boolean {
    const char = this.getById(id);
    if (!char) return false;

    if (lock && !(char.consistency as CharacterConsistency)?.seed) {
      const consistency = char.consistency as CharacterConsistency;
      return (
        this.update(id, {
          consistency: {
            ...consistency,
            seed: Math.floor(Math.random() * 10000),
          },
        }) !== null
      );
    }
    return true;
  }

  // ========== 导入导出 ==========

  /** 导出当前所有角色为 JSON 字符串 */
  export(): string {
    return JSON.stringify(this.characters, null, 2);
  }

  /** 从 JSON 字符串导入角色；返回实际写入的有效角色 */
  import(jsonData: string): Character[] {
    try {
      const imported = JSON.parse(jsonData) as Character[];
      const validCharacters = imported.filter((char) => char.id && char.name && char.appearance);

      // 与原行为一致：追加到现有数组，而非覆盖
      this.characters = [...this.characters, ...validCharacters];
      this.commit();
      return validCharacters;
    } catch (_error) {
      return [];
    }
  }

  /** 清空所有角色 */
  clear(): void {
    this.characters = [];
    this.commit();
  }

  // ========== 订阅 ==========

  /** 订阅角色变更，返回取消函数 */
  subscribe = this.subscriber.subscribe;

  // ========== 内部辅助 ==========

  /** 把若干角色追加到内部数组（用于 create / bulkCreate / duplicate） */
  private appendCharacters(newCharacters: Character[]): void {
    this.characters.push(...newCharacters);
    this.commit();
  }

  /** 统一"通知订阅者 + 持久化"出口 */
  private commit(): void {
    this.subscriber.notify(this.characters);
    saveCharactersToStorage(this.projectId, this.characters, this.autoSave);
  }
}

// ========== 单例 ==========

let characterServiceInstance: CharacterService | null = null;

export function getCharacterService(options?: CharacterServiceOptions): CharacterService {
  if (!characterServiceInstance) {
    characterServiceInstance = new CharacterService(options);
  }
  return characterServiceInstance;
}

export function resetCharacterService(): void {
  characterServiceInstance = null;
}
