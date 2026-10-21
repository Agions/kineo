/**
 * 2026 年最新 13 大 AI 官方平台全景目录（截止 2026 年 8 月最新发布，官方真实校准版）
 * 包含：腾讯 Hunyuan Hy3 / Hunyuan-T1，百度 ERNIE 5.1 / 5.0， DeepSeek-V4 等最新旗舰
 */
import type { AIModel } from '@/core/types';

export const AI_MODELS: AIModel[] = [
  // ==========================================
  // 📝 1. 文字大模型 (Text / LLM Models) - 2026年最新
  // ==========================================

  // ===== 腾讯云混元 (2026年最新发布：Hy3 旗舰 & Hunyuan-T1 深度推理) =====
  {
    id: 'hy3',
    name: '腾讯混元 Hy3 (hy3 官方 2026 最新)',
    provider: 'tencent',
    category: ['text', 'code'],
    description:
      '腾讯 2026 年最新 Hy3 旗舰大语言模型，256K 超长上下文，极其擅长中文短剧创作与多角色台词编写',
    features: ['2026 最新旗舰', 'Hy3 架构', '256K Context', '中文短剧剧本'],
    tokenLimit: 256000,
    isPro: true,
    contextWindow: 256000,
    pricing: { input: 0.005, output: 0.015, unit: '1K tokens' },
  },
  {
    id: 'hunyuan-t1-latest',
    name: '腾讯混元 Hunyuan-T1 (t1 官方深度推理)',
    provider: 'tencent',
    category: ['text', 'code'],
    description:
      '腾讯 2026 最新 Hunyuan-T1 深度思考（推理）模型，基于 Hybrid MoE 架构，推演剧情因果逻辑',
    features: ['2026 最新推理', 'Hunyuan-T1', 'Hybrid MoE', '剧情因果校验'],
    tokenLimit: 128000,
    isPro: true,
    contextWindow: 128000,
    pricing: { input: 0.008, output: 0.024, unit: '1K tokens' },
  },

  // ===== 百度文心一言 (2026年最新发布：ERNIE 5.1 旗舰 & ERNIE 5.0 全模态) =====
  {
    id: 'ERNIE-5.1',
    name: '文心一言 ERNIE 5.1 (2026.05 最新旗舰)',
    provider: 'baidu',
    category: ['text', 'code'],
    description:
      '百度 2026 年 5 月最新发布 ERNIE 5.1 旗舰大模型，强化学习 Agent 与深度剧本创作领先水准',
    features: ['2026.05 最新旗舰', 'ERNIE 5.1', 'Agentic 剧本', '知识逻辑推理'],
    tokenLimit: 500000,
    isPro: true,
    contextWindow: 500000,
    pricing: { input: 0.005, output: 0.015, unit: '1K tokens' },
  },
  {
    id: 'ERNIE-5.0',
    name: '文心一言 ERNIE 5.0 (2.4万亿原生全模态)',
    provider: 'baidu',
    category: ['text', 'image', 'video'],
    description: '百度 2026 年初发布 2.4 万亿参数原生全模态大模型，文本、图像、音频、视频统一建模',
    features: ['2.4万亿全模态', 'ERNIE 5.0', '跨模态理解', '影音视听全能'],
    tokenLimit: 500000,
    isPro: true,
    contextWindow: 500000,
    pricing: { input: 0.008, output: 0.024, unit: '1K tokens' },
  },
  {
    id: 'ERNIE-4.5-Turbo-128K',
    name: '文心一言 ERNIE-4.5-Turbo-128K (长文本)',
    provider: 'baidu',
    category: ['text'],
    description: '百度千帆官方指定 ERNIE-4.5-Turbo-128K 引擎，专为长文档理解与百章短剧快速解析优化',
    features: ['128K 长上下文', 'ERNIE 4.5', '长小说快速拆解'],
    tokenLimit: 128000,
    contextWindow: 128000,
    pricing: { input: 0.002, output: 0.006, unit: '1K tokens' },
  },

  // ===== 阿里巴巴 通义千问 (2026年8月3日最新发布) =====
  {
    id: 'qwen-3.8-max',
    name: 'Qwen 3.8-Max (2026.08 最新)',
    provider: 'alibaba',
    category: ['text', 'code'],
    description: '阿里云 2026年8月3日最新发布，2.4万亿参数稀疏 MoE 旗舰大模型，100万 Context',
    features: ['2026.08最新', '2.4T MoE架构', '100万Context', '全模态强推理'],
    tokenLimit: 1000000,
    isPro: true,
    contextWindow: 1000000,
    pricing: { input: 0.005, output: 0.015, unit: '1K tokens' },
  },

  // ===== DeepSeek 深度求索 (2026年7月31日最新发布) =====
  {
    id: 'deepseek-v4-flash-0731',
    name: 'DeepSeek-V4-Flash (2026.07 最新)',
    provider: 'deepseek',
    category: ['text', 'code'],
    description: 'DeepSeek 2026年7月31日最新发布，极速高吞吐量与长剧本拆解旗舰',
    features: ['2026.07.31最新', '极速响应', '剧本拆解', '高性价比'],
    tokenLimit: 500000,
    isPro: true,
    contextWindow: 500000,
    pricing: { input: 0.0015, output: 0.006, unit: '1K tokens' },
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek-R1 (deepseek-reasoner 官方)',
    provider: 'deepseek',
    category: ['text', 'code'],
    description: 'DeepSeek 官方 R1 推理模型，具备深度 CoT 逻辑链，推演镜头视角与剧情因果',
    features: ['官方 API', 'DeepSeek-R1 深度推理', '思维链(CoT)', '逻辑校验'],
    tokenLimit: 64000,
    isPro: true,
    contextWindow: 64000,
    pricing: { input: 0.004, output: 0.016, unit: '1K tokens' },
  },

  // ===== 月之暗面 Kimi (2026年7月最新发布) =====
  {
    id: 'kimi-k3',
    name: 'Kimi K3 (2026.07 最新)',
    provider: 'moonshot',
    category: ['text', 'code'],
    description: '月之暗面 2026年7月最新发布，2.8万亿参数 MoE 顶级长篇小说解析大模型',
    features: ['2026.07最新', '2.8T MoE', '100万Context', '小说无损解析'],
    tokenLimit: 1000000,
    isPro: true,
    contextWindow: 1000000,
    pricing: { input: 0.008, output: 0.024, unit: '1K tokens' },
  },

  // ===== OpenAI (2026年7月9日最新发布) =====
  {
    id: 'gpt-5.6-sol',
    name: 'GPT-5.6 Sol (2026.07 最新)',
    provider: 'openai',
    category: ['text', 'code'],
    description: 'OpenAI 2026年7月9日最新旗舰推理模型，支持 100万 Token 上下文与导演级编演',
    features: ['2026.07最新', '100万Context', '高级逻辑推演', 'AI导播指引'],
    tokenLimit: 1000000,
    isPro: true,
    contextWindow: 1000000,
    pricing: { input: 0.015, output: 0.045, unit: '1K tokens' },
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o (Omni 视听全能)',
    provider: 'openai',
    category: ['text', 'code'],
    description: 'OpenAI 高性能全能视听大模型，多模态画面理解与英文/中文镜头转换',
    features: ['Omni全能', '画面视觉推演', '标准视听分镜'],
    tokenLimit: 128000,
    contextWindow: 128000,
    pricing: { input: 0.005, output: 0.015, unit: '1K tokens' },
  },

  // ===== Anthropic Claude (2026年7月24日最新发布) =====
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5 (2026.07 最新)',
    provider: 'anthropic',
    category: ['text', 'code'],
    description: 'Anthropic 2026年7月24日最新发布，最强智能体代码与剧本编演旗舰',
    features: ['2026.07最新', '最强剧本润色', '100万Context'],
    tokenLimit: 1000000,
    isPro: true,
    contextWindow: 1000000,
    pricing: { input: 0.02, output: 0.06, unit: '1K tokens' },
  },

  // ===== Google Gemini (2026年7月最新发布) =====
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash (2026.07 最新)',
    provider: 'google',
    category: ['text', 'code'],
    description: 'Google 2026年7月最新更新，200万 Context 超长视听流极速大模型',
    features: ['2026.07最新', '200万Context', '整书解析', '极速低延迟'],
    tokenLimit: 2000000,
    isPro: true,
    contextWindow: 2000000,
    pricing: { input: 0.00035, output: 0.00105, unit: '1K tokens' },
  },

  // ===== 科大讯飞星火 (2026年8月最新发布) =====
  {
    id: 'generalv4.0',
    name: '讯飞星火 Spark V4.0 Ultra (generalv4.0 官方)',
    provider: 'iflytek',
    category: ['text'],
    description: '科大讯飞开放平台官方指定 Domain `generalv4.0`，中文长文本理解与故事古风叙事极强',
    features: ['2026.08最新', 'Spark V4.0', 'generalv4.0', '角色台词拟真'],
    tokenLimit: 500000,
    isPro: true,
    contextWindow: 500000,
    pricing: { input: 0.003, output: 0.01, unit: '1K tokens' },
  },

  // ===== 智谱 AI (2026年6月最新发布) =====
  {
    id: 'glm-5.2',
    name: 'GLM-5.2 (2026.06 最新)',
    provider: 'zhipu',
    category: ['text', 'code'],
    description: '智谱 AI 2026年6月最新旗舰，长程任务与 Agent 编导调度最佳中文模型',
    features: ['2026.06最新', '100万Context', 'Agentic 调度'],
    tokenLimit: 1000000,
    isPro: true,
    contextWindow: 1000000,
    pricing: { input: 0.004, output: 0.012, unit: '1K tokens' },
  },

  // ==========================================
  // 🎨 2. 图片/分镜生成模型 (Image Generation Models) - 2026年最新
  // ==========================================

  // 字节跳动 Seedream 5.0 (2026年7月最新发布)
  {
    id: 'doubao-seedream-5.0',
    name: '字节 Seedream 5.0 (2026.07 最新生图)',
    provider: 'bytedance',
    category: ['image'],
    description: '字节跳动 2026年7月最新发布，4K 超高精国漫与二次元分镜生成，防人物面部崩溃',
    features: ['2026.07最新', '4K 超高精', '角色面部锁定', '国漫二次元画风'],
    tokenLimit: 4096,
    isPro: true,
    contextWindow: 4096,
    pricing: { input: 0.02, output: 0.08, unit: '1张图' },
  },

  // 智谱 CogView-4 Pro (2026年7月最新发布)
  {
    id: 'cogview-4-pro',
    name: '智谱 CogView-4 Pro (2026.07 旗舰生图)',
    provider: 'zhipu',
    category: ['image'],
    description: '智谱 AI 2026年7月最新发布，原生理解中文修仙与赛博复杂 Prompt 的 4K 生成引擎',
    features: ['2026.07最新', '中文Prompt强理解', '4K 视听构图', '水墨与赛博风'],
    tokenLimit: 4096,
    isPro: true,
    contextWindow: 4096,
    pricing: { input: 0.015, output: 0.06, unit: '1张图' },
  },

  // 快手可灵 2.5 生图 (2026年7月最新发布)
  {
    id: 'kling-image-v2.5',
    name: '可灵 Image V2.5 (2026.07 漫画分镜)',
    provider: 'kling',
    category: ['image'],
    description: '快手可灵 2026年7月最新漫画分镜生图引擎，内置 9 宫格连贯画幅与景别锁定',
    features: ['2026.07最新', '漫画连贯画幅', '特写/全景景别锁定', '多角色构图'],
    tokenLimit: 4096,
    isPro: true,
    contextWindow: 4096,
    pricing: { input: 0.018, output: 0.07, unit: '1张图' },
  },

  // 阿里通义万相 2.5 (2026年7月最新发布)
  {
    id: 'wanx-v2.5',
    name: '通义万相 Wanx V2.5 (2026.07)',
    provider: 'alibaba',
    category: ['image'],
    description: '阿里云 2026年7月最新通义万相 2.5 艺术生图大模型，精通 3D 国漫与唯美古风',
    features: ['2026.07最新', '3D国漫画风', '唯美古风光影', '细节粒子特效'],
    tokenLimit: 4096,
    isPro: true,
    contextWindow: 4096,
    pricing: { input: 0.012, output: 0.05, unit: '1K tokens' },
  },

  // 腾讯混元 DiT V2 (2026年7月最新发布)
  {
    id: 'hunyuan-dit-v2',
    name: '腾讯混元 DiT V2 (2026.07)',
    provider: 'tencent',
    category: ['image'],
    description: '腾讯混元 2026年7月 DiT V2 视觉生成引擎，高精度角色服饰与镜头景深虚化',
    features: ['2026.07最新', '角色服饰一致', '镜头景深虚化', '高动态范围'],
    tokenLimit: 4096,
    isPro: true,
    contextWindow: 4096,
    pricing: { input: 0.015, output: 0.06, unit: '1张图' },
  },

  // ==========================================
  // 🎬 3. 视频/运镜生成模型 (Video Generation Models) - 2026年1月~8月最新
  // ==========================================

  // 快手可灵 3.0 Omni (2026年7月31日最新发布)
  {
    id: 'kling-3.0-omni',
    name: '可灵 3.0 Omni (2026.07.31 4K 60fps)',
    provider: 'kling',
    category: ['video'],
    description: '快手可灵 2026年7月31日最新发布，原生 4K 60fps 电影级画质与物理仿真运镜引擎',
    features: ['2026.07.31最新', '4K 60fps电影级', '物理高精度仿真', 'Pan/Zoom运镜'],
    tokenLimit: 4096,
    isPro: true,
    contextWindow: 4096,
    pricing: { input: 0.03, output: 0.15, unit: '1次生成' },
  },

  // 字节跳动 Seedance 2.5 (2026年7月31日最新发布)
  {
    id: 'seedance-2.5',
    name: '字节 Seedance 2.5 (2026.07.31 30秒视听)',
    provider: 'bytedance',
    category: ['video'],
    description: '字节跳动 2026年7月31日最新发布，支持 30 秒连续视频生成与 50 种参考资产控制',
    features: ['2026.07.31最新', '30秒连续视频', '50项资产多模态控制', '角色连贯'],
    tokenLimit: 4096,
    isPro: true,
    contextWindow: 4096,
    pricing: { input: 0.04, output: 0.18, unit: '1次生成' },
  },

  // MiniMax H3 (2026年7月31日最新发布)
  {
    id: 'minimax-h3',
    name: 'MiniMax H3 (2026.07.31 原生双声道)',
    provider: 'minimax',
    category: ['video'],
    description: 'MiniMax 2026年7月31日最新发布，15 秒 2K 原生双声道立体声视频生成模型',
    features: ['2026.07.31最新', '15秒2K视频', '原生双声道立体声', '音画对齐'],
    tokenLimit: 4096,
    isPro: true,
    contextWindow: 4096,
    pricing: { input: 0.02, output: 0.1, unit: '1次生成' },
  },

  // 智谱 CogVideoX 2.5 (2026年7月最新发布)
  {
    id: 'cogvideox-2.5',
    name: '智谱 CogVideoX 2.5 (2026.07 4K视频)',
    provider: 'zhipu',
    category: ['video'],
    description: '智谱 AI 2026年7月最新 CogVideoX 2.5 视频大模型，支持 10 秒 4K 高精运镜与微动视差',
    features: ['2026.07最新', '10秒 4K 高精', '微动视差', '3D 摄像机推拉'],
    tokenLimit: 4096,
    isPro: true,
    contextWindow: 4096,
    pricing: { input: 0.025, output: 0.12, unit: '1次生成' },
  },

  // 腾讯混元 Video Pro (2026年7月最新发布)
  {
    id: 'hunyuan-video-pro',
    name: '腾讯混元 Video Pro (2026.07 电影运镜)',
    provider: 'tencent',
    category: ['video'],
    description: '腾讯混元 2026年7月 Video Pro 视频引擎，专注于武打打斗与技能光效镜头',
    features: ['2026.07最新', '打斗动作特写', '技能粒子光效', '流畅高帧率'],
    tokenLimit: 4096,
    isPro: true,
    contextWindow: 4096,
    pricing: { input: 0.03, output: 0.14, unit: '1次生成' },
  },
];
