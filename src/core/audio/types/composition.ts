/**
 * Composition/Animation Types
 * Extracted from src/shared/types/index.ts (lines 699-834)
 */

// ========== Character Appearance Types ==========

export interface CharacterAppearance {
  gender?: string;
  age?: string | number;
  hairStyle?: string;
  hairColor?: string;
  eyeColor?: string;
  skinTone?: string;
  bodyType?: string;
  height?: string | number;
  weight?: string | number;
  clothing?: string;
  features?: string[];
}

export interface ClothingItem {
  type: 'head' | 'top' | 'bottom' | 'shoes' | 'accessory';
  name: string;
  style: string;
  color: string;
  pattern?: string;
  material?: string;
}

export interface CharacterExpression {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  intensity?: 'subtle' | 'neutral' | 'strong' | 'exaggerated';
}

export interface CharacterConsistency {
  seed?: number;
  weights?: {
    appearance: number;
    voice: number;
    behavior: number;
  };
  referenceImages?: string[];
}

// ========== Camera & Motion Types ==========

export type CameraMotion =
  | 'static'
  | 'pan-left'
  | 'pan-right'
  | 'tilt-up'
  | 'tilt-down'
  | 'dolly-in'
  | 'dolly-out'
  | 'zoom-in'
  | 'zoom-out'
  | 'shake'
  | 'sway'
  | 'follow';

export type TransitionEffect =
  | 'none'
  | 'fade'
  | 'crossfade'
  | 'dissolve'
  | 'wipe-left'
  | 'wipe-right'
  | 'wipe-up'
  | 'wipe-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom'
  | 'blur';

export type AnimationProperty =
  | 'position-x'
  | 'position-y'
  | 'scale'
  | 'rotation'
  | 'opacity'
  | 'zoom'
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'saturation'
  | 'pan-x'
  | 'pan-y';

export interface AnimationKeyframe {
  time: number;
  property: AnimationProperty;
  value: number;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface CameraMotionConfig {
  type: CameraMotion;
  duration: number;
  intensity: number;
  easing?: string;
  startPoint?: { x: number; y: number };
  endPoint?: { x: number; y: number };
}

export interface TransitionConfig {
  effect: TransitionEffect;
  duration: number;
  easing?: string;
  color?: string;
}

export interface FrameAnimation {
  frameId: string;
  cameraMotion: CameraMotionConfig | null;
  keyframes?: AnimationKeyframe[];
  zoom?: number;
  pan?: { x: number; y: number };
  rotation?: number;
  opacity?: number;
  filters?: {
    blur?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
  };
}

export interface CompositionProject {
  id: string;
  projectId: string;
  frames: FrameAnimation[];
  transitions: TransitionConfig[];
  masterSettings: {
    frameDuration: number;
    defaultTransition: TransitionConfig;
    globalEffects?: string[];
  };
  previewState?: {
    currentFrameIndex: number;
    isPlaying: boolean;
    playbackSpeed: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Export settings (used by ExportPanel + StepComposition; previously @/core/types).
 * Canonical definition — VideoExporter re-exports this type.
 */
export interface ExportSettings {
  format: import('@/core/constants/media-presets').ExportFormat;
  resolution: import('@/core/constants/media-presets').Resolution;
  frameRate: import('@/core/constants/media-presets').FrameRate;
  quality: string;
  filename: string;
  [key: string]: unknown;
}

/**
 * Export record (used by export slice + project store; previously @/core/types).
 */
export interface ExportRecord {
  [key: string]: unknown;
}
