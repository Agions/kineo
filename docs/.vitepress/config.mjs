import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Kineo (Kineo AI)',
  description: 'AI 漫剧创作平台 — 输入一本小说，AI 自动把它拍成一部漫剧',
  srcDir: '.',
  srcExclude: ['plans/**', 'ui-redesign/**', '**/node_modules/**'],
  lang: 'zh-CN',
  appearance: 'light',
  cleanUrls: true,
  ignoreDeadLinks: true,
  base: '/kineo/',

  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    anchor: false,
    toc: {
      level: [2, 3, 4],
      permalink: false,
    },
  },

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon-256x256.png' }],
    ['meta', { name: 'theme-color', content: '#0B0E2C' }],
    ['meta', { name: 'color-scheme', content: 'light dark' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Kineo (Kineo AI) - AI 漫剧创作平台' }],
    ['meta', { property: 'og:description', content: '基于 Tauri 2.1 桌面端 + 多模型 AI 编排的端到端 AI 漫剧创作工作台' }],
    ['meta', { property: 'og:image', content: '/og-image.png' }],
    ['meta', { property: 'og:image:width', content: '1280' }],
    ['meta', { property: 'og:image:height', content: '640' }],
    ['meta', { property: 'og:image:alt', content: 'Kineo (Kineo AI) — AI 漫剧创作平台' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    ['meta', { property: 'og:site_name', content: 'Kineo (Kineo AI)' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Kineo (Kineo AI) - AI 漫剧创作平台' }],
    ['meta', { name: 'twitter:description', content: '输入一本小说，AI 自动把它拍成一部漫剧。基于 Tauri 2.1 桌面端 + 多模型 AI 编排。' }],
    ['meta', { name: 'twitter:image', content: '/og-image.png' }],
    ['meta', { name: 'twitter:creator', content: '@Agions' }],
    ['meta', { name: 'description', content: 'Kineo (Kineo AI) - AI 漫剧创作平台。基于 Tauri 2.1 桌面端，集成多模型 AI 实现从小说/剧本到成片的端到端自动化。' }],
    ['meta', { name: 'keywords', content: 'kineo, AI漫剧, 漫剧创作, Tauri, 桌面应用, 多模型AI, 分镜设计, 角色一致性, TTS, FFmpeg' }],
    ['meta', { name: 'author', content: 'Agions' }],
  ],

  themeConfig: {
    logo: { src: '/logo.svg', alt: 'Kineo (Kineo AI)' },
    siteTitle: 'Kineo (Kineo AI)',

    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/getting-started/installation' },
      { text: '用户手册', link: '/user-guide/' },
      { text: 'API 文档', link: '/api/overview' },
      { text: '开发者', link: '/developer-guide/architecture' },
      {
        text: '更多',
        items: [
          { text: 'GitHub', link: 'https://github.com/Agions/kineo' },
          { text: '下载桌面端', link: 'https://github.com/Agions/kineo/releases' },
          { text: '报告问题', link: 'https://github.com/Agions/kineo/issues/new' },
        ],
      },
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: '快速开始',
          items: [
            { text: '总览', link: '/getting-started/' },
            { text: '安装指南', link: '/getting-started/installation' },
            { text: '三步跑通', link: '/getting-started/quick-start' },
            { text: '配置 API Key', link: '/getting-started/configuration' },
          ],
        },
      ],
      '/user-guide/': [
        {
          text: '用户指南',
          items: [
            { text: '总览', link: '/user-guide/' },
            { text: '工作流概览', link: '/user-guide/workflow-overview' },
            { text: 'Autonomous 模式', link: '/user-guide/autonomous-mode' },
            { text: 'Manual 模式', link: '/user-guide/manual-mode' },
            { text: '导入与分析', link: '/user-guide/import-analysis' },
            { text: '剧本生成', link: '/user-guide/script-generation' },
            { text: '角色设计', link: '/user-guide/character-design' },
            { text: '分镜设计', link: '/user-guide/storyboard-design' },
            { text: '渲染与导出', link: '/user-guide/rendering-export' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '总览', link: '/api/' },
            { text: 'Pipeline Service', link: '/api/pipeline-service' },
            { text: 'AI Service', link: '/api/ai-service' },
            { text: 'Subtitle Service', link: '/api/subtitle-service' },
          ],
        },
      ],
      '/developer-guide/': [
        {
          text: '开发者指南',
          items: [
            { text: '总览', link: '/developer-guide/' },
            { text: '架构设计', link: '/developer-guide/architecture' },
            { text: '模块系统', link: '/developer-guide/module-system' },
            { text: 'Pipeline 引擎', link: '/developer-guide/pipeline-engine' },
            { text: 'AI Provider', link: '/developer-guide/ai-providers' },
            { text: '平台适配层', link: '/developer-guide/platform-layer' },
          ],
        },
      ],
      '/deployment/': [
        {
          text: '部署文档',
          items: [
            { text: '总览', link: '/deployment/' },
            { text: '构建与发布', link: '/deployment/build' },
            { text: '环境变量', link: '/deployment/environment' },
            { text: 'Docker', link: '/deployment/docker' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Agions/kineo' },
    ],

    footer: {
      message: '基于 MIT 协议开源 · 由 Agions & 社区维护',
      copyright: `© 2024-${new Date().getFullYear()} Kineo (Kineo AI)`,
    },

    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },

    search: { provider: 'local', options: {} },
    lastUpdated: { text: '最后更新于' },
  },
})
