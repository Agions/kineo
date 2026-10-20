/**
 * PluginRegistry.ts — Kineo 插件化微模块架构与 Hook 扩展引擎
 *
 * 包装层：重定向导出 @kineo/plugin-sdk 模块
 */

export type { PluginHooks, KineoPlugin } from '../../../packages/plugin-sdk/src/index';
export { PluginRegistry, pluginRegistry } from '../../../packages/plugin-sdk/src/index';
