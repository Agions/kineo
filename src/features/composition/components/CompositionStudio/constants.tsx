/**
 * CompositionStudio 共享常量 + 工具
 */

import React from 'react';

import { SelectItem } from '@/components/ui/select';

export const TRANSITION_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'crossfade', label: '交叉淡化' },
  { value: 'dissolve', label: '溶解' },
  { value: 'wipe-left', label: '左擦除' },
  { value: 'wipe-right', label: '右擦除' },
  { value: 'wipe-up', label: '上擦除' },
  { value: 'wipe-down', label: '下擦除' },
  { value: 'slide-left', label: '左滑入' },
  { value: 'slide-right', label: '右滑入' },
  { value: 'zoom', label: '缩放过渡' },
  { value: 'blur', label: '模糊过渡' },
] as const;

export const CAMERA_MOTION_OPTIONS = [
  { value: 'static', label: '静止' },
  { value: 'pan-left', label: '左摇' },
  { value: 'pan-right', label: '右摇' },
  { value: 'tilt-up', label: '上仰' },
  { value: 'tilt-down', label: '下俯' },
  { value: 'dolly-in', label: '推进' },
  { value: 'dolly-out', label: '拉远' },
  { value: 'zoom-in', label: '放大' },
  { value: 'zoom-out', label: '缩小' },
  { value: 'shake', label: '抖动' },
] as const;

export interface LabeledOption {
  value: string;
  label: string;
}

/**
 * 把 options 数组映射为 <SelectItem> 列表。
 * 用于 SELECT 中渲染 TRANSITION_OPTIONS / CAMERA_MOTION_OPTIONS 等。
 */
export function renderOptionItems(options: readonly LabeledOption[]): React.ReactElement[] {
  return options.map((opt) => (
    <SelectItem key={opt.value} value={opt.value}>
      {opt.label}
    </SelectItem>
  ));
}
