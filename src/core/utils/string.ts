/**
 * 字符串工具：截断、大小写转换、命名风格转换、校验
 */

/** 截断文本 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/** 首字母大写 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** 驼峰转短横线 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

/** 短横线转驼峰 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_match: string, letter: string) => letter.toUpperCase());
}

/** 验证邮箱 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** 验证 URL */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
