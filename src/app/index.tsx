/**
 * 应用入口配置
 * 包含路由、Providers、全局样式、启动依赖检查
 */

import { useEffect, Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useRouteError } from 'react-router-dom';
import { Toaster } from 'sonner';

import ErrorBoundary from '@/app/components/ErrorBoundary';
import AppProvider from '@/app/providers/AppProvider';
import { getPageImporters, preloadPage } from '@/app/router/page-preload';
import { AppLayout } from '@/components/layout';
import { notify } from '@/components/ui/toast';
import { runWhenIdle } from '@/core/utils/idle';
import { logger } from '@/core/utils/logger';
import { tauriService } from '@/infrastructure/tauri-bridge/commands';
import HomePage from '@/pages/home/HomePage';

const importers = getPageImporters();
// 懒加载次要页面组件
const WorkflowPage = lazy(importers.workflow);
const ProjectEditPage = lazy(importers.projectEdit);
const ProjectDetailPage = lazy(importers.projectDetail);
const SettingsPage = lazy(importers.settings);
const DocsPage = lazy(importers.docs);

// 加载时的占位组件
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen w-full bg-[#050810]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-[#00f5d4] border-t-transparent rounded-full animate-spin shadow-[0_0_16px_rgba(0,245,212,0.4)]" />
      <p className="text-xs text-[#00f5d4] font-mono tracking-wider">加载页面视图中...</p>
    </div>
  </div>
);

// 全局路由 Error Boundary 容错降级组件
function RouteErrorBoundary() {
  const error = useRouteError() as any;
  const errorMessage =
    error?.message || error?.statusText || (typeof error === 'string' ? error : '位置未知异常');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050810] text-slate-100 p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-xl">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-bold mb-2">视图渲染暂挂异常</h3>
      <p className="text-sm text-slate-400 max-w-md mb-3">
        渲染遇到非预期捕获。系统已安全防护并隔离，您可以尝试刷新页面或返回首页概览。
      </p>
      {errorMessage && (
        <div className="p-3 bg-slate-900/90 rounded-xl border border-rose-500/30 text-rose-300 font-mono text-xs max-w-xl overflow-auto text-left mb-6">
          {String(errorMessage)}
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-[#00f5d4] text-[#050810] text-sm font-bold transition-all shadow-lg shadow-[rgba(0,245,212,0.3)] cursor-pointer"
        >
          刷新重新加载
        </button>
        <button
          onClick={() => (window.location.href = '/')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-all border border-slate-700 cursor-pointer"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}

// 路由包装组件：统一 AppLayout + Suspense fallback
function AppRoute({ page: Page }: { page: React.ComponentType }) {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Page />
      </Suspense>
    </AppLayout>
  );
}

// React Router 7 路由配置 (含 errorElement 安全降级)
const router = createBrowserRouter([
  { path: '/', element: <AppRoute page={HomePage} />, errorElement: <RouteErrorBoundary /> },
  {
    path: '/workflow',
    element: <AppRoute page={WorkflowPage} />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/project/new',
    element: <AppRoute page={ProjectEditPage} />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/project/edit/:projectId',
    element: <AppRoute page={ProjectEditPage} />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/project/:projectId',
    element: <AppRoute page={ProjectDetailPage} />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/settings',
    element: <AppRoute page={SettingsPage} />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/docs',
    element: <AppRoute page={DocsPage} />,
    errorElement: <RouteErrorBoundary />,
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

const App = () => {
  // 应用初始化与后台异步依赖检查
  useEffect(() => {
    let isMounted = true;

    // 清理原生 HTML Splash 元素
    const splashEl = document.querySelector('.app-splash-container');
    if (splashEl && splashEl.parentNode) {
      splashEl.parentNode.removeChild(splashEl);
    }

    const checkDependencies = async () => {
      try {
        logger.info('应用初始化...');
        // 并行非阻塞异步检查 WebView2 与 FFmpeg
        const [deps, ffmpegResult] = await Promise.allSettled([
          tauriService.checkRuntimeDependencies(),
          tauriService.checkFFmpeg(),
        ]);

        if (!isMounted) return;

        if (deps.status === 'fulfilled' && (deps.value as any)?.webview2_installed === false) {
          notify.warning({
            message: '运行时依赖缺失',
            description: 'WebView2 运行时未安装，部分视频压制功能可能受限',
            duration: 10000,
          });
        }

        if (ffmpegResult.status === 'fulfilled' && ffmpegResult.value?.installed) {
          logger.info('FFmpeg 检查通过:', ffmpegResult.value.version || '已安装');
        } else {
          logger.warn('FFmpeg 未检测到，系统将之后尝试使用 WASM/备用压制方案');
        }
      } catch (error) {
        logger.error('应用初始化非致命错误:', error);
      }
    };

    // 延迟 100ms 触发检查，确保首屏 DOM 和 CSS 优先挂载渲染
    const timer = setTimeout(checkDependencies, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const warmup = () => {
      void preloadPage(importers.workflow, '/workflow');
      void preloadPage(importers.projectEdit, '/project');
    };
    return runWhenIdle(warmup, { timeoutMs: 1200 });
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <Toaster position="bottom-right" richColors closeButton />
        <RouterProvider router={router} />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
