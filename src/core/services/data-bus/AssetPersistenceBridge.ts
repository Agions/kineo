/**
 * AssetPersistenceBridge.ts — 分级素材资产持久化中心
 *
 * 解决漫剧多媒体项目中超大 Base64 数据挤爆 JSON / localStorage (5MB) 的问题。
 * - 桌面端 (Tauri v2): 流式写入本地沙箱磁盘 ($APP_DATA/projects/{id}/assets/)，输出 asset:// 零拷贝协议 URL。
 * - 浏览器/Web 端: 存储于 IndexedDB 二进制 Blob 仓库 (kineo-asset-vault)，输出 blob: URL。
 */

import { logger } from '@/core/utils/logger';

export interface PersistedAssetMeta {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uri: string; // asset://... 或 blob:... 或 data:...
  localDiskPath?: string;
  createdAt: string;
}

class AssetPersistenceBridge {
  private idbName = 'kineo-asset-vault';
  private idbStore = 'assets';
  private dbPromise: Promise<IDBDatabase> | null = null;
  private blobUrlCache = new Map<string, string>();

  /**
   * 探测当前是否处于 Tauri 桌面端运行环境
   */
  public isTauriEnv(): boolean {
    return typeof window !== 'undefined' && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
  }

  /**
   * 初始化 IndexedDB 数据库（Web 端分级存储）
   */
  private async getIndexedDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB not supported in current environment'));
      }
      const request = indexedDB.open(this.idbName, 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.idbStore)) {
          db.createObjectStore(this.idbStore, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * 将 Base64 或 Blob 数据持久化为本地零拷贝资产
   */
  public async persistAsset(
    projectId: string,
    assetId: string,
    data: string | Blob | Uint8Array,
    options: { fileName?: string; mimeType?: string } = {}
  ): Promise<PersistedAssetMeta> {
    const mimeType = options.mimeType || this.inferMimeType(data, options.fileName);
    const ext = this.mimeToExtension(mimeType);
    const fileName = options.fileName || `${assetId}.${ext}`;

    // 1. 如果在 Tauri 桌面端环境中
    if (this.isTauriEnv()) {
      try {
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        const { appDataDir, join } = await import('@tauri-apps/api/path');
        const { mkdir, writeFile, exists } = await import('@tauri-apps/plugin-fs');

        const baseDir = await appDataDir();
        const projectAssetDir = await join(baseDir, 'kineo-projects', projectId, 'assets');
        
        const dirExists = await exists(projectAssetDir);
        if (!dirExists) {
          await mkdir(projectAssetDir, { recursive: true });
        }

        const filePath = await join(projectAssetDir, fileName);
        const binaryBuffer = this.toUint8Array(data);

        await writeFile(filePath, binaryBuffer);
        const streamingUri = convertFileSrc(filePath);

        logger.info(`[AssetBridge] 桌面端资产已落盘: ${filePath} -> ${streamingUri}`);

        return {
          id: assetId,
          projectId,
          fileName,
          mimeType,
          sizeBytes: binaryBuffer.byteLength,
          uri: streamingUri,
          localDiskPath: filePath,
          createdAt: new Date().toISOString(),
        };
      } catch (err) {
        logger.warn('[AssetBridge] 写入 Tauri 文件系统失败，回退到 IndexedDB 存储:', err);
      }
    }

    // 2. Web 环境或回退环境：使用 IndexedDB 存储二进制 Blob
    try {
      const db = await this.getIndexedDB();
      const binaryBlob = this.toBlob(data, mimeType);
      const record = {
        id: `${projectId}:${assetId}`,
        projectId,
        fileName,
        mimeType,
        sizeBytes: binaryBlob.size,
        blob: binaryBlob,
        createdAt: new Date().toISOString(),
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(this.idbStore, 'readwrite');
        const store = tx.objectStore(this.idbStore);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      const objectUrl = URL.createObjectURL(binaryBlob);
      this.blobUrlCache.set(record.id, objectUrl);

      return {
        id: assetId,
        projectId,
        fileName,
        mimeType,
        sizeBytes: binaryBlob.size,
        uri: objectUrl,
        createdAt: record.createdAt,
      };
    } catch (dbErr) {
      logger.warn('[AssetBridge] IndexedDB 写入失败，最后保底保持原始数据:', dbErr);
      // 保底：若为 base64 字符串直接使用
      const fallbackUri = typeof data === 'string' ? data : '';
      return {
        id: assetId,
        projectId,
        fileName,
        mimeType,
        sizeBytes: typeof data === 'string' ? data.length : 0,
        uri: fallbackUri,
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 解析资产可播放/渲染 URL
   */
  public async resolveAssetUri(projectId: string, assetId: string, fallbackUri?: string): Promise<string> {
    if (fallbackUri && (fallbackUri.startsWith('asset://') || fallbackUri.startsWith('http://') || fallbackUri.startsWith('https://'))) {
      return fallbackUri;
    }

    const cacheKey = `${projectId}:${assetId}`;
    if (this.blobUrlCache.has(cacheKey)) {
      return this.blobUrlCache.get(cacheKey)!;
    }

    try {
      const db = await this.getIndexedDB();
      const record = await new Promise<{ blob: Blob } | undefined>((resolve, reject) => {
        const tx = db.transaction(this.idbStore, 'readonly');
        const store = tx.objectStore(this.idbStore);
        const req = store.get(cacheKey);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (record?.blob) {
        const url = URL.createObjectURL(record.blob);
        this.blobUrlCache.set(cacheKey, url);
        return url;
      }
    } catch (e) {
      // ignore
    }

    return fallbackUri || '';
  }

  // --- 辅助类型转换 ---

  private toBlob(data: string | Blob | Uint8Array, mimeType: string): Blob {
    if (data instanceof Blob) return data;
    if (data instanceof Uint8Array) return new Blob([data as unknown as BlobPart], { type: mimeType });
    if (typeof data === 'string') {
      if (data.startsWith('data:')) {
        const parts = data.split(',');
        const binary = atob(parts[1] || '');
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        return new Blob([array], { type: mimeType });
      }
      return new Blob([data], { type: mimeType });
    }
    return new Blob([], { type: mimeType });
  }

  private toUint8Array(data: string | Blob | Uint8Array): Uint8Array {
    if (data instanceof Uint8Array) return data;
    if (typeof data === 'string' && data.startsWith('data:')) {
      const parts = data.split(',');
      const binary = atob(parts[1] || '');
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      return array;
    }
    if (typeof data === 'string') {
      return new TextEncoder().encode(data);
    }
    return new Uint8Array(0);
  }

  private inferMimeType(data: unknown, fileName?: string): string {
    if (fileName) {
      if (fileName.endsWith('.png')) return 'image/png';
      if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return 'image/jpeg';
      if (fileName.endsWith('.webp')) return 'image/webp';
      if (fileName.endsWith('.mp3')) return 'audio/mpeg';
      if (fileName.endsWith('.wav')) return 'audio/wav';
      if (fileName.endsWith('.mp4')) return 'video/mp4';
      if (fileName.endsWith('.webm')) return 'video/webm';
    }
    if (typeof data === 'string' && data.startsWith('data:')) {
      const match = data.match(/^data:([^;]+);/);
      if (match) return match[1];
    }
    return 'application/octet-stream';
  }

  private mimeToExtension(mime: string): string {
    const map: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
    };
    return map[mime] || 'bin';
  }
}

export const assetPersistenceBridge = new AssetPersistenceBridge();
