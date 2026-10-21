/**
 * 角色预设模板库
 * 提供常用角色类型的预设配置
 */

import type {
  CharacterAppearance,
  ClothingItem,
  CharacterExpression,
  CharacterConsistency,
} from '@/core/types';

// 基础模板类型
export interface CharacterTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail?: string;
  appearance: CharacterAppearance;
  clothing: ClothingItem[];
  expressions: CharacterExpression[];
  consistency: CharacterConsistency;
  tags: string[];
  recommendedVoice?: {
    provider: 'edge' | 'azure' | 'aliyun' | 'baidu' | 'cosyvoice';
    voiceId: string;
    pitch?: number;
    speed?: number;
  };
}

// 预设模板库
export const CHARACTER_TEMPLATES: CharacterTemplate[] = [
  {
    id: 'template_hero_male_01',
    name: ' heroic 男主',
    category: 'protagonist',
    description: '年轻男主角，阳光帅气，适合热血故事',
    thumbnail: '/templates/hero-male-01.png',
    appearance: {
      gender: 'male',
      age: 22,
      hairStyle: '短发',
      hairColor: '#000000',
      eyeColor: '#3d8bff',
      skinTone: '#f5d0c5',
      bodyType: 'athletic',
      height: 178,
      features: [],
    },
    clothing: [
      { type: 'top', name: '夹克', style: '休闲', color: '#1e3a5f' },
      { type: 'bottom', name: '牛仔裤', style: '休闲', color: '#2c3e50' },
      { type: 'shoes', name: '运动鞋', style: '运动', color: '#ffffff' },
    ],
    expressions: [
      { id: 'exp_001', name: '微笑', description: '温和的微笑', intensity: 'neutral' },
      { id: 'exp_002', name: '坚定', description: '目光坚定', intensity: 'strong' },
      { id: 'exp_003', name: '惊讶', description: '睁大眼睛', intensity: 'exaggerated' },
    ],
    consistency: { seed: 12345 },
    tags: ['男主', '阳光', '热血', '年轻人'],
    recommendedVoice: { provider: 'edge', voiceId: 'zh-CN-YunxiNeural', pitch: 1.0, speed: 1.0 },
  },
  {
    id: 'template_hero_female_01',
    name: ' heroic 女主',
    category: 'protagonist',
    description: '女主角，聪明勇敢，现代都市风格',
    appearance: {
      gender: 'female',
      age: 20,
      hairStyle: '长发',
      hairColor: '#4a2c2a',
      eyeColor: '#5d4037',
      skinTone: '#f5d0c5',
      bodyType: 'average',
      height: 165,
      features: [],
    },
    clothing: [
      { type: 'top', name: '衬衫', style: '职业', color: '#ffffff' },
      { type: 'bottom', name: '西裤', style: '职业', color: '#2c3e50' },
      { type: 'accessory', name: '眼镜', style: '商务', color: '#000000' },
    ],
    expressions: [
      { id: 'exp_001', name: '思考', description: '认真思考', intensity: 'subtle' },
      { id: 'exp_002', name: '微笑', description: '温柔微笑', intensity: 'neutral' },
      { id: 'exp_003', name: '惊讶', description: '微微张嘴', intensity: 'neutral' },
    ],
    consistency: { seed: 54321 },
    tags: ['女主', '聪明', '职业', '都市'],
    recommendedVoice: { provider: 'edge', voiceId: 'zh-CN-XiaoxiaoNeural', pitch: 1.1, speed: 1.0 },
  },
  {
    id: 'template_villain_male_01',
    name: '反派男主',
    category: 'antagonist',
    description: '反派角色，阴险狡诈，充满城府',
    appearance: {
      gender: 'male',
      age: 35,
      hairStyle: '背头',
      hairColor: '#2c2c2c',
      eyeColor: '#1a1a1a',
      skinTone: '#e0ac9f',
      bodyType: 'average',
      height: 175,
      features: ['scar'], // 疤痕
    },
    clothing: [
      { type: 'top', name: '风衣', style: '正装', color: '#000000' },
      { type: 'bottom', name: '西裤', style: '正装', color: '#1a1a1a' },
    ],
    expressions: [
      { id: 'exp_001', name: '冷笑', description: '嘴角上扬', intensity: 'subtle' },
      { id: 'exp_002', name: '愤怒', description: '眉头紧锁', intensity: 'strong' },
      { id: 'exp_003', name: '陰笑', description: '诡异的笑', intensity: 'exaggerated' },
    ],
    consistency: { seed: 99999 },
    tags: ['反派', '陰险', '成年', '商人'],
    recommendedVoice: { provider: 'edge', voiceId: 'zh-CN-YunjianNeural', pitch: 0.9, speed: 0.9 },
  },
  {
    id: 'template_support_elder_01',
    name: '长者导师',
    category: 'supporting',
    description: '智慧的长者，慈祥而严肃',
    appearance: {
      gender: 'male',
      age: 65,
      hairStyle: '白发',
      hairColor: '#e8e8e8',
      eyeColor: '#4a5568',
      skinTone: '#e0ac9f',
      bodyType: 'heavy',
      height: 168,
      features: ['beard'], // 胡须
    },
    clothing: [
      { type: 'top', name: '长袍', style: '传统', color: '#8b4513' },
      { type: 'accessory', name: '拐杖', style: '辅助', color: '#654321' },
    ],
    expressions: [
      { id: 'exp_001', name: '慈祥', description: '面带微笑', intensity: 'subtle' },
      { id: 'exp_002', name: '严肃', description: '表情凝重', intensity: 'neutral' },
      { id: 'exp_003', name: '欣慰', description: '点头微笑', intensity: 'neutral' },
    ],
    consistency: { seed: 11111 },
    tags: ['长者', '导师', '智慧', '传统'],
    recommendedVoice: { provider: 'edge', voiceId: 'zh-CN-YunxiaNeural', pitch: 0.95, speed: 0.85 },
  },
  {
    id: 'template_comic_relief_01',
    name: '搞笑配角',
    category: 'supporting',
    description: '喜剧角色，表情夸张，动作滑稽',
    appearance: {
      gender: 'male',
      age: 25,
      hairStyle: '乱发',
      hairColor: '#4a4a4a',
      eyeColor: '#228b22',
      skinTone: '#f5d0c5',
      bodyType: 'slim',
      height: 172,
      features: [],
    },
    clothing: [
      { type: 'top', name: 'T恤', style: '休闲', color: '#ff6b6b' },
      { type: 'bottom', name: '短裤', style: '休闲', color: '#4ecdc4' },
    ],
    expressions: [
      { id: 'exp_001', name: '开心', description: '大笑', intensity: 'exaggerated' },
      { id: 'exp_002', name: '委屈', description: '撇嘴', intensity: 'exaggerated' },
      { id: 'exp_003', name: '惊恐', description: '瞪大眼睛', intensity: 'exaggerated' },
    ],
    consistency: { seed: 77777 },
    tags: ['搞笑', '配角', '活泼', '年轻人'],
    recommendedVoice: { provider: 'edge', voiceId: 'zh-CN-XiaoyiNeural', pitch: 1.2, speed: 1.1 },
  },
];

// 分类统计
export const getTemplatesByCategory = (category?: string): CharacterTemplate[] => {
  if (!category) return CHARACTER_TEMPLATES;
  return CHARACTER_TEMPLATES.filter((t) => t.category === category);
};

// 根据 ID 获取模板
export const getTemplateById = (id: string): CharacterTemplate | undefined => {
  return CHARACTER_TEMPLATES.find((t) => t.id === id);
};
