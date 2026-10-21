/**
 * 数据工具：深拷贝、ID 生成、安全解析、哈希计算
 */

/** 深拷贝 - 使用 structuredClone 原生方法 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  try {
    return structuredClone(obj);
  } catch {
    // fallback for unsupported types
  }
  if (Array.isArray(obj)) return obj.map((item: unknown) => deepClone(item)) as unknown as T;
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/** 生成唯一 ID（crypto.randomUUID + fallback） */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${randomPart}`;
}

/** 生成带前缀的唯一 ID */
export function generatePrefixedId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${randomPart}`;
}

/** 各业务域 ID 生成器 */
export const generateSceneId = () => generatePrefixedId('scene');
export const generateFrameId = () => generatePrefixedId('frame');
export const generateCharId = () => generatePrefixedId('char');
export const generateCompId = () => generatePrefixedId('comp');
export const generateProjectId = () => generatePrefixedId('proj');
export const generateItemId = () => generatePrefixedId('item');

/** 安全 JSON 解析 */
export function safeJSONParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/** 计算 SHA-256 哈希 */
export async function computeHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 安全提取错误对象的 message，兼容非 Error 类型的 thrwon 值 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
