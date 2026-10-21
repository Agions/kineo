/**
 * 资产服务
 * 统一的素材资产管理（localStorage 实现）
 */

import { STORAGE_KEYS } from '@/core/constants/app-config';
import { assetPersistenceBridge } from '@/core/services/data-bus/AssetPersistenceBridge';
import { logger } from '@/core/utils/logger';

export interface Asset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text';
  src: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  tags: string[];
  createdAt: string;
  projectId?: string;
}

const ASSET_STORAGE_KEY = STORAGE_KEYS.ASSETS;

function createAssetRecord(asset: Omit<Asset, 'id' | 'createdAt'>): Asset {
  return {
    ...asset,
    id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
}

class AssetService {
  private cache: Map<string, Asset> = new Map();

  private loadFromStorage(): Asset[] {
    try {
      const data = localStorage.getItem(ASSET_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      logger.error('Failed to load assets from storage');
      return [];
    }
  }

  private saveToStorage(assets: Asset[]): void {
    try {
      localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(assets));
    } catch (e) {
      logger.warn('Failed to save assets to storage, checking storage quota...', e);
      try {
        const lightweight = assets.map((a) => {
          if (a.src && a.src.startsWith('data:') && a.src.length > 1024) {
            return { ...a, src: `idb://${a.id}` };
          }
          return a;
        });
        localStorage.setItem(ASSET_STORAGE_KEY, JSON.stringify(lightweight));
      } catch (inner) {
        logger.error('Failed to save lightweight assets to storage', inner);
      }
    }
  }

  getAll(projectId?: string): Asset[] {
    const assets = this.loadFromStorage();
    if (projectId) {
      return assets.filter((a) => a.projectId === projectId);
    }
    return assets;
  }

  getById(id: string): Asset | null {
    if (this.cache.has(id)) return this.cache.get(id)!;
    const assets = this.loadFromStorage();
    const asset = assets.find((a) => a.id === id) || null;
    if (asset) this.cache.set(id, asset);
    return asset;
  }

  add(asset: Omit<Asset, 'id' | 'createdAt'>): Asset {
    const newAsset = createAssetRecord(asset);

    if (newAsset.src && newAsset.src.startsWith('data:') && newAsset.src.length > 1024) {
      const pid = newAsset.projectId || 'global';
      void assetPersistenceBridge
        .persistAsset(pid, newAsset.id, newAsset.src, {
          fileName: newAsset.name,
        })
        .then((meta) => {
          newAsset.src = meta.uri;
          this.cache.set(newAsset.id, newAsset);
          const current = this.loadFromStorage();
          const idx = current.findIndex((a) => a.id === newAsset.id);
          if (idx >= 0) {
            current[idx].src = meta.uri;
            this.saveToStorage(current);
          }
        })
        .catch((err) => {
          logger.warn('[AssetService] 异步卸载资产失败:', err);
        });
    }

    const assets = this.loadFromStorage();
    assets.push(newAsset);
    this.saveToStorage(assets);
    this.cache.set(newAsset.id, newAsset);
    logger.info('Asset added', newAsset.name);
    return newAsset;
  }

  addMany(newAssets: Omit<Asset, 'id' | 'createdAt'>[]): Asset[] {
    const assets = this.loadFromStorage();
    const created: Asset[] = [];
    for (const asset of newAssets) {
      const newAsset = createAssetRecord(asset);
      assets.push(newAsset);
      this.cache.set(newAsset.id, newAsset);
      created.push(newAsset);
    }
    this.saveToStorage(assets);
    logger.info(`${created.length} assets added`);
    return created;
  }

  update(id: string, updates: Partial<Asset>): Asset | null {
    const assets = this.loadFromStorage();
    const index = assets.findIndex((a) => a.id === id);
    if (index < 0) return null;
    assets[index] = { ...assets[index], ...updates };
    this.saveToStorage(assets);
    this.cache.set(id, assets[index]);
    return assets[index];
  }

  delete(id: string): boolean {
    const assets = this.loadFromStorage();
    const filtered = assets.filter((a) => a.id !== id);
    if (filtered.length === assets.length) return false;
    this.saveToStorage(filtered);
    this.cache.delete(id);
    logger.info('Asset deleted', id);
    return true;
  }

  search(query: string, type?: Asset['type']): Asset[] {
    const assets = this.loadFromStorage();
    const lowerQuery = query.toLowerCase();
    return assets.filter((a) => {
      if (type && a.type !== type) return false;
      return (
        a.name.toLowerCase().includes(lowerQuery) ||
        a.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  getByType(type: Asset['type'], projectId?: string): Asset[] {
    const assets = this.loadFromStorage();
    return assets.filter((a) => {
      if (a.type !== type) return false;
      if (projectId && a.projectId !== projectId) return false;
      return true;
    });
  }

  getStats(): { total: number; byType: Record<Asset['type'], number> } {
    const assets = this.loadFromStorage();
    const byType: Record<Asset['type'], number> = { video: 0, audio: 0, image: 0, text: 0 };
    for (const asset of assets) byType[asset.type]++;
    return { total: assets.length, byType };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const assetService = new AssetService();
