/**
 * TTS 音色数据表
 *
 * 从 tts-service.ts 提取：6 个 provider × 共 23 个音色的静态配置。
 * 单一大数据表独立成模块便于：
 *   1. 后续按 provider 拆为多文件（edge-voices.ts / azure-voices.ts …）
 *   2. 单元测试可单独 mock 该映射
 *   3. UI 层按需 import 减小 bundle 体积
 */

import type { TTSProvider, TTSVoice } from '@/core/types';

/** 全部 provider 的音色映射表 */
export const TTS_VOICES: Record<TTSProvider, TTSVoice[]> = {
  edge: [
    {
      id: 'zh-CN-XiaoxiaoNeural',
      name: '晓晓',
      gender: 'female',
      language: 'zh-CN',
      provider: 'edge',
      style: 'newscast',
    },
    {
      id: 'zh-CN-YunxiNeural',
      name: '云希',
      gender: 'male',
      language: 'zh-CN',
      provider: 'edge',
      style: 'newscast',
    },
    {
      id: 'zh-CN-YunyangNeural',
      name: '云扬',
      gender: 'male',
      language: 'zh-CN',
      provider: 'edge',
      style: 'newscast',
    },
    {
      id: 'zh-CN-XiaoyiNeural',
      name: '小艺',
      gender: 'female',
      language: 'zh-CN',
      provider: 'edge',
      style: 'affectionate',
    },
    {
      id: 'zh-CN-YunhaoNeural',
      name: '云浩',
      gender: 'male',
      language: 'zh-CN',
      provider: 'edge',
      style: 'advertisement',
    },
    {
      id: 'zh-CN-XiaoxuanNeural',
      name: '小璇',
      gender: 'female',
      language: 'zh-CN',
      provider: 'edge',
      style: 'customerservice',
    },
    {
      id: 'en-US-JennyNeural',
      name: 'Jenny',
      gender: 'female',
      language: 'en-US',
      provider: 'edge',
      style: 'newscast',
    },
    {
      id: 'en-US-GuyNeural',
      name: 'Guy',
      gender: 'male',
      language: 'en-US',
      provider: 'edge',
      style: 'newscast',
    },
  ],
  azure: [
    {
      id: 'zh-CN-XiaoxiaoAzureNeural',
      name: '晓晓',
      gender: 'female',
      language: 'zh-CN',
      provider: 'azure',
    },
    {
      id: 'zh-CN-YunxiAzureNeural',
      name: '云希',
      gender: 'male',
      language: 'zh-CN',
      provider: 'azure',
    },
    {
      id: 'en-US-JennyNeural',
      name: 'Jenny',
      gender: 'female',
      language: 'en-US',
      provider: 'azure',
    },
  ],
  aliyun: [
    { id: 'xiaoyun', name: '云小朵', gender: 'female', language: 'zh-CN', provider: 'aliyun' },
    { id: 'xiaogang', name: '阿钢', gender: 'male', language: 'zh-CN', provider: 'aliyun' },
    { id: 'ruoxi', name: '若曦', gender: 'female', language: 'zh-CN', provider: 'aliyun' },
  ],
  baidu: [
    { id: '0', name: '度小美', gender: 'female', language: 'zh-CN', provider: 'baidu' },
    { id: '1', name: '度小宇', gender: 'male', language: 'zh-CN', provider: 'baidu' },
    { id: '3', name: '度米朵', gender: 'female', language: 'zh-CN', provider: 'baidu' },
    { id: '4', name: '阿靖小宇', gender: 'male', language: 'zh-CN', provider: 'baidu' },
  ],
  iflytek: [
    { id: 'xiaoyan', name: '小燕', gender: 'female', language: 'zh-CN', provider: 'iflytek' },
    { id: 'xiaoyu', name: '小宇', gender: 'male', language: 'zh-CN', provider: 'iflytek' },
    {
      id: 'catherine',
      name: 'Catherine',
      gender: 'female',
      language: 'en-US',
      provider: 'iflytek',
    },
  ],
  cosyvoice: [
    {
      id: 'cosyvoice-v2-emo-female-na',
      name: 'Emo 女生',
      gender: 'female',
      language: 'zh-CN',
      provider: 'cosyvoice',
    },
    {
      id: 'cosyvoice-v2-emo-male-na',
      name: 'Emo 男生',
      gender: 'male',
      language: 'zh-CN',
      provider: 'cosyvoice',
    },
  ],
};
