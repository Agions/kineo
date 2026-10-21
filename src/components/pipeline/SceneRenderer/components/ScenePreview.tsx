import { Lightbulb, Cloud, Sun, Trash2 } from 'lucide-react';
import React from 'react';

import { Divider } from '@/components/ui/divider';
import Empty from '@/components/ui/empty';
import { Row, Col } from '@/components/ui/grid';
import { Popconfirm } from '@/components/ui/popconfirm';
import { Slider } from '@/components/ui/slider';
import { Space } from '@/components/ui/space';
import { Tag } from '@/components/ui/tag';
import { Text, Title } from '@/components/ui/typography';

import {
  SCENE_TYPE_OPTIONS,
  ATMOSPHERE_OPTIONS,
  LIGHTING_OPTIONS,
  WEATHER_OPTIONS,
  MapPin,
} from '../constants';
import styles from '../SceneRenderer.module.less';
import { Scene } from '../types';

interface ScenePreviewProps {
  scene: Scene | null;
  onUpdateScene: (id: string, field: keyof Scene, value: Scene[keyof Scene]) => void;
  onRemoveProp: (sceneId: string, propId: string) => void;
}

export const ScenePreview: React.FC<ScenePreviewProps> = ({
  scene,
  onUpdateScene,
  onRemoveProp,
}) => {
  if (!scene) {
    return (
      <div className={styles.preview}>
        <div className={styles.emptyPreview}>
          <Empty image={undefined} description="请选择或创建一个场景" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.preview}>
      <div className={styles.previewHeader}>
        <Title level={4} className={styles.previewName}>
          {scene.name}
        </Title>
        <Space>
          <Tag icon={SCENE_TYPE_OPTIONS.find((t) => t.value === scene.type)?.icon}>
            {SCENE_TYPE_OPTIONS.find((t) => t.value === scene.type)?.label ?? scene.type}
          </Tag>
          <Tag color={ATMOSPHERE_OPTIONS.find((a) => a.value === scene.atmosphere)?.color}>
            {ATMOSPHERE_OPTIONS.find((a) => a.value === scene.atmosphere)?.label ??
              scene.atmosphere}
          </Tag>
        </Space>
      </div>

      <div className={styles.previewImage}>
        {scene.imageUrl ? (
          <img src={scene.imageUrl} alt={scene.name} loading="lazy" decoding="async" />
        ) : (
          <div className={styles.previewPlaceholder}>
            <MapPin style={{ fontSize: 64, color: '#d9d9d9' }} />
            <Text type="secondary">场景预览区域</Text>
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <Text type="secondary">{scene.backgroundDescription || '请输入背景描述'}</Text>
            </div>
          </div>
        )}
      </div>

      <div className={styles.previewInfo}>
        <Row gutter={16}>
          <Col span={8}>
            <div className={styles.infoItem}>
              <Lightbulb />
              <Text>
                {LIGHTING_OPTIONS.find((l) => l.value === scene.lighting)?.label ?? scene.lighting}
              </Text>
            </div>
          </Col>
          <Col span={8}>
            <div className={styles.infoItem}>
              <Cloud />
              <Text>
                {WEATHER_OPTIONS.find((w) => w.value === scene.weather)?.label ?? scene.weather}
              </Text>
            </div>
          </Col>
          <Col span={8}>
            <div className={styles.infoItem}>
              <Sun />
              <Text>
                {scene.timeOfDay === 'day'
                  ? '白天'
                  : scene.timeOfDay === 'night'
                    ? '夜晚'
                    : scene.timeOfDay}
              </Text>
            </div>
          </Col>
        </Row>

        <Divider />

        <div className={styles.adjustmentPanel}>
          <Text strong>画面调整</Text>
          <Row gutter={16} style={{ marginTop: 12 }}>
            <Col span={8}>
              <Text type="secondary">亮度</Text>
              <Slider
                value={scene.brightness}
                onChange={(value) => onUpdateScene(scene.id, 'brightness', value)}
                min={0}
                max={100}
              />
            </Col>
            <Col span={8}>
              <Text type="secondary">饱和度</Text>
              <Slider
                value={scene.saturation}
                onChange={(value) => onUpdateScene(scene.id, 'saturation', value)}
                min={0}
                max={100}
              />
            </Col>
            <Col span={8}>
              <Text type="secondary">对比度</Text>
              <Slider
                value={scene.contrast}
                onChange={(value) => onUpdateScene(scene.id, 'contrast', value)}
                min={0}
                max={100}
              />
            </Col>
          </Row>
        </div>

        {scene.props.length > 0 && (
          <>
            <Divider />
            <div className={styles.propsPreview}>
              <Text strong>道具列表 ({scene.props.length})</Text>
              <div className={styles.propsList}>
                {scene.props.map((prop) => (
                  <Tag key={prop.id} className={styles.propTag}>
                    {prop.name}
                    <Popconfirm
                      title="确定删除此道具?"
                      onConfirm={() => onRemoveProp(scene.id, prop.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Trash2
                        style={{ marginLeft: 4, cursor: 'pointer' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </Tag>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
