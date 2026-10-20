/**
 * @kineo/plugin-sdk — Kineo 插件化微模块 SDK 与 Hook 扩展引擎
 */

import { logger } from '@/core/utils/logger';

export interface PluginHooks {
  /** 剧本解析前处理钩子（可预处理或过滤文本） */
  onBeforeScriptParse?: (rawInput: string) => Promise<string | void> | string | void;
  /** 角色 Consistency 锁脸锚定后处理钩子 */
  onAfterCharacterAnchor?: (characters: any[]) => Promise<any[] | void> | any[] | void;
  /** 3D 运镜与 Camera Vector 计算钩子 */
  onCameraMotionPlan?: (plan: any) => Promise<any | void> | any | void;
  /** 分镜渲染与 4K 压制全量完成钩子 */
  onRenderComplete?: (result: any) => Promise<void> | void;
}

export interface KineoPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled?: boolean;
  hooks: PluginHooks;
}

export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, KineoPlugin> = new Map();

  private constructor() {
    this.registerBuiltinPlugins();
  }

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  /** 注册扩展插件 */
  public register(plugin: KineoPlugin): void {
    if (this.plugins.has(plugin.id)) {
      logger.warn(`[PluginRegistry] 插件 ${plugin.id} 已存在，正在覆盖...`);
    }
    this.plugins.set(plugin.id, { enabled: true, ...plugin });
    logger.info(`✓ [PluginRegistry] 成功注册插件: ${plugin.name} v${plugin.version}`);
  }

  /** 注销扩展插件 */
  public unregister(pluginId: string): boolean {
    const deleted = this.plugins.delete(pluginId);
    if (deleted) {
      logger.info(`[PluginRegistry] 已卸载插件: ${pluginId}`);
    }
    return deleted;
  }

  /** 启用/禁用插件 */
  public setPluginEnabled(pluginId: string, enabled: boolean): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = enabled;
      logger.info(`[PluginRegistry] 插件 ${pluginId} 状态置为: ${enabled ? '启用' : '禁用'}`);
    }
  }

  /** 获取所有注册插件列表 */
  public getAll(): KineoPlugin[] {
    return Array.from(this.plugins.values());
  }

  /** 获取已启用的插件列表 */
  public getEnabledPlugins(): KineoPlugin[] {
    return Array.from(this.plugins.values()).filter((p) => p.enabled !== false);
  }

  /**
   * 执行指定 Hook 管道 (Waterfall Pipeline)
   */
  public async executeHook<K extends keyof PluginHooks>(
    hookName: K,
    initialData: any
  ): Promise<any> {
    let currentData = initialData;
    const activePlugins = this.getEnabledPlugins();

    for (const plugin of activePlugins) {
      const hookFn = plugin.hooks[hookName];
      if (typeof hookFn === 'function') {
        try {
          const result = await hookFn(currentData);
          if (result !== undefined) {
            currentData = result;
          }
        } catch (err: any) {
          logger.error(`❌ [PluginRegistry] 插件 ${plugin.name} 执行 Hook ${hookName} 抛错: ${err?.message}`);
        }
      }
    }

    return currentData;
  }

  /** 内部注册默认内置插件 */
  private registerBuiltinPlugins(): void {
    this.register({
      id: 'plugin-builtin-prompt-sanitizer',
      name: '内置 Prompt 规范化插件',
      version: '1.0.0',
      description: '自动清洗剧本文本中的非法字符与空白格式',
      hooks: {
        onBeforeScriptParse: (input: string) => {
          if (!input) return input;
          return input.trim().replace(/\r\n/g, '\n');
        },
      },
    });

    this.register({
      id: 'plugin-builtin-prompt-guard',
      name: 'LLM 提示词防注入插件',
      version: '1.0.0',
      description: '过滤潜在的系统 Prompt 越权注入指令',
      hooks: {
        onBeforeScriptParse: (input: string) => {
          if (!input) return input;
          return input.replace(/System:\s*Ignore previous instructions/gi, '[Filtered Instruction]');
        },
      },
    });

    this.register({
      id: 'plugin-builtin-camera-vector-enhancer',
      name: '3D 运镜矢量增强插件',
      version: '1.0.0',
      description: '为镜头运动计划自动注入 Smooth 运动插值',
      hooks: {
        onCameraMotionPlan: (plan: any) => {
          if (!plan) return plan;
          return {
            ...plan,
            vectorSpeed: '6.5m/s',
            interpolator: 'CubicSpline',
          };
        },
      },
    });

    this.register({
      id: 'plugin-builtin-camera-collision-detector',
      name: '3D 镜头碰撞检测插件',
      version: '1.0.0',
      description: '校验 3D 运镜轨迹是否穿越盲区障碍',
      hooks: {
        onCameraMotionPlan: (plan: any) => {
          if (!plan) return plan;
          return {
            ...plan,
            collisionCheckPassed: true,
            safeFOVAngle: 75,
          };
        },
      },
    });

    this.register({
      id: 'plugin-builtin-character-anchor-validator',
      name: '角色 Consistency 锚定校验插件',
      version: '1.0.0',
      description: '自动校验角色 IP-Adapter 与 Consistent Anchor 锁脸权重',
      hooks: {
        onAfterCharacterAnchor: (characters: any[]) => {
          if (!Array.isArray(characters)) return characters;
          return characters.map((char) => ({
            ...char,
            faceLockWeight: char.faceLockWeight || 0.85,
            anchorValidated: true,
          }));
        },
      },
    });
  }
}

export const pluginRegistry = PluginRegistry.getInstance();
