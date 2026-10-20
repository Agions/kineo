---
layout: home
title: Kineo (Kineo AI)
titleTemplate: false

hero:
  name: 'Kineo (Kineo AI)'
  text: 'Gemini Studio 2026 Auto-Swarm 漫剧平台'
  tagline: '输入一本小说/剧本/提示词，Auto-Swarm 多智能体集群自动推导成片——你只需要按「开始」'
  image:
    src: /kineo_brand_logo.jpg
    alt: Kineo (Kineo AI)
  actions:
    - theme: brand
      text: 快速开始 →
      link: /getting-started/installation
    - theme: alt
      text: 架构设计
      link: /developer-guide/architecture
    - theme: alt
      text: GitHub ⭐
      link: https://github.com/Agions/kineo

features:
  - icon: 🤖
    title: Auto-Swarm 多智能体集群
    details: Hub-and-Spoke 智能体架构，CHIEF 导演 Agent 指挥 6 大专职 Agent 自动纠错与推导
  - icon: 🎬
    title: 4 大核心环节漫剧流水线
    details: 1. 策划设定 (角色锁脸) ➔ 2. 画面生成 (3栏画幅) ➔ 3. 动态合成 (3D运镜) ➔ 4. 声音后期 (TTS压制)
  - icon: 🧠
    title: 13 大 AI 提供商矩阵
    details: DeepSeek-V4、Qwen 3.8-Max、腾讯 Hy3、百度 ERNIE 5.1、GPT-5.6、Claude Opus 5、FLUX 4K
  - icon: ⚡
    title: 桌面级原生 GPU 加持
    details: Tauri v2 + React 19 + Rust Engine，原生 VideoToolbox / NVENC 硬件编解码压制
  - icon: 📐
    title: 3D Camera Trajectory Overlay
    details: 16:9 4K 画布内置希区柯克变焦与 FPV 穿梭矢量 Overlay 指针，零门槛参数调优
  - icon: 🔒
    title: 100% 本地隐私与 Keyring
    details: 系统原生 Keyring 加密密钥存储，所有漫剧工程与分镜资产全本地保存
---

<!-- 为什么选择 -->

<div class="vp-section-header">
  <h2 class="vp-section-title">为什么选择 Kineo (Kineo AI)？</h2>
  <p class="vp-section-sub">市面上唯一的<strong>高性能开源桌面端</strong> Auto-Swarm AI 漫剧创作平台。数据完全本地、MIT 协议、无云端锁死。</p>
</div>

<div class="vp-why-grid">
  <div class="vp-why-card">
    <div class="vp-why-icon">🔒</div>
    <div class="vp-why-title">100% 本地数据隐私</div>
    <div class="vp-why-desc">所有 API Key 加密保存在系统 Keyring，作品工程与分镜资产全本地存储。</div>
  </div>
  <div class="vp-why-card">
    <div class="vp-why-icon">🤖</div>
    <div class="vp-why-title">Auto-Swarm 自动纠错</div>
    <div class="vp-why-desc">CHIEF 导演智能体监控共享黑板，单个 Agent 异常自动触发 Retry 自动纠错。</div>
  </div>
  <div class="vp-why-card">
    <div class="vp-why-icon">🛠️</div>
    <div class="vp-why-title">13 大模型与官方快捷申请</div>
    <div class="vp-why-desc">原生集成 13 大 AI 提供商真实 API，并提供官方控制台一键申请 API Key 入口。</div>
  </div>
</div>

<!-- 4 大核心环节流水线 -->

<div class="vp-section-header">
  <h2 class="vp-section-title">4 大核心环节工业级漫剧流水线</h2>
  <p class="vp-section-sub">从原始文本到 4K 成片的端到端自动化流程</p>
</div>

<div class="vp-workflow">
  <div class="vp-step">
    <div class="vp-step-num">1</div>
    <div class="vp-step-body">
      <div class="vp-step-title">策划设定 <code>CHARACTER ANCHOR</code></div>
      <div class="vp-step-desc">剧本解析 + 角色 Consistency 锁脸 + 人设 Prompt 绑定</div>
    </div>
    <div class="vp-step-arrow">→</div>
  </div>
  <div class="vp-step">
    <div class="vp-step-num">2</div>
    <div class="vp-step-body">
      <div class="vp-step-title">画面生成 <code>3-COLUMN STORYBOARD</code></div>
      <div class="vp-step-desc">4K 动漫分镜画幅大盘 + 缩略图时间线 + FLUX 生图</div>
    </div>
    <div class="vp-step-arrow">→</div>
  </div>
  <div class="vp-step">
    <div class="vp-step-num">3</div>
    <div class="vp-step-body">
      <div class="vp-step-title">动态合成 <code>3D CAMERA OVERLAY</code></div>
      <div class="vp-step-desc">3D 运镜轨迹矢量 Overlay (Zoom / Tilt / Pan) + 可灵 3.0 图生视频</div>
    </div>
    <div class="vp-step-arrow">→</div>
  </div>
  <div class="vp-step">
    <div class="vp-step-num">4</div>
    <div class="vp-step-body">
      <div class="vp-step-title">声音后期 <code>TTS & 4K EXPORT</code></div>
      <div class="vp-step-desc">多音轨 TTS 混音 + 毫秒级字幕对齐 + GPU 4K 压制</div>
    </div>
  </div>
</div>
