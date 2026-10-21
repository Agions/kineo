import {
  Upload as LucideUpload,
  MoreHorizontal,
  Video,
  FileImage,
  FileText,
  Mic,
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { EmptyState } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/toast';
import { Upload } from '@/components/ui/upload';
import { formatDuration, formatSizeMB } from '@/common/utils';
import { handleAsyncError } from '@/common/utils/async';
import { assetService, Asset } from '@/core/services/project/asset-service';
import { logger } from '@/core/utils/logger';

import styles from './AssetPanel.module.less';

interface AssetPanelProps {
  projectId?: string;
}

function AssetPanel({ projectId }: AssetPanelProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 加载资产数据
  const loadAssets = useCallback(() => {
    setLoading(true);
    try {
      const allAssets = assetService.getAll(projectId);
      setAssets(allAssets);
    } catch (error) {
      handleAsyncError(error, 'Failed to load assets', { toastMessage: '加载素材失败' });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAssets();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadAssets]);

  // 过滤显示的素材
  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) => {
        if (activeTab !== 'all' && asset.type !== activeTab) {
          return false;
        }
        if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        return true;
      }),
    [assets, activeTab, searchQuery]
  );

  // 删除素材
  const handleDelete = useCallback((id: string) => {
    if (assetService.delete(id)) {
      setAssets((prev) => prev.filter((asset) => asset.id !== id));
      toast.success('素材已删除');
    }
  }, []);

  // 添加到时间轴
  const addToTimeline = useCallback((asset: Asset) => {
    logger.info('添加到时间轴', asset);
  }, []);

  // 渲染素材缩略图或图标
  const renderThumbnail = (asset: Asset) => {
    switch (asset.type) {
      case 'video':
        return asset.thumbnail ? (
          <img src={asset.thumbnail} className={styles.thumbnail} alt={asset.name} />
        ) : (
          <div className={styles.assetIconContainer}>
            <Video className={styles.assetIcon} />
          </div>
        );
      case 'audio':
        return (
          <div className={styles.assetIconContainer}>
            <Mic className={styles.assetIcon} />
          </div>
        );
      case 'image':
        return asset.thumbnail ? (
          <img src={asset.thumbnail} className={styles.thumbnail} alt={asset.name} />
        ) : (
          <div className={styles.assetIconContainer}>
            <FileImage className={styles.assetIcon} />
          </div>
        );
      case 'text':
        return (
          <div className={styles.assetIconContainer}>
            <FileText className={styles.assetIcon} />
          </div>
        );
      default:
        return null;
    }
  };

  // 上传素材处理
  const handleUpload = useCallback(
    async (info: { file: File }) => {
      const file = info.file;

      try {
        const type = file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
            ? 'audio'
            : file.type.startsWith('image/')
              ? 'image'
              : 'text';

        const asset = assetService.add({
          name: file.name,
          type,
          src: URL.createObjectURL(file),
          size: file.size / (1024 * 1024),
          tags: [],
          projectId,
        });

        setAssets((prev) => [asset, ...prev]);
        toast.success('素材上传成功');
      } catch (error) {
        handleAsyncError(error, 'Upload failed', { toastMessage: '上传失败' });
      }
    },
    [projectId]
  );

  // 素材项操作菜单
  const getAssetMenuItems = useCallback(
    (id: string) => [
      {
        key: '1',
        label: '重命名',
        onClick: () => logger.info('重命名', id),
      },
      {
        key: '2',
        label: '下载',
        onClick: () => logger.info('下载', id),
      },
      {
        key: '3',
        label: '复制',
        onClick: () => logger.info('复制', id),
      },
      {
        type: 'divider' as const,
      },
      {
        key: '4',
        label: '删除',
        danger: true,
        onClick: () => handleDelete(id),
      },
    ],
    [handleDelete]
  );

  return (
    <div className={styles.assetPanelContainer}>
      <div className={styles.assetSearch}>
        <Input
          placeholder="搜索素材..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" className={styles.assetTabs} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="video">视频</TabsTrigger>
          <TabsTrigger value="audio">音频</TabsTrigger>
          <TabsTrigger value="image">图片</TabsTrigger>
          <TabsTrigger value="text">文本</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className={styles.uploadContainer}>
        <Upload multiple showUploadList={false} customRequest={handleUpload}>
          <Button variant="outline" className="w-full">
            <LucideUpload className="h-4 w-4 mr-2" />
            上传素材
          </Button>
        </Upload>
      </div>

      <div className={styles.assetList}>
        {loading ? (
          <EmptyState title="加载中..." description="正在获取素材数据" />
        ) : filteredAssets.length > 0 ? (
          filteredAssets.map((asset) => (
            <div key={asset.id} className={styles.assetItem}>
              <div
                className={styles.assetContent}
                onClick={() => addToTimeline(asset)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') addToTimeline(asset);
                }}
                role="button"
                tabIndex={0}
              >
                <div className={styles.assetPreview}>
                  {renderThumbnail(asset)}
                  {asset.duration && (
                    <div className={styles.assetDuration}>{formatDuration(asset.duration)}</div>
                  )}
                </div>
                <div className={styles.assetInfo}>
                  <div className={styles.assetName} title={asset.name}>
                    {asset.name}
                  </div>
                  <div className={styles.assetDetails}>
                    <span className={styles.assetSize}>{formatSizeMB(asset.size)}</span>
                    {asset.tags.map((tag) => (
                      <span key={tag} className={styles.assetTag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Dropdown
                menu={{ items: getAssetMenuItems(asset.id) }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  variant="ghost"
                  className={styles.assetMenuButton}
                  icon={<MoreHorizontal />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </div>
          ))
        ) : (
          <EmptyState
            title={
              searchQuery
                ? '没有找到匹配的素材'
                : activeTab === 'all'
                  ? '没有素材'
                  : `没有${activeTab === 'video' ? '视频' : activeTab === 'audio' ? '音频' : activeTab === 'image' ? '图片' : '文本'}素材`
            }
            description={searchQuery ? '请尝试其他搜索词' : '点击上方按钮上传素材'}
          />
        )}
      </div>
    </div>
  );
}

export default AssetPanel;
