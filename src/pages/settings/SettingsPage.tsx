import {
  Settings as SettingsIcon,
  FolderOpen,
  Bot,
  Check,
  ImageIcon,
  Film,
  Volume2,
  Save,
} from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { verifyModelApiKey } from '@/core/config/model-providers';
import { tauriService } from '@/infrastructure/tauri-bridge/commands';

/**
 * 各家只保留最新 2 款旗舰模型，涵盖文字、图像、视频与语音四大全套 API Key 配置
 */
const TOP_2_LATEST_PROVIDERS = [
  {
    id: 'openai',
    category: '文字与推理大模型',
    name: 'OpenAI 官方接口',
    icon: Bot,
    models: ['GPT-5.6 Sol (最新旗舰)', 'o3-mini (深度推理)'],
    defaultModel: 'GPT-5.6 Sol',
    placeholder: 'sk-proj-xxxxxxxxxxxxxxxx',
    status: '在线',
  },
  {
    id: 'anthropic',
    category: '文字与剧本润色',
    name: 'Anthropic Claude 官方接口',
    icon: Bot,
    models: ['Claude Opus 5 (最新旗舰)', 'Claude Sonnet 5'],
    defaultModel: 'Claude Opus 5',
    placeholder: 'sk-ant-xxxxxxxxxxxxxxxx',
    status: '在线',
  },
  {
    id: 'deepseek',
    category: '文字与长篇拆解',
    name: 'DeepSeek 深度求索',
    icon: Bot,
    models: ['DeepSeek-V4-Flash (最新旗舰)', 'DeepSeek-V4-Pro'],
    defaultModel: 'DeepSeek-V4-Flash',
    placeholder: 'sk-ds-xxxxxxxxxxxxxxxx',
    status: '在线',
  },
  {
    id: 'alibaba',
    category: '中文多模态',
    name: '阿里云通义千问 (Qwen)',
    icon: Bot,
    models: ['Qwen 3.8-Max (最新 2.4T MoE)', 'Qwen-2.5-72B'],
    defaultModel: 'Qwen 3.8-Max',
    placeholder: 'sk-qwen-xxxxxxxxxxxxxxxx',
    status: '在线',
  },
  {
    id: 'doubao',
    category: '字节跳动豆包与视听模型',
    name: '字节跳动豆包 (Doubao) 官方接口',
    icon: Bot,
    models: ['豆包 2.1 (2026.08 最新)', 'Seedance 2.5 (30秒视听)'],
    defaultModel: '豆包 2.1',
    placeholder: 'doubao-api-key-xxxxxxxxxxxxxxxx',
    status: '在线',
  },
  {
    id: 'minimax',
    category: 'MiniMax 视听与语音大模型',
    name: 'MiniMax 官方接口 (H3 视听)',
    icon: Film,
    models: ['MiniMax H3 (原生双声道视听)', 'MiniMax abab 6.5s'],
    defaultModel: 'MiniMax H3',
    placeholder: 'minimax-api-key-xxxxxxxxxxxxxxxx',
    status: '在线',
  },
  {
    id: 'image_models',
    category: 'AI 图像与分镜生成模型',
    name: 'FLUX & 图像生成模型 API Key',
    icon: ImageIcon,
    models: ['FLUX.1-schnell (4K 最新旗舰)', '字节 Seedream 5.0 (4K 动漫)'],
    defaultModel: 'FLUX.1-schnell',
    placeholder: 'flux-api-key-xxxxxxxxxxxxxxxx',
    status: '在线',
  },
  {
    id: 'video_models',
    category: 'AI 视频与运镜生成模型',
    name: '可灵 & 视频生成模型 API Key',
    icon: Film,
    models: ['可灵 3.0 Omni (4K 60fps 最新)', '字节 Seedance 2.5 (30秒连续)'],
    defaultModel: '可灵 3.0 Omni',
    placeholder: 'kling-video-key-xxxxxxxxxxxxxxxx',
    status: '在线',
  },
  {
    id: 'audio_models',
    category: 'AI 语音 TTS 配音模型',
    name: 'ElevenLabs & 语音 TTS API Key',
    icon: Volume2,
    models: ['Eleven Multilingual v2 (多语言)', '火山 Sambert 情感语音'],
    defaultModel: 'Eleven Multilingual v2',
    placeholder: 'el-voice-key-xxxxxxxxxxxxxxxx',
    status: '在线',
  },
];

