import { Plus, Edit, Copy, Trash2 } from 'lucide-react';
import React, { useCallback, memo } from 'react';

import { Button } from '@/components/ui/button';
import Empty from '@/components/ui/empty';
import { List } from '@/components/ui/list';
import { Popconfirm } from '@/components/ui/popconfirm';
import { Tag } from '@/components/ui/tag';
import { Tooltip } from '@/components/ui/tooltip';
import { Text, Title } from '@/components/ui/typography';

import { ATMOSPHERE_OPTIONS } from '../constants';
import styles from '../SceneRenderer.module.less';
import { Scene } from '../types';

interface SceneListProps {
  scenes: Scene[];
  selectedScene: Scene | null;
  onSelectScene: (scene: Scene) => void;
  onAddScene: () => void;
  onRemoveScene: (id: string) => void;
  onDuplicateScene: (scene: Scene) => void;
  getSceneTypeIcon: (type: string) => React.ReactNode;
  getAtmosphereColor: (atmosphere: string) => string;
}

interface SceneItemProps {
  scene: Scene;
  isSelected: boolean;
  onSelectScene: (scene: Scene) => void;
  onDuplicateScene: (scene: Scene) => void;
  onRemoveScene: (id: string) => void;
  getSceneTypeIcon: (type: string) => React.ReactNode;
  getAtmosphereColor: (atmosphere: string) => string;
}

const SceneItem = memo(function SceneItem({
  scene,
  isSelected,
  onSelectScene,
  onDuplicateScene,
  onRemoveScene,
  getSceneTypeIcon,
  getAtmosphereColor,
}: SceneItemProps) {
  return (
    <List.Item
      className={`${styles.sceneItem} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelectScene(scene)}
    >
      <div className={styles.sceneItemContent}>
        <div className={styles.sceneIcon}>{getSceneTypeIcon(scene.type)}</div>
        <div className={styles.sceneInfo}>
          <Text className={styles.sceneName} ellipsis>
            {scene.name}
          </Text>
          <Tag color={getAtmosphereColor(scene.atmosphere)} className={styles.atmosphereTag}>
            {ATMOSPHERE_OPTIONS.find((a) => a.value === scene.atmosphere)?.label ??
              scene.atmosphere}
          </Tag>
        </div>
        <div className={styles.sceneActions}>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<Edit />}
              onClick={(e) => {
                e.stopPropagation();
                onSelectScene(scene);
              }}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="text"
              size="small"
              icon={<Copy />}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateScene(scene);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此场景?"
            onConfirm={() => onRemoveScene(scene.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 />}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </div>
      </div>
    </List.Item>
  );
});

export const SceneList: React.FC<SceneListProps> = ({
  scenes,
  selectedScene,
  onSelectScene,
  onAddScene,
  onRemoveScene,
  onDuplicateScene,
  getSceneTypeIcon,
  getAtmosphereColor,
}) => {
  const renderItem = useCallback(
    (scene: Scene) => (
      <SceneItem
        scene={scene}
        isSelected={selectedScene?.id === scene.id}
        onSelectScene={onSelectScene}
        onDuplicateScene={onDuplicateScene}
        onRemoveScene={onRemoveScene}
        getSceneTypeIcon={getSceneTypeIcon}
        getAtmosphereColor={getAtmosphereColor}
      />
    ),
    [
      selectedScene,
      onSelectScene,
      onDuplicateScene,
      onRemoveScene,
      getSceneTypeIcon,
      getAtmosphereColor,
    ]
  );

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <Title level={5} className={styles.sidebarTitle}>
          场景列表
        </Title>
        <Button type="primary" icon={<Plus />} size="small" onClick={onAddScene}>
          新建场景
        </Button>
      </div>

      <div className={styles.sceneList}>
        {scenes.length === 0 ? (
          <Empty image={undefined} description="暂无场景" className={styles.emptyState} />
        ) : (
          <List dataSource={scenes} renderItem={renderItem} />
        )}
      </div>

      <div className={styles.sidebarFooter}>
        <Text type="secondary">共 {scenes.length} 个场景</Text>
      </div>
    </div>
  );
};
