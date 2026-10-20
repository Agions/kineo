/**
 * 桌面应用元信息
 *
 * 从 desktop-app-service.ts 提取的纯查询函数。
 * 不持有状态、不依赖 Tauri 运行时（除 navigator.userAgent）。
 *
 * 重复模式识别：
 *   原代码 isMacOS / isWindows 是 getPlatform() === 'macos' /
 *   getPlatform() === 'windows' 的包装——这两个方法对调用方几乎
 *   没有独立价值，合并为一个 isPlatform(target) 函数更自描述；
 *   同时为了兼容历史 API，保留 isMacOS / isWindows 名字的便捷别名。
 */

import type { Platform } from './desktop-app-types';

/** 应用版本 */
export function getAppVersion(): string {
  return '2.1.0';
}

/** 应用名称 */
export function getAppName(): string {
  return 'Kineo AI';
}

/**
 * 通过 navigator.userAgent 检测当前平台。
 * Tauri 1.x 没有原生 OS API，所以走 UA 嗅探。
 */
export function getPlatform(): Platform {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('mac')) return 'macos';
  if (userAgent.includes('linux')) return 'linux';

  return 'unknown';
}

/** 是否为 macOS */
export function isMacOS(): boolean {
  return getPlatform() === 'macos';
}

/** 是否为 Windows */
export function isWindows(): boolean {
  return getPlatform() === 'windows';
}
