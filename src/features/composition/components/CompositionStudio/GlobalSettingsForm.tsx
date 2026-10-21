/**
 * 合成全局设置表单组件
 *
 * form refactor 2026-06-04: 原 <Form>/<FormItem> 桥接被移除。
 * 该组件原本就只是表单骨架的占位实现 (Slider/InputNumber/Select 都未绑
 * value/onChange 双向绑定)，改成原生受控 state 即可，无功能损失。
 */

import React, { useState } from 'react';

import { Divider } from '@/components/ui/divider';
import { Row, Col } from '@/components/ui/grid';
import { InputNumber } from '@/components/ui/input-number';
import { SelectItem, AntDSelect as Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { TransitionConfig, TransitionEffect } from '@/common/types';

interface GlobalSettingsFormProps {
  initialValues: {
    frameDuration: number;
    defaultTransition: TransitionConfig;
    transitions?: TransitionConfig[];
  };
  onSave: (values: {
    frameDuration: number;
    defaultTransition: { effect: TransitionEffect; duration: number; easing?: string };
    transitions?: TransitionConfig[];
  }) => void;
}

import { TRANSITION_OPTIONS, renderOptionItems } from './constants';

function GlobalSettingsForm({ initialValues, onSave }: GlobalSettingsFormProps) {
  const [frameDuration, setFrameDuration] = useState<number>(initialValues.frameDuration);
  const [effect, setEffect] = useState<TransitionEffect>(initialValues.defaultTransition.effect);
  const [transitionDuration, setTransitionDuration] = useState<number>(
    initialValues.defaultTransition.duration
  );
  const [easing, setEasing] = useState<string | undefined>(initialValues.defaultTransition.easing);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      frameDuration,
      defaultTransition: { effect, duration: transitionDuration, easing },
      transitions: initialValues.transitions,
    });
  };

  return (
    <form onSubmit={handleSave}>
      <label className="block text-sm font-medium mb-1">默认帧时长 (秒)</label>
      <Slider
        min={1}
        max={10}
        step={0.5}
        value={frameDuration}
        onChange={(v) => setFrameDuration(v as number)}
      />

      <Divider orientation="left">默认转场</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <label className="block text-sm font-medium mb-1">转场效果</label>
          <Select value={effect} onChange={(v) => setEffect(v as TransitionEffect)}>
            {renderOptionItems(TRANSITION_OPTIONS)}
          </Select>
        </Col>
        <Col span={12}>
          <label className="block text-sm font-medium mb-1">转场时长 (秒)</label>
          <InputNumber
            min={0.1}
            max={5}
            step={0.1}
            style={{ width: '100%' }}
            value={transitionDuration}
            onChange={(v) => setTransitionDuration(v as number)}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <label className="block text-sm font-medium mb-1">缓动函数</label>
          <Select value={easing} onChange={(v) => setEasing(v as string)}>
            <SelectItem value="linear">线性</SelectItem>
            <SelectItem value="ease-in">渐快</SelectItem>
            <SelectItem value="ease-out">渐慢</SelectItem>
            <SelectItem value="ease-in-out">先慢后快再慢</SelectItem>
          </Select>
        </Col>
      </Row>

      <Divider orientation="left">逐段转场配置（可选）</Divider>
      {/* 预留：分镜间转场配置，暂无 UI 需求 */}
      <div />
    </form>
  );
}

export default GlobalSettingsForm;
