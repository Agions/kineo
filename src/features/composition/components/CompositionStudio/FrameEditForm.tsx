/**
 * 帧编辑表单组件
 *
 * form refactor 2026-06-04: 原 <Form>/<FormItem> 桥接被移除。
 * 原实现是死壳：Slider/InputNumber/Select 全未绑 value/onChange，
 * 纯展示骨架。改成原生受控 state + 显式 save 按钮调用 onSave。
 */

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { Row, Col } from '@/components/ui/grid';
import { InputNumber } from '@/components/ui/input-number';
import { AntDSelect as Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { CameraMotionConfig, FrameAnimation } from '@/common/types/composition';

import { CAMERA_MOTION_OPTIONS, renderOptionItems } from './constants';

interface FrameEditFormProps {
  frameId: string;
  initialValues?: FrameAnimation;
  onSave: (values: Partial<FrameAnimation>) => void;
  onReset: () => void;
}

const FrameEditForm = ({
  frameId: _frameId,
  initialValues,
  onSave,
  onReset,
}: FrameEditFormProps) => {
  const [cameraMotion, setCameraMotion] = useState<CameraMotionConfig['type'] | undefined>(
    initialValues?.cameraMotion?.type
  );
  const [cameraDuration, setCameraDuration] = useState<number>(
    initialValues?.cameraMotion?.duration ?? 1
  );
  const [cameraIntensity, setCameraIntensity] = useState<number>(
    initialValues?.cameraMotion?.intensity ?? 0.5
  );
  const [zoom, setZoom] = useState<number>(initialValues?.zoom ?? 1);
  const [panX, setPanX] = useState<number>(initialValues?.pan?.x ?? 0);
  const [panY, setPanY] = useState<number>(initialValues?.pan?.y ?? 0);
  const [rotation, setRotation] = useState<number>(initialValues?.rotation ?? 0);
  const [opacity, setOpacity] = useState<number>(initialValues?.opacity ?? 1);
  const [blur, setBlur] = useState<number>(initialValues?.filters?.blur ?? 0);
  const [brightness, setBrightness] = useState<number>(initialValues?.filters?.brightness ?? 100);
  const [contrast, setContrast] = useState<number>(initialValues?.filters?.contrast ?? 100);
  const [saturation, setSaturation] = useState<number>(initialValues?.filters?.saturation ?? 100);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      cameraMotion: cameraMotion
        ? { type: cameraMotion, duration: cameraDuration, intensity: cameraIntensity }
        : null,
      zoom,
      pan: { x: panX, y: panY },
      rotation,
      opacity,
      filters: { blur, brightness, contrast, saturation },
    });
  };

  return (
    <form onSubmit={handleSave}>
      <Divider orientation="left">镜头运动</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <label className="block text-sm font-medium mb-1">运动类型</label>
          <Select
            value={cameraMotion}
            onChange={(v) => {
              if (typeof v === 'string') setCameraMotion(v as CameraMotionConfig['type']);
            }}
            placeholder="选择镜头运动"
          >
            {renderOptionItems(CAMERA_MOTION_OPTIONS)}
          </Select>
        </Col>
        <Col span={12}>
          <label className="block text-sm font-medium mb-1">持续时间 (秒)</label>
          <InputNumber
            min={0.1}
            max={10}
            style={{ width: '100%' }}
            value={cameraDuration}
            onChange={(v) => setCameraDuration(v as number)}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <label className="block text-sm font-medium mb-1">运动强度</label>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={cameraIntensity}
            onChange={(v) => setCameraIntensity(v as number)}
          />
        </Col>
        <Col span={12}>
          <label className="block text-sm font-medium mb-1">缩放</label>
          <Slider
            min={0.1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(v) => setZoom(v as number)}
          />
        </Col>
      </Row>

      <Divider orientation="left">几何变换</Divider>
      <Row gutter={16}>
        <Col span={8}>
          <label className="block text-sm font-medium mb-1">平移 X</label>
          <InputNumber
            min={-100}
            max={100}
            style={{ width: '100%' }}
            value={panX}
            onChange={(v) => setPanX(v as number)}
          />
        </Col>
        <Col span={8}>
          <label className="block text-sm font-medium mb-1">平移 Y</label>
          <InputNumber
            min={-100}
            max={100}
            style={{ width: '100%' }}
            value={panY}
            onChange={(v) => setPanY(v as number)}
          />
        </Col>
        <Col span={8}>
          <label className="block text-sm font-medium mb-1">旋转角度</label>
          <InputNumber
            min={-180}
            max={180}
            style={{ width: '100%' }}
            value={rotation}
            onChange={(v) => setRotation(v as number)}
          />
        </Col>
      </Row>
      <label className="block text-sm font-medium mb-1">透明度</label>
      <Slider
        min={0}
        max={1}
        step={0.05}
        value={opacity}
        onChange={(v) => setOpacity(v as number)}
      />

      <Divider orientation="left">滤镜</Divider>
      <Row gutter={16}>
        <Col span={8}>
          <label className="block text-sm font-medium mb-1">模糊</label>
          <Slider min={0} max={10} step={0.5} value={blur} onChange={(v) => setBlur(v as number)} />
        </Col>
        <Col span={8}>
          <label className="block text-sm font-medium mb-1">亮度</label>
          <Slider
            min={0}
            max={200}
            value={brightness}
            onChange={(v) => setBrightness(v as number)}
          />
        </Col>
        <Col span={8}>
          <label className="block text-sm font-medium mb-1">对比度</label>
          <Slider min={0} max={200} value={contrast} onChange={(v) => setContrast(v as number)} />
        </Col>
      </Row>
      <label className="block text-sm font-medium mb-1">饱和度</label>
      <Slider min={0} max={200} value={saturation} onChange={(v) => setSaturation(v as number)} />

      <div className="flex gap-2 mt-4">
        <Button type="primary" htmlType="submit">
          保存
        </Button>
        <Button type="default" onClick={onReset}>
          重置
        </Button>
      </div>
    </form>
  );
};

export default FrameEditForm;
