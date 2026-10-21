/**
 * Kineo 桌面端内置使用文档与帮助中心 (Desktop Documentation Center)
 * 支持全局深色与浅色双模式全自动自适应主题
 */

import {
  BookOpen,
  Search,
  Zap,
  Layers,
  Cpu,
  Keyboard,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Film,
  Music,
  UserCheck,
  FileText,
  Settings,
  Download,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@/app/providers/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface DocArticle {
  id: string;
  title: string;
  category: string;
  categoryIcon: React.ElementType;
  tags: string[];
  summary: string;
  content: (isDark: boolean) => React.ReactNode;
}

export const DocsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeArticleId, setActiveArticleId] = useState<string>('getting-started');

  const handleOpenManual = () => {
    window.open('/docs/Kineo_User_Manual.pdf', '_blank');
  };

  const handleOpenQuickStart = () => {
    window.open('/docs/Kineo_Quick_Start.md', '_blank');
  };

  // 完整桌面端内置文档数据 (支持主题色入参)
  const docArticles: DocArticle[] = useMemo(
    () => [
      {
        id: 'getting-started',
        category: 'quickstart',
        categoryIcon: Zap,
        title: '🚀 快速入门与软件简介',
        tags: ['入门', '简介', '系统配置'],
        summary: '了解 Kineo AI 漫剧视频生成器的核心架构、环境需求与零门槛快速上手步骤。',
        content: (isDark: boolean) => (
          <div className="space-y-6">
            <div
              className={`p-4 rounded-xl border backdrop-blur-md transition-colors ${
                isDark
                  ? 'bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border-purple-500/30 text-slate-300'
                  : 'bg-gradient-to-r from-purple-100/90 via-indigo-50 to-cyan-100/90 border-purple-300 text-slate-800 shadow-sm'
              }`}
            >
              <h3
                className={`text-lg font-bold mb-2 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-purple-600'}`} />
                欢迎使用 Kineo (Kineo AI)
              </h3>
              <p className="text-sm leading-relaxed">
                Kineo 是一款专为漫剧、动画短剧与小说视频化打造的{' '}
                <strong className={isDark ? 'text-cyan-300' : 'text-purple-700 font-bold'}>
                  全流程 AI Agent 创作桌面端软件
                </strong>
                。 支持从网文小说/短剧剧本导入、多 Agent 分镜规划、角色一致性锚定、多音轨 TTS
                混音、到 4K 硬件加速渲染导出的一站式极速创作。
              </p>
            </div>

            <div className="space-y-4">
              <h4
                className={`text-md font-semibold border-l-4 pl-3 ${
                  isDark
                    ? 'text-white border-[#7c3aed]'
                    : 'text-slate-900 border-purple-600 font-bold'
                }`}
              >
                硬件与环境最低要求
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
                  }`}
                >
                  <span
                    className={`font-bold block mb-1.5 text-sm ${
                      isDark ? 'text-purple-400' : 'text-purple-700'
                    }`}
                  >
                    🍎 macOS 环境
                  </span>
                  <p>• 操作系统：macOS 12.0 (Monterey) 或更高版本</p>
                  <p>• 芯片推荐：Apple Silicon M1/M2/M3/M4 系列（支持 VideoToolbox 硬件压制）</p>
                  <p>• 内存：8GB RAM 及以上</p>
                </div>
                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark
                      ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
                  }`}
                >
                  <span
                    className={`font-bold block mb-1.5 text-sm ${
                      isDark ? 'text-cyan-400' : 'text-cyan-700'
                    }`}
                  >
                    🪟 Windows 环境
                  </span>
                  <p>• 操作系统：Windows 10 / 11 64-bit</p>
                  <p>• 显卡推荐：NVIDIA GTX 1060 / RTX 2060+（支持 NVENC 硬编加速）</p>
                  <p>• 运行时：WebView2 Runtime（系统自带或自动检测）</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4
                className={`text-md font-semibold border-l-4 pl-3 ${
                  isDark
                    ? 'text-white border-[#06b6d4]'
                    : 'text-slate-900 border-cyan-600 font-bold'
                }`}
              >
                三步极速开始第一部漫剧
              </h4>
              <ol
                className={`list-decimal list-inside space-y-2 text-sm ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                <li>
                  点击顶部导航或首页的{' '}
                  <strong className={isDark ? 'text-purple-400' : 'text-purple-700'}>
                    “新建漫剧项目”
                  </strong>{' '}
                  按钮；
                </li>
                <li>
                  粘贴小说文本或输入剧本灵感，选择所需的画风预设（如现代日漫、修仙玄幻、赛博朋克）；
                </li>
                <li>
                  选择{' '}
                  <strong className={isDark ? 'text-cyan-400' : 'text-cyan-700'}>
                    全自动一键生成
                  </strong>{' '}
                  或{' '}
                  <strong className={isDark ? 'text-purple-400' : 'text-purple-700'}>
                    分步审查模式
                  </strong>
                  ，启动 AI Agent 自动化流水线！
                </li>
              </ol>
            </div>
          </div>
        ),
      },
      {
        id: 'sop-workflow',
        category: 'workflow',
        categoryIcon: Layers,
        title: '🤖 Multi-Agent 多智能体协作架构指南',
        tags: ['Multi-Agent', '黑板模式', '智能体协作'],
        summary: '详解 CHIEF -> STORY -> ACTOR -> FRAME -> AUDIO -> VIDEO 7 大 5 字母 Agent 集群与 ProjectBlackboard 共享黑板协作机制。',
        content: (isDark: boolean) => (
          <div className="space-y-6">
            <p
              className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
            >
              Kineo 摒弃了单向线性的 SOP，升级为符合工业级 AI 动画制片标准的 <strong>Hub-and-Spoke 多智能体协作架构</strong>。
              所有专职智能体围绕 <code>ProjectBlackboard</code> 共享黑板协同工作：
            </p>

            <div className="space-y-4">
              {[
                {
                  stage: '1. CHIEF (主控导演 Agent)',
                  badge: 'CHIEF',
                  darkBg: 'border-indigo-500/30 bg-indigo-950/20 text-slate-300',
                  lightBg: 'border-indigo-200 bg-indigo-50/70 text-slate-800 shadow-sm',
                  icon: Sparkles,
                  desc: '作为 Hub-and-Spoke 的总调度枢纽，监听 Blackboard 共享黑板，指挥各子 Agent 协同分发任务。',
                },
                {
                  stage: '2. STORY (剧本识别 Agent)',
                  badge: 'STORY',
                  darkBg: 'border-slate-700 bg-slate-900/60 text-slate-300',
                  lightBg: 'border-slate-200 bg-slate-50 text-slate-800 shadow-sm',
                  icon: FileText,
                  desc: '自动识别现成剧本文件 (.txt/.md/.docx/.json)、小说文本与 AI 提示词三类素材，智能拆解章节大纲。',
                },
                {
                  stage: '3. ACTOR (角色锁脸 Agent)',
                  badge: 'ACTOR',
                  darkBg: 'border-purple-500/30 bg-purple-950/20 text-slate-300',
                  lightBg: 'border-purple-200 bg-purple-50/70 text-slate-800 shadow-sm',
                  icon: UserCheck,
                  desc: '分析角色实体，生成 Consistency LoRA 锁脸 Anchor 锚点与人设 Prompt，防止二次元画面漂移。',
                },
                {
                  stage: '4. FRAME (视听分镜 Agent)',
                  badge: 'FRAME',
                  darkBg: 'border-blue-500/30 bg-blue-950/20 text-slate-300',
                  lightBg: 'border-blue-200 bg-blue-50/70 text-slate-800 shadow-sm',
                  icon: Layers,
                  desc: '推导镜头运镜轨迹 (Zoom In / Pan Right)，构建 3 栏漫剧画幅提示词大盘。',
                },
                {
                  stage: '5. AUDIO (音效配音 Agent)',
                  badge: 'AUDIO',
                  darkBg: 'border-cyan-500/30 bg-cyan-950/20 text-slate-300',
                  lightBg: 'border-cyan-200 bg-cyan-50/70 text-slate-800 shadow-sm',
                  icon: Music,
                  desc: '多音轨 EdgeTTS / CosyVoice 语音合成，混音 BGM 音轨与毫秒级字幕卡点对齐。',
                },
                {
                  stage: '6. VIDEO (视频压制 Agent)',
                  badge: 'VIDEO',
                  darkBg: 'border-amber-500/30 bg-amber-950/20 text-slate-300',
                  lightBg: 'border-amber-200 bg-amber-50/70 text-slate-800 shadow-sm',
                  icon: Film,
                  desc: '调度 Apple VideoToolbox (Metal) / NVIDIA NVENC GPU 硬件推演 4K 压制与渲染队列。',
                },
                {
                  stage: '7. EXTRA (自定义 Agent 插件)',
                  badge: 'EXTRA',
                  darkBg: 'border-emerald-500/30 bg-emerald-950/20 text-slate-300',
                  lightBg: 'border-emerald-200 bg-emerald-50/70 text-slate-800 shadow-sm',
                  icon: CheckCircle2,
                  desc: '支持用户声明式自定义扩展 Agent 插件，设定触发阶段与 LLM 规则，共享黑板流转。',
                },
              ].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border flex items-start gap-4 transition-all hover:scale-[1.01] ${
                      isDark ? item.darkBg : item.lightBg
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-lg border shrink-0 mt-0.5 ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-purple-400'
                          : 'bg-white border-slate-200 text-purple-600 shadow-sm'
                      }`}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-purple-600'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h5
                          className={`font-bold text-sm ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {item.stage}
                        </h5>
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                            isDark
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-purple-100 text-purple-800 border-purple-300 font-semibold'
                          }`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p
                        className={`text-xs leading-relaxed ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ),
      },
      {
        id: 'agent-modes',
        category: 'modes',
        categoryIcon: Cpu,
        title: '🤖 Agent 渐进式双模式指南',
        tags: ['Agent', '全自动', '分步审查'],
        summary: '全自动极速一键生成 vs 导演审查精细打磨模式的区别与最佳实践。',
        content: (isDark: boolean) => (
          <div className="space-y-6">
            <p
              className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
            >
              Kineo 支持两种灵活的创作模式，满足从极速批量出片到精细艺术创作的不同需求：
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-xl border ${
                  isDark
                    ? 'bg-purple-950/20 border-purple-500/30 text-slate-300'
                    : 'bg-purple-50/80 border-purple-200 text-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Zap className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  <h4
                    className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}
                  >
                    全自动一键极速模式
                  </h4>
                </div>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    />
                    适合：短剧批量试水、长篇小说自动剪辑
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    />
                    特点：用户只需上传文本，AI 全流程挂机自动推演
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    />
                    耗时：标准 1000 字片段约 2-3 分钟全量出片
                  </li>
                </ul>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isDark
                    ? 'bg-cyan-950/20 border-cyan-500/30 text-slate-300'
                    : 'bg-cyan-50/80 border-cyan-200 text-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  <h4
                    className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}
                  >
                    导演分步审查模式
                  </h4>
                </div>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isDark ? 'text-cyan-400' : 'text-cyan-600'
                      }`}
                    />
                    适合：高品质精品漫剧、长篇 IP 创作
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isDark ? 'text-cyan-400' : 'text-cyan-600'
                      }`}
                    />
                    特点：每个 SOP 阶段暂停，允许人工微调 Prompt 与音轨
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        isDark ? 'text-cyan-400' : 'text-cyan-600'
                      }`}
                    />
                    保障：具备审核员打回重新生成机制
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'keyboard-shortcuts',
        category: 'shortcuts',
        categoryIcon: Keyboard,
        title: '⌨️ 桌面端快捷键大全',
        tags: ['快捷键', '效率', '提速'],
        summary: '掌握全局与视频编辑工作台快捷键，提升 300% 创作效率。',
        content: (isDark: boolean) => (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b font-bold ${
                      isDark
                        ? 'border-slate-800 text-purple-300 bg-slate-900/80'
                        : 'border-slate-200 text-purple-900 bg-purple-50'
                    }`}
                  >
                    <th className="py-3 px-4">操作功能</th>
                    <th className="py-3 px-4">macOS 快捷键</th>
                    <th className="py-3 px-4">Windows / Linux 快捷键</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDark
                      ? 'divide-slate-800 text-slate-300'
                      : 'divide-slate-200 text-slate-700 bg-white'
                  }`}
                >
                  <tr>
                    <td className="py-2.5 px-4 font-medium">新建漫剧项目</td>
                    <td
                      className={`py-2.5 px-4 font-mono font-bold ${
                        isDark ? 'text-cyan-400' : 'text-purple-600'
                      }`}
                    >
                      ⌘ + N
                    </td>
                    <td
                      className={`py-2.5 px-4 font-mono font-bold ${
                        isDark ? 'text-cyan-400' : 'text-purple-600'
                      }`}
                    >
                      Ctrl + N
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium">保存当前项目</td>
                    <td
                      className={`py-2.5 px-4 font-mono font-bold ${
                        isDark ? 'text-cyan-400' : 'text-purple-600'
                      }`}
                    >
                      ⌘ + S
                    </td>
                    <td
                      className={`py-2.5 px-4 font-mono font-bold ${
                        isDark ? 'text-cyan-400' : 'text-purple-600'
                      }`}
                    >
                      Ctrl + S
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium">打开设置中心</td>
                    <td
                      className={`py-2.5 px-4 font-mono font-bold ${
                        isDark ? 'text-cyan-400' : 'text-purple-600'
                      }`}
                    >
                      ⌘ + ,
                    </td>
                    <td
                      className={`py-2.5 px-4 font-mono font-bold ${
                        isDark ? 'text-cyan-400' : 'text-purple-600'
                      }`}
                    >
                      Ctrl + ,
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium">打开帮助/使用文档</td>
                    <td
                      className={`py-2.5 px-4 font-mono font-bold ${
                        isDark ? 'text-cyan-400' : 'text-purple-600'
                      }`}
                    >
                      ⌘ + H / F1
                    </td>
                    <td
                      className={`py-2.5 px-4 font-mono font-bold ${
                        isDark ? 'text-cyan-400' : 'text-purple-600'
                      }`}
                    >
                      Ctrl + H / F1
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium">时间轴播放 / 暂停</td>
                    <td
                      className={`py-2.5 px-4 font-mono font-bold ${
                        isDark ? 'text-cyan-400' : 'text-purple-600'
                      }`}
                    >
                      Space (空格键)
                    </td>
                    <td
                      className={`py-2.5 px-4 font-mono font-bold ${
                        isDark ? 'text-cyan-400' : 'text-purple-600'
                      }`}
                    >
                      Space (空格键)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ),
      },
      {
        id: 'faq-troubleshooting',
        category: 'faq',
        categoryIcon: HelpCircle,
        title: '❓ 常见问题与故障排查',
        tags: ['FAQ', 'FFmpeg', '硬件压制', '报错'],
        summary: '解决 FFmpeg 安装检测、硬件编解码与 API 网络连接常见问题。',
        content: (isDark: boolean) => (
          <div className="space-y-6">
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  isDark
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                <h5
                  className={`font-bold text-sm mb-2 flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <AlertCircle
                    className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                  />
                  1. 未检测到 FFmpeg 运行时该怎么办？
                </h5>
                <p
                  className={`text-xs leading-relaxed mb-3 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Kineo 内置了自动自适应环境防护机制。即使您的系统未手动配置全局
                  FFmpeg，应用也会自动回退使用内置 WASM/Web-Audio 模块，保障软件不会崩溃停滞。
                </p>
                <div
                  className={`p-3 rounded-lg border text-[11px] font-mono ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-cyan-300'
                      : 'bg-purple-50 border-purple-200 text-purple-900'
                  }`}
                >
                  推荐安装方式 (macOS): brew install ffmpeg
                  <br />
                  推荐安装方式 (Windows): winget install Gyan.FFmpeg
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border ${
                  isDark
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
                }`}
              >
                <h5
                  className={`font-bold text-sm mb-2 flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <Cpu className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  2. 如何开启 GPU 硬件加速压制？
                </h5>
                <p
                  className={`text-xs leading-relaxed ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  系统启动时会自动扫描 Mac VideoToolbox 及 Windows NVIDIA NVENC / Intel QSV
                  支持。 您可以在{' '}
                  <strong className={isDark ? 'text-purple-400' : 'text-purple-700'}>
                    “系统设置”
                  </strong>{' '}
                  页面中将编码器切换为{' '}
                  <code className={isDark ? 'text-cyan-300' : 'text-purple-700 font-bold'}>
                    h264_videotoolbox
                  </code>{' '}
                  或{' '}
                  <code className={isDark ? 'text-cyan-300' : 'text-purple-700 font-bold'}>
                    h264_nvenc
                  </code>{' '}
                  开启 4K 秒级渲染。
                </p>
              </div>
            </div>
          </div>
        ),
      },
    ],
    []
  );

  // 过滤文章
  const filteredArticles = useMemo(() => {
    return docArticles.filter((art) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = activeCategory === 'all' || art.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [docArticles, searchQuery, activeCategory]);

  const currentArticle = useMemo(() => {
    return (
      docArticles.find((art) => art.id === activeArticleId) ||
      filteredArticles[0] ||
      docArticles[0]
    );
  }, [docArticles, activeArticleId, filteredArticles]);

  return (
    <div
      className={`min-h-screen p-6 flex flex-col gap-6 transition-colors duration-300 ${
        isDarkMode ? 'bg-[#0b0d14] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 顶部 Banner Header */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 transition-all border shadow-xl ${
          isDarkMode
            ? 'bg-gradient-to-r from-[#131726] via-[#1a1033] to-[#0f1d38] border-purple-500/20 text-white'
            : 'bg-gradient-to-r from-purple-50 via-indigo-50/70 to-cyan-50 border-purple-200 text-slate-900 shadow-md'
        }`}
      >
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -top-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border ${
                isDarkMode
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                  : 'bg-purple-100 border-purple-300 text-purple-800 font-semibold'
              }`}
            >
              <BookOpen
                className={`w-3.5 h-3.5 ${isDarkMode ? 'text-cyan-400' : 'text-purple-600'}`}
              />
              <span>Kineo Desktop Help & Documentation Center</span>
            </div>
            <h1
              className={`text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Kineo 桌面端使用文档与帮助中心
            </h1>
            <p
              className={`text-xs md:text-sm max-w-2xl ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              探索从小说剧本导入、多 Agent 拆解、角色一致性锚定到 4K
              硬件渲染压制的全流程指南与快捷键技巧。
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleOpenManual}
              variant="outline"
              className={
                isDarkMode
                  ? 'border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm'
                  : 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm'
              }
              title="打开出版级离线 PDF 使用手册"
            >
              <FileText className="w-4 h-4 text-purple-400" />
              离线 PDF 说明书
            </Button>
            <Button
              onClick={() => navigate('/workflow')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-cyan-300" />
              启动创作向导
            </Button>
            <Button
              onClick={() => navigate('/settings')}
              variant="outline"
              className={
                isDarkMode
                  ? 'border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer'
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm'
              }
            >
              <Settings className="w-4 h-4 text-purple-500" />
              模型与硬件设置
            </Button>
          </div>
        </div>

        {/* 搜索框与分类 Pills */}
        <div
          className={`mt-6 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4 ${
            isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
          }`}
        >
          <div className="relative w-full md:w-96">
            <Search
              className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文档关键词、SOP 阶段、快捷键或 FAQ..."
              className={`pl-10 text-xs rounded-xl ${
                isDarkMode
                  ? 'bg-slate-950/80 border-slate-800 text-slate-200 focus:border-[#7c3aed]'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-purple-600 shadow-sm'
              }`}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: '全部文档' },
              { id: 'quickstart', label: '🚀 快速入门' },
              { id: 'workflow', label: '🎬 6 阶 SOP' },
              { id: 'modes', label: '🤖 Agent 模式' },
              { id: 'shortcuts', label: '⌨️ 快捷键' },
              { id: 'faq', label: '❓ FAQ 排错' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-900/40'
                    : isDarkMode
                    ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                    : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主体两栏布局 (文档列表 + 富文本视图) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* 左侧文档目录 Sidebar (4 列) */}
        <div className="lg:col-span-4 space-y-3">
          <h3
            className={`text-xs font-mono uppercase tracking-wider px-1 flex items-center justify-between ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600 font-semibold'
            }`}
          >
            <span>文档目录列表</span>
            <span>{filteredArticles.length} 篇相关文章</span>
          </h3>

          <div className="space-y-2">
            {filteredArticles.map((art) => {
              const IconComp = art.categoryIcon;
              const isActive = art.id === currentArticle?.id;
              return (
                <Card
                  key={art.id}
                  onClick={() => setActiveArticleId(art.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-purple-950/40 to-slate-900 border-purple-500/50 shadow-lg shadow-purple-950/40'
                        : 'bg-gradient-to-r from-purple-100/90 to-indigo-50 border-purple-400 shadow-md text-slate-900'
                      : isDarkMode
                      ? 'bg-slate-900/50 hover:bg-slate-900/90 border-slate-800/80 text-slate-300'
                      : 'bg-white hover:bg-purple-50/50 border-slate-200/90 text-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 shrink-0 border ${
                        isActive
                          ? isDarkMode
                            ? 'bg-purple-600/30 text-cyan-300 border-purple-500/40'
                            : 'bg-purple-600 text-white border-purple-600'
                          : isDarkMode
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4
                          className={`text-sm font-bold truncate ${
                            isActive
                              ? isDarkMode
                                ? 'text-white'
                                : 'text-purple-950'
                              : isDarkMode
                              ? 'text-slate-200'
                              : 'text-slate-900'
                          }`}
                        >
                          {art.title}
                        </h4>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isActive
                              ? isDarkMode
                                ? 'text-cyan-400 translate-x-0.5'
                                : 'text-purple-600 translate-x-0.5'
                              : isDarkMode
                              ? 'text-slate-600'
                              : 'text-slate-400'
                          }`}
                        />
                      </div>
                      <p
                        className={`text-xs line-clamp-2 leading-relaxed mb-2 ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {art.summary}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {art.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.5 rounded border ${
                              isDarkMode
                                ? 'bg-slate-800 text-slate-400 border-slate-700/60'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 右侧文档主内容区域 (8 列) */}
        <div className="lg:col-span-8">
          <Card
            className={`p-6 rounded-2xl border backdrop-blur-xl shadow-2xl min-h-[520px] flex flex-col justify-between transition-colors ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-800/90 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            <div>
              {/* 文章标题 Header */}
              <div
                className={`border-b pb-4 mb-6 ${
                  isDarkMode ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
                      isDarkMode
                        ? 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30'
                        : 'text-purple-700 bg-purple-100 border-purple-300 font-semibold'
                    }`}
                  >
                    Kineo Docs v0.0.1
                  </span>
                  <span
                    className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                  >
                    最后更新：2026-08
                  </span>
                </div>
                <h2
                  className={`text-xl md:text-2xl font-black ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {currentArticle.title}
                </h2>
              </div>

              {/* 文章内容 */}
              <div className="prose max-w-none">{currentArticle.content(isDarkMode)}</div>
            </div>

            {/* 文章底部 Action Footer */}
            <div
              className={`mt-8 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
                isDarkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck
                    className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
                  />
                  Kineo AI 桌面官方使用指南
                </span>
                <span className={isDarkMode ? 'text-slate-700' : 'text-slate-300'}>|</span>
                <button
                  onClick={handleOpenManual}
                  className={`flex items-center gap-1 cursor-pointer transition-colors ${
                    isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-purple-600 hover:text-purple-800 font-medium'
                  }`}
                  title="下载或在浏览器打开出版级 PDF 使用手册"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载 PDF 说明书
                </button>
                <button
                  onClick={handleOpenQuickStart}
                  className={`flex items-center gap-1 cursor-pointer transition-colors ${
                    isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="打开 Markdown 快速上手指引"
                >
                  <FileText className="w-3.5 h-3.5" />
                  快速上手 (MD)
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/workflow')}
                  className={`font-medium flex items-center gap-1 cursor-pointer hover:underline ${
                    isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-purple-700 hover:text-purple-900'
                  }`}
                >
                  前往 AI 漫剧向导
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
