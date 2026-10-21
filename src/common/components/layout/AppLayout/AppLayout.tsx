import {
  Home,
  Plus,
  Zap,
  Sun,
  Moon,
  Settings,
  RefreshCw,
  HelpCircle,
  BookOpen,
  Info,
  X,
  Sparkles,
  Clapperboard,
} from 'lucide-react';
import React, { PropsWithChildren, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import CreateProjectModal from '@/common/components/project/CreateProjectModal';
import { Button } from '@/components/ui/button';
import { AutoUpdaterModal } from '@/common/components/updater/AutoUpdaterModal';
import { useTheme } from '@/common/context/ThemeContext';

import { AppLayoutProps } from './types';

const SOP_STAGES_DOC = [
  {
    step: '阶段 1',
    title: '文本解析与导入',
    desc: '粘贴 TXT / Markdown 小说文本，AI 智能拆解段落，自动提取角色与对话。',
  },
  {
    step: '阶段 2',
    title: 'AI 剧本分镜拆解',
    desc: '自动推导景别、运镜镜头与视角标注，生成结构化镜头 Prompt 规则。',
  },
  {
    step: '阶段 3',
    title: '角色一致性与分镜绘制',
    desc: '锁定角色 Reference 锚点防飘移，批量生成高清动漫漫画分镜。',
  },
  {
    step: '阶段 4',
    title: '多音轨 TTS 语音合成',
    desc: '匹配角色情感音色，毫秒级对齐对话字幕轨、BGM 背景乐与音效轨。',
  },
  {
    step: '阶段 5',
    title: '硬件加速场景渲染',
    desc: '调度 VideoToolbox / NVENC 硬件引擎，合成 Pan/Zoom 运镜与微动视差。',
  },
  {
    step: '阶段 6',
    title: '4K 完工与平台打包',
    desc: '输出 4K MP4 高清视频与 SRT 字幕包，支持多平台一键预设打包。',
  },
];

const AppLayout = ({ children, header, sidebar, footer: _footer }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleTheme, isDarkMode } = useTheme();

  // Modals & Menu State
  const [isUpdaterOpen, setIsUpdaterOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activePath = location.pathname;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 font-sans selection:bg-cyan-500/30 selection:text-white">
      {/* ── 顶部流光毛玻璃 Header ── */}
      {header || (
        <header className="h-14 px-4 border-b border-[var(--border)] bg-[var(--card)] backdrop-blur-xl flex items-center justify-between sticky top-0 z-40 shadow-sm transition-all duration-300">
          {/* 品牌 Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 cursor-pointer group select-none"
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-[#050810] rounded-[11px] flex items-center justify-center">
                  <Clapperboard className="w-4 h-4 text-[#00f5d4]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-wider bg-gradient-to-r from-[var(--neon-cyan)] via-[var(--neon-purple)] to-[var(--neon-pink)] bg-clip-text text-transparent">
                  Kineo
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)] font-semibold -mt-1 tracking-widest">
                  Kineo AI
                </span>
              </div>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--neon-cyan-bg)] text-[var(--neon-cyan)] border border-[var(--neon-cyan-border)]">
                v0.0.1 PRO
              </span>
            </div>
          </div>

          {/* 顶栏 Center Pill Navigation Tabs (主题自适应 Segment Control) */}
          <div className="hidden md:flex items-center gap-1 bg-[var(--accent)]/60 p-1 rounded-xl border border-[var(--border)] backdrop-blur-md">
            <button
              onClick={() => navigate('/')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activePath === '/'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>漫剧工作台</span>
            </button>

            <button
              onClick={() => navigate('/workflow')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activePath.includes('workflow')
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 创作向导</span>
            </button>

            <button
              onClick={() => navigate('/settings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activePath.includes('settings')
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>系统偏好设置</span>
            </button>

            <button
              onClick={() => navigate('/docs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activePath.includes('docs')
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>使用文档</span>
            </button>
          </div>

          {/* 右侧系统服务正常状态指示与主题切换 */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>系统服务正常</span>
            </div>
            {/* 新建工程按钮 */}
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm cursor-pointer border-0 rounded-lg px-3.5"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              新建工程
            </Button>

            {/* 主题模式快速切换器 */}
            <button
              onClick={toggleTheme}
              title={`当前模式: ${isDarkMode ? '深色深空' : '浅色冰晶'} (点击切换)`}
              className="p-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--glass-bg)] border border-[var(--border)] text-[var(--foreground)] transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* 帮助与说明 */}
            <div className="relative" ref={helpRef}>
              <button
                onClick={() => setIsHelpMenuOpen((prev) => !prev)}
                title="操作指南与项目说明"
                className="p-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--glass-bg)] border border-[var(--border)] text-[var(--foreground)] transition-all cursor-pointer flex items-center gap-1 text-xs"
              >
                <HelpCircle className="w-4 h-4 text-[var(--neon-cyan)]" />
                <span className="hidden sm:inline">帮助</span>
              </button>

              {isHelpMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[var(--card)] border border-[var(--border)] backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors cursor-pointer"
                    onClick={() => {
                      setIsHelpMenuOpen(false);
                      void navigate('/docs');
                    }}
                  >
                    <BookOpen className="w-4 h-4 text-[var(--neon-cyan)]" />
                    <span>📖 完整使用文档中心</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors cursor-pointer"
                    onClick={() => {
                      setIsHelpMenuOpen(false);
                      setShowAboutModal(true);
                    }}
                  >
                    <Info className="w-4 h-4 text-[var(--neon-purple)]" />
                    <span>ℹ️ 架构与 SOP 说明</span>
                  </button>
                </div>
              )}
            </div>

            {/* 检查更新 */}
            <button
              onClick={() => setIsUpdaterOpen(true)}
              title="检查最新版本"
              className="p-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--glass-bg)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* 硬件加速指示徽章 */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>硬件加速</span>
            </div>
          </div>
        </header>
      )}

      {/* ── 主主体区域: Dock 侧边栏 + 内容视角 (支持流畅垂直滚动) ── */}
      <div className="flex-1 flex">
        {sidebar || (
          <aside className="w-14 md:w-48 transition-all duration-300 border-r border-[var(--border)] bg-[var(--card)] backdrop-blur-xl flex flex-col justify-between p-2 z-30 shadow-sm shrink-0">
            <div className="space-y-1">
              <button
                onClick={() => navigate('/')}
                title="首页工作台"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activePath === '/'
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 font-bold'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline truncate">首页工作台</span>
              </button>

              <button
                onClick={() => navigate('/workflow')}
                title="AI 漫剧向导"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activePath.includes('workflow')
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 font-bold'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline truncate">AI 漫剧向导</span>
              </button>
            </div>

            <div className="pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => navigate('/settings')}
                title="系统偏好设置"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activePath.includes('settings')
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 font-bold'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline truncate">系统偏好设置</span>
              </button>
            </div>
          </aside>
        )}

        {/* 视口主容器 - 确保全平台全页面 100% 极速流畅垂直滚动 */}
        <main className="flex-1 overflow-y-auto h-[calc(100vh-3.5rem)] bg-[var(--background)] p-4 md:p-6 transition-colors duration-300">
          {children}
        </main>
      </div>

      {/* ── 底部 AppLayout 界面结束 ── */}

      {/* 自动更新模态框 */}
      <AutoUpdaterModal isOpen={isUpdaterOpen} onClose={() => setIsUpdaterOpen(false)} />

      {/* 📖 操作使用文档 Modal */}
      {showDocsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowDocsModal(false)}
        >
          <div
            className="w-full max-w-xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 space-y-4 text-xs animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--foreground)]">
                <BookOpen className="w-5 h-5 text-[var(--neon-cyan)]" />
                <span>Kineo (Kineo AI) · 操作指南</span>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SOP_STAGES_DOC.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[var(--accent)] border border-[var(--border)] space-y-1"
                >
                  <span className="font-bold text-[var(--neon-cyan)]">{s.title}</span>
                  <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ℹ️ 架构与 SOP 说明 Modal */}
      {showAboutModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowAboutModal(false)}
        >
          <div
            className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 space-y-4 text-xs animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[var(--foreground)]">
                <Info className="w-5 h-5 text-[var(--neon-purple)]" />
                <span>关于 Kineo (Kineo AI)</span>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[var(--accent)] border border-[var(--border)] space-y-2">
              <h4 className="font-bold text-sm text-[var(--foreground)]">
                Kineo AI 漫剧创作平台
              </h4>
              <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">
                采用了 Tauri v2 + React 19 + Rust + Monorepo
                模块化架构，将小说一键转化为专业级 4K
                漫剧视频。纯本地无账号极速创作，支持硬件压制与多音轨混音。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 新建工程 Modal */}
      <CreateProjectModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </div>
  );
};

export default AppLayout;

export const AppLayoutHeader = ({ children }: PropsWithChildren) => <>{children}</>;
export const AppLayoutSidebar = ({ children }: PropsWithChildren) => <>{children}</>;
export const AppLayoutContent = ({ children }: PropsWithChildren) => <>{children}</>;
export const AppLayoutFooter = ({ children }: PropsWithChildren) => <>{children}</>;
