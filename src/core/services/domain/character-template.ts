/**
 * 角色模板转换与验证
 * @module core/services/domain/character-template
 *
 * 提取自原 CharacterService 的两个 static 方法（getTemplates / getTemplateCount）
 * + 一个 static 验证（validate）+ 私有函数 templateToCharacterData。
 *
 * 静态方法从类中剥离到独立模块，使主类瘦身为纯状态管理。
 */

import type { Character, CharacterAppearance } from '@/core/types';
import {
  CHARACTER_TEMPLATES,
  getTemplateById,
  getTemplatesByCategory,
  type CharacterTemplate,
} from '@/core/data/character-templates';
import { logger } from '@/core/utils/logger';

/** createFromTemplate 的 overrides 类型（与原类签名完全一致） */
export type CharacterTemplateOverrides = Partial<
  CharacterAppearance & { name: string; description: string }
>;

/**
 * 把 CharacterTemplate 转换为除 id / createdAt / updatedAt 之外的 Character 字段
 *
 * 行为与原 file-private `templateToCharacterData` 字节级一致：
 *   - name / description 走 overrides，否则取模板
 *   - appearance: template 与 overrides 浅合并（overrides 优先）
 *   - clothing / expressions / consistency 透传模板
 *   - voice ← template.recommendedVoice
 */
export function templateToCharacterData(
  template: CharacterTemplate,
  overrides?: CharacterTemplateOverrides
): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: overrides?.name ?? template.name,
    role: template.category as Character['role'],
    description: overrides?.description ?? template.description,
    appearance: { ...template.appearance, ...overrides },
    clothing: template.clothing,
    expressions: template.expressions,
    consistency: { ...template.consistency },
    voice: template.recommendedVoice,
    tags: template.tags,
  };
}

/** 模板是否存在 */

/** 列出指定 category 的模板；不传则返回全部 */
export function listTemplates(category?: string): CharacterTemplate[] {
  return getTemplatesByCategory(category);
}

/** 模板总数 */
export function countTemplates(): number {
  return CHARACTER_TEMPLATES.length;
}

/**
 * 验证角色数据；返回错误信息数组（与原 CharacterService.validate 字节级一致）
 *
 * 规则：
 *   - 必填 name
 *   - 必填 appearance
 *   - appearance.gender 必填
 *   - appearance.age 必须 1-120 之间
 */
export function validateCharacter(character: Partial<Character>): string[] {
  const errors: string[] = [];

  if (!character.name) {
    errors.push('角色名称不能为空');
  }

  if (!character.appearance) {
    errors.push('外观配置不能为空');
  } else {
    const appearance = character.appearance as CharacterAppearance;
    if (!appearance.gender) {
      errors.push('性别必须指定');
    }
    if (!appearance.age || Number(appearance.age) < 1 || Number(appearance.age) > 120) {
      errors.push('年龄必须在 1-120 之间');
    }
  }

  return errors;
}

/** 从模板加载并复用 CharacterService.create 的封装（带错误日志） */
export function buildCharacterFromTemplate(
  templateId: string,
  overrides?: CharacterTemplateOverrides
): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> | null {
  const template = getTemplateById(templateId);
  if (!template) {
    logger.error(`Template not found: ${templateId}`);
    return null;
  }
  return templateToCharacterData(template, overrides);
}

// 重导出方便外部使用
export type { CharacterTemplate };
export { CHARACTER_TEMPLATES };