const SettingsPage = () => {
  const [workingDir, setWorkingDir] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedDir = localStorage.getItem('kineo_working_dir');
      if (savedDir && savedDir.trim().length > 0) return savedDir;
    }
    return '/Users/Kineo/KineoWorkingDirectory';
  });
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleSaveWorkingDir = (dirPath: string) => {
    const trimmed = dirPath.trim();
    if (!trimmed) return;
    setWorkingDir(trimmed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kineo_working_dir', trimmed);
    }
    toast.success(`🎉 已应用新的工作目录路径: ${trimmed}`);
  };

  const handleSelectWorkingDir = async () => {
    try {
      const selected = await tauriService.openFile({
        directory: true,
        title: '选择本地工程工作目录',
      });
      if (selected && typeof selected === 'string') {
        handleSaveWorkingDir(selected);
      } else if (Array.isArray(selected) && selected.length > 0) {
        handleSaveWorkingDir(selected[0]);
      }
    } catch (_e) {
      toast.info('可通过文本框直接编辑工作目录路径');
    }
  };

  // 从 localStorage 初始化已存的 Key
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      TOP_2_LATEST_PROVIDERS.forEach((p) => {
        try {
          const s1 = localStorage.getItem(`api_${p.id}_key`);
          const s2 = localStorage.getItem(`ai_model_settings_${p.id}`);
          let keyVal = '';
          if (s1 && s1.trim().length > 0) {
            keyVal = s1;
          } else if (s2) {
            try {
              const parsed = JSON.parse(s2) as { apiKey?: string };
              if (parsed?.apiKey) keyVal = parsed.apiKey;
            } catch (_e) {
              keyVal = s2;
            }
          }
          initial[p.id] = keyVal;
        } catch (_e) {
          initial[p.id] = '';
        }
      });
    }
    return initial;
  });

  const handleKeyChange = (providerId: string, val: string) => {
    setApiKeys((prev) => ({ ...prev, [providerId]: val }));
  };

  const handleSaveProviderKey = (name: string, id: string) => {
    const keyVal = apiKeys[id]?.trim() || '';
    if (typeof window !== 'undefined') {
      localStorage.setItem(`api_${id}_key`, keyVal);
      localStorage.setItem(`ai_model_settings_${id}`, JSON.stringify({ apiKey: keyVal }));
      localStorage.setItem(`kineo_api_key_${id}`, keyVal);
    }
  };

  const handleVerifyConnection = async (name: string, id: string) => {
    const currentKey = apiKeys[id]?.trim() || '';
    if (!currentKey) {
      toast.error(`⚠️ 请先输入 ${name} 的 API Key！`);
      return;
    }

    setTestingId(id);
    toast.info(`正在对 ${name} 开展真实密钥格式与连通推导校验...`);

    const result = await verifyModelApiKey(id, currentKey);

    setTestingId(null);
    if (result.success) {
      handleSaveProviderKey(name, id);
      toast.success(`🎉 ${name} ${result.message}`);
    } else {
      toast.error(`❌ ${name} ${result.message}`);
    }
  };

  const handleSaveAll = () => {
    if (typeof window !== 'undefined') {
      Object.entries(apiKeys).forEach(([id, val]) => {
        const trimmed = (val || '').trim();
        localStorage.setItem(`api_${id}_key`, trimmed);
        localStorage.setItem(`ai_model_settings_${id}`, JSON.stringify({ apiKey: trimmed }));
        localStorage.setItem(`kineo_api_key_${id}`, trimmed);
      });
    }
    toast.success('🎉 已持久化保存所有已配置的 AI 模型 API Key！');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* 头部标题区 */}
      <div className="studio-card p-6 space-y-1">
        <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-400" />
          系统偏好设置
        </h2>
        <p className="text-xs text-[var(--muted-foreground)]">
          配置文字大模型、AI 图像生成模型、AI 视频运镜模型与 TTS 语音 API 密钥
        </p>
      </div>

      {/* 第一区: 文字、图像、视频、语音 AI 模型 API Key 全量配置 */}
      <div className="studio-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 flex-wrap gap-2">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            AI 模型 API Key 全量配置 (文字 / 图像 / 视频 / 语音)
          </h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveAll}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer border-0"
            >
              <Save className="w-3.5 h-3.5" />
              一键保存全部 Key
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TOP_2_LATEST_PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const currentVal = apiKeys[provider.id] || '';
            const isConfigured = currentVal.trim().length > 3;

            return (
              <div
                key={provider.id}
                className="p-4 rounded-xl bg-transparent border border-[var(--border)] space-y-3 hover:border-indigo-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[var(--foreground)] block">
                        {provider.name}
                      </span>
                      <span className="text-[10px] text-indigo-400 font-mono font-bold block">
                        默认: {provider.defaultModel}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                      isConfigured
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {isConfigured ? '已配置' : '未配置'}
                  </span>
                </div>

                {/* API Key Input 框 */}
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    value={currentVal}
                    onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                    placeholder={provider.placeholder}
                    className="bg-transparent border-[var(--border)] text-xs rounded-lg flex-1 text-[var(--foreground)] focus:border-indigo-500 focus:ring-0"
                  />
                  <button
                    onClick={() => handleVerifyConnection(provider.name, provider.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1 shrink-0 cursor-pointer border-0 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {testingId === provider.id ? '保存中...' : '校验与保存'}
                    </span>
                  </button>
                </div>

                {/* 支持模型 */}
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  <span className="text-[10px] text-[var(--muted-foreground)] mr-1">支持模型:</span>
                  {provider.models.map((m) => (
                    <span
                      key={m}
                      className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono font-bold"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 第二区: 本地工程工作目录 */}
      <div className="studio-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-indigo-400" />
              本地工程工作目录
            </h3>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
              漫剧工程文件、4K 视频压制缓存与 TTS 音轨数据的本地绝对存储路径
            </p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono font-bold">
            SSD 高速盘
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <FolderOpen className="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 pointer-events-none" />
              <Input
                value={workingDir}
                onChange={(e) => handleSaveWorkingDir(e.target.value)}
                className="pl-9 bg-transparent border border-[var(--border)] text-xs rounded-xl flex-1 font-mono text-[var(--foreground)] outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-[var(--border)] focus:shadow-none shadow-none py-2.5"
              />
            </div>
            <Button
              onClick={handleSelectWorkingDir}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2.5 rounded-xl cursor-pointer border-0 font-bold"
            >
              更改路径
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
