/**
 * Tauri 桥接层 - 命令服务
 * 类型安全的 Tauri invoke 封装
 *
 * 类型定义在 commands-types.ts
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { appConfigDir, appDataDir, documentDir, videoDir, downloadDir } from '@tauri-apps/api/path';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open, save, message, ask, confirm } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, exists, mkdir, remove, readDir } from '@tauri-apps/plugin-fs';
import {
  sendNotification,
  isPermissionGranted,
  requestPermission,
} from '@tauri-apps/plugin-notification';

import { logger } from '@/core/utils/logger';

import type {
  OpenFileOptions,
  SaveFileOptions,
  VideoClipOptions,
  PreviewOptions,
  ExportOptions,
  ExportProgress,
  ExportProgressCallback,
  DirInfo,
} from './commands-types';

// Re-export types 保持向后兼容
export type {
  OpenFileOptions,
  SaveFileOptions,
  VideoClipOptions,
  PreviewOptions,
  ExportOptions,
  ExportProgress,
  ExportProgressCallback,
  DirInfo,
} from './commands-types';

// ========== 服务类 ==========

class TauriService {
  // ========== 窗口操作 ==========

  /**
   * 获取当前窗口
   */
  async getCurrentWindowApi() {
    return getCurrentWindow();
  }

  /**
   * 最小化窗口
   */
  async minimize() {
    const win = getCurrentWindow();
    await win.minimize();
  }

  /**
   * 最大化/还原窗口
   */
  async toggleMaximize() {
    const win = getCurrentWindow();
    const isMaximized = await win.isMaximized();
    if (isMaximized) {
      await win.unmaximize();
    } else {
      await win.maximize();
    }
  }

  /**
   * 关闭窗口
   */
  async close() {
    const win = getCurrentWindow();
    await win.close();
  }

  /**
   * 设置窗口标题
   */
  async setTitle(title: string) {
    const win = getCurrentWindow();
    await win.setTitle(title);
  }

  /**
   * 设置全屏
   */
  async setFullscreen(fullscreen: boolean) {
    const win = getCurrentWindow();
    await win.setFullscreen(fullscreen);
  }

  /**
   * 设置置顶
   */
  async setAlwaysOnTop(alwaysOnTop: boolean) {
    const win = getCurrentWindow();
    await win.setAlwaysOnTop(alwaysOnTop);
  }

  // ========== 文件操作 ==========

  /**
   * 打开文件选择对话框
   */
  async openFile(options?: OpenFileOptions): Promise<string | string[] | null> {
    const result = await open({
      title: options?.title ?? '选择文件',
      defaultPath: options?.defaultPath,
      filters: options?.filters,
      multiple: options?.multiple ?? false,
      directory: options?.directory ?? false,
    });
    return result;
  }

  /**
   * 打开保存文件对话框
   */
  async saveFile(options?: SaveFileOptions): Promise<string | null> {
    const result = await save({
      title: options?.title ?? '保存文件',
      defaultPath: options?.defaultPath,
      filters: options?.filters,
    });
    return result;
  }

  /**
   * 读取项目文件（通过 Rust 命令，安全解析到 $APPDATA/{id}.json）
   */
  async readProjectFile(projectId: string): Promise<string> {
    return invoke<string>('read_project_file', { projectId });
  }

  /**
   * 保存项目文件（通过 Rust 命令，安全解析到 $APPDATA/{id}.json）
   */
  async saveProjectFile(projectId: string, contents: string): Promise<void> {
    return invoke<void>('save_project_file', { projectId, content: contents });
  }

  /**
   * 读取文本文件（原始路径，仅用于非项目文件的场景）
   * @deprecated 项目文件请用 readProjectFile
   */
  async readText(filePath: string): Promise<string> {
    return readTextFile(filePath);
  }

  /**
   * 写入文本文件（原始路径，仅用于非项目文件的场景）
   * @deprecated 项目文件请用 saveProjectFile
   */
  async writeText(filePath: string, contents: string): Promise<void> {
    return writeTextFile(filePath, contents);
  }

  /**
   * 检查文件/目录是否存在
   */
  async fileExists(path: string): Promise<boolean> {
    return exists(path);
  }

  /**
   * 创建目录
   */
  async createDir(path: string): Promise<void> {
    return mkdir(path, { recursive: true });
  }

  /**
   * 删除文件/目录
   */
  async removePath(path: string): Promise<void> {
    return remove(path, { recursive: true });
  }

  /**
   * 读取目录内容
   */
  async listDir(path: string): Promise<DirInfo[]> {
    const entries = await readDir(path);
    return entries.map((entry) => ({
      name: entry.name,
      path: `${path}/${entry.name}`,
      isDirectory:
        'isDirectory' in entry
          ? (entry as { isDirectory: boolean }).isDirectory
          : ((entry as { is_directory: boolean }).is_directory ?? false),
    }));
  }

  // ========== 路径操作 ==========

  /**
   * 获取应用目录
   */
  async getAppDir(): Promise<string> {
    return appConfigDir();
  }

  /**
   * 获取应用配置目录
   */
  async getAppConfigDir(): Promise<string> {
    return appConfigDir();
  }

  /**
   * 获取应用数据目录
   */
  async getAppDataDir(): Promise<string> {
    return appDataDir();
  }

  /**
   * 获取文档目录
   */
  async getDocumentDir(): Promise<string | null> {
    return documentDir();
  }

  /**
   * 获取视频目录
   */
  async getVideoDir(): Promise<string | null> {
    return videoDir();
  }

  /**
   * 获取下载目录
   */
  async getDownloadDir(): Promise<string | null> {
    return downloadDir();
  }

  // ========== 对话框 ==========

  /**
   * 显示消息对话框
   */
  async showMessage(
    msg: string,
    options?: { title?: string; kind?: 'info' | 'warning' | 'error' }
  ): Promise<void> {
    await message(msg, {
      title: options?.title ?? 'Kineo AI',
      kind: options?.kind ?? 'info',
    });
  }

  /**
   * 显示确认对话框
   */
  async showConfirm(msg: string, title?: string): Promise<boolean> {
    return confirm(msg, { title: title ?? '确认' });
  }

  /**
   * 显示询问对话框
   */
  async showAsk(msg: string, title?: string): Promise<boolean> {
    return ask(msg, { title: title ?? '询问' });
  }

  // ========== 通知 ==========

  /**
   * 发送系统通知
   */
  async notify(title: string, body: string): Promise<void> {
    let permissionGranted = await isPermissionGranted();

    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }

    if (permissionGranted) {
      await sendNotification({ title, body });
    }
  }

  // ========== 视频处理 ==========

  /**
   * 剪辑视频
   */
  async clipVideo(options: VideoClipOptions): Promise<void> {
    await invoke('cut_video', options);
  }

  /**
   * 生成预览
   */
  async generatePreview(options: PreviewOptions): Promise<string> {
    return invoke<string>('generate_preview', options);
  }

  /**
   * 导出视频（带进度回调）
   */
  async exportVideo(options: ExportOptions, onProgress?: ExportProgressCallback): Promise<void> {
    const exportId = options.exportId ?? `export_${Date.now()}`;

    // 如果提供了回调，设置事件监听
    let unlisten: UnlistenFn | undefined;
    if (onProgress) {
      unlisten = await listen<ExportProgress>('export-progress', (event) => {
        if (event.payload.exportId === exportId) {
          const p = event.payload;
          onProgress({
            exportId: p.exportId,
            stage: p.stage as ExportProgress['stage'],
            progress: p.progress,
            message: p.message,
            error: p.error,
          });
        }
      });
    }

    try {
      await invoke('export_video', {
        ...options,
        exportId,
      });
    } finally {
      // 清理事件监听
      if (unlisten) {
        unlisten();
      }
    }
  }

  /**
   * 监听导出进度事件
   */
  async onExportProgress(callback: ExportProgressCallback): Promise<UnlistenFn> {
    return listen<ExportProgress>('export-progress', (event) => {
      const p = event.payload;
      callback({
        exportId: p.exportId,
        stage: p.stage as ExportProgress['stage'],
        progress: p.progress,
        message: p.message,
        error: p.error,
      });
    });
  }

  /**
   * 清理临时文件
   */
  async cleanTempFile(path: string): Promise<void> {
    await invoke('clean_temp_file', { path });
  }

  /**
   * 检查运行时依赖（WebView2 / FFmpeg）
   */
  async checkRuntimeDependencies(): Promise<Record<string, unknown>> {
    try {
      if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window || '__TAURI__' in window)) {
        return { webview2_installed: true, is_tauri: false };
      }
      return await invoke('check_runtime_dependencies');
    } catch (error) {
      logger.warn('检查 Runtime 依赖失败/非 Tauri 环境:', error);
      return { webview2_installed: true, is_tauri: false };
    }
  }

  /**
   * 分析视频文件获取元数据
   * 调用 Rust 端 analyze_video 命令
   */
  async analyzeVideo(path: string): Promise<{
    duration: number;
    width: number;
    height: number;
    fps: number;
    codec: string;
    bitrate: number;
  }> {
    return invoke('analyze_video', { path });
  }

  /**
   * 提取关键帧
   * 调用 Rust 端 extract_key_frames 命令
   */
  async extractKeyFrames(path: string, count: number): Promise<string[]> {
    return invoke<string[]>('extract_key_frames', { path, count });
  }

  // ========== 窗口操作（通过 Rust 命令） ==========

  /**
   * 显示窗口
   */
  async showWindow(): Promise<void> {
    return invoke('show_window');
  }

  /**
   * 隐藏窗口
   */
  async hideWindow(): Promise<void> {
    return invoke('hide_window');
  }

  // ========== 全局快捷键 ==========

  /**
   * 注册全局快捷键
   * @param shortcut 快捷键，如 "CommandOrControl+Shift+M"
   * @param action 动作: "show" | "hide" | "toggle"
   */
  async registerGlobalShortcut(
    shortcut: string,
    action: 'show' | 'hide' | 'toggle'
  ): Promise<void> {
    return invoke('register_global_shortcut', { shortcut, action });
  }

  /**
   * 注销全局快捷键
   */
  async unregisterGlobalShortcut(shortcut: string): Promise<void> {
    return invoke('unregister_global_shortcut', { shortcut });
  }

  /**
   * 检查 FFmpeg 是否已安装并获取版本信息
   */
  async checkFFmpeg(): Promise<{ installed: boolean; version?: string }> {
    try {
      if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window || '__TAURI__' in window)) {
        return { installed: true, version: 'Web/WASM Mode' };
      }
      const result = await invoke<Record<string, unknown>>('check_ffmpeg');
      return {
        installed: Boolean(result.installed),
        version: result.version as string | undefined,
      };
    } catch (error) {
      logger.warn('检查 FFmpeg 失败/非 Tauri 环境:', error);
      return { installed: false };
    }
  }

  /**
   * 检查快捷键是否已注册
   */
  async isGlobalShortcutRegistered(shortcut: string): Promise<boolean> {
    return invoke('is_global_shortcut_registered', { shortcut });
  }

  // ========== Kineo 核心系统与硬件加速命令 ==========

  /**
   * 获取 Kineo 核心版本
   */
  async getKineoVersion(): Promise<string> {
    try {
      if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window || '__TAURI__' in window)) {
        return '0.0.1 (Web Mode)';
      }
      return await invoke<string>('get_kineo_version');
    } catch {
      return '0.0.1';
    }
  }

  /**
   * 探测系统硬件加速编解码器能力 (VideoToolbox / NVENC)
   */
  async detectHardwareAccel(): Promise<{
    nvenc: boolean;
    videotoolbox: boolean;
    qsv: boolean;
    active_encoder: string;
  }> {
    try {
      if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window || '__TAURI__' in window)) {
        return {
          nvenc: false,
          videotoolbox: true,
          qsv: false,
          active_encoder: 'Web Fallback',
        };
      }
      return await invoke('detect_hardware_accel');
    } catch {
      return {
        nvenc: false,
        videotoolbox: false,
        qsv: false,
        active_encoder: 'CPU Software Fallback',
      };
    }
  }

  /**
   * 智能小说转全功能剧本 (Native Rust AI Pipeline)
   */
  async parseNovelToScript(text: string, stylePreset: string = 'modern_anime'): Promise<any> {
    return invoke('parse_novel_to_script', { text, stylePreset });
  }

  /**
   * 解析专业剧本文本 (Native Rust)
   */
  async parseDirectScript(text: string): Promise<any> {
    return invoke('parse_direct_script', { text });
  }

  /**
   * 从灵感大纲生成剧本 (Native Rust)
   */
  async generateScriptFromIdea(idea: string, episodes: number, stylePreset: string = 'modern_anime'): Promise<any> {
    return invoke('generate_script_from_idea', { idea, episodes, stylePreset });
  }
}

// 导出单例
export const tauriService = new TauriService();
export default TauriService;
