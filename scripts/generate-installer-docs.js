#!/usr/bin/env node

/**
 * Kineo 安装包与离线用户手册自动化生成脚本 (Installer Docs Generator)
 *
 * 功能：
 * 1. 自动生成专业排版、Cyberpunk Midnight 风格的《Kineo_User_Manual.pdf》
 * 2. 同步拷贝 Kineo_Quick_Start.md 与 README_FIRST.txt 到：
 *    - resources/docs/ (项目级共享根目录)
 *    - src-tauri/resources/docs/ (Tauri 打包器资源消费目录)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const RESOURCES_DOCS_DIR = path.join(ROOT_DIR, 'resources', 'docs');
const TAURI_DOCS_DIR = path.join(ROOT_DIR, 'src-tauri', 'resources', 'docs');
const PUBLIC_DOCS_DIR = path.join(ROOT_DIR, 'public', 'docs');
const TEMP_HTML_PATH = path.join(ROOT_DIR, 'resources', 'docs', '_manual_template.html');
const OUTPUT_PDF_PATH = path.join(RESOURCES_DOCS_DIR, 'Kineo_User_Manual.pdf');

// 确保目标目录存在
fs.mkdirSync(RESOURCES_DOCS_DIR, { recursive: true });
fs.mkdirSync(TAURI_DOCS_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DOCS_DIR, { recursive: true });

console.log('🚀 [Installer Docs] 正在生成 Kineo 官方安装包使用文档...');

// 1. 构建高保真 Cyber Midnight HTML 手册模版
const manualHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Kineo AI 漫剧创作平台 - 官方用户手册</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 16mm 16mm 16mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      color: #1e293b;
      line-height: 1.6;
      background: #ffffff;
      font-size: 13.5px;
      margin: 0;
      padding: 0;
    }

    /* 封面设计 */
    .cover-page {
      page-break-after: always;
      height: 94vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 40px 20px;
      border: 2px solid #e2e8f0;
      border-radius: 18px;
      background: linear-gradient(135deg, #090d16 0%, #111827 50%, #1e1b4b 100%);
      color: #ffffff;
    }
    .cover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cover-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(99, 102, 241, 0.25);
      border: 1px solid rgba(129, 140, 248, 0.4);
      color: #818cf8;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .cover-body {
      margin: auto 0;
    }
    .cover-title {
      font-size: 40px;
      font-weight: 900;
      line-height: 1.15;
      margin: 0 0 16px 0;
      background: linear-gradient(to right, #ffffff, #a5b4fc, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .cover-subtitle {
      font-size: 18px;
      color: #94a3b8;
      margin-bottom: 24px;
      font-weight: 400;
      line-height: 1.5;
    }
    .cover-tags {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .tag-chip {
      padding: 5px 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      font-size: 12px;
      color: #cbd5e1;
    }
    .cover-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #64748b;
      font-size: 12px;
    }

    /* 章节与正文排版 */
    .section-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 28px;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 2px solid #6366f1;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title::before {
      content: "";
      display: inline-block;
      width: 6px;
      height: 20px;
      background: #6366f1;
      border-radius: 3px;
    }
    .subsection-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    p {
      margin: 0 0 10px 0;
      color: #334155;
    }

    /* 强调卡片 */
    .info-card {
      background: #f8fafc;
      border-left: 4px solid #6366f1;
      padding: 14px 18px;
      border-radius: 0 10px 10px 0;
      margin: 14px 0;
      font-size: 13px;
      color: #475569;
    }
    .tip-card {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 14px 18px;
      border-radius: 0 10px 10px 0;
      margin: 14px 0;
      font-size: 13px;
      color: #166534;
    }

    /* 表格设计 */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 20px 0;
      font-size: 12.5px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 9px 12px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }

    /* 管线流程步骤网格 */
    .pipeline-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 16px 0;
    }
    .pipeline-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      background: #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .step-num {
      font-size: 11px;
      font-weight: 800;
      color: #6366f1;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .step-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .step-desc {
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.4;
    }

    /* 快捷键键帽 */
    .kbd {
      display: inline-block;
      padding: 2px 6px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-family: monospace;
      font-size: 11px;
      color: #334155;
      font-weight: 600;
      box-shadow: 0 1px 1px rgba(0,0,0,0.08);
    }

    .page-break {
      page-break-after: always;
    }
  </style>
</head>
<body>

  <!-- 封面 -->
  <div class="cover-page">
    <div class="cover-header">
      <span class="cover-badge">KINEO AI · OFFICIAL MANUAL</span>
      <span style="color: #94a3b8; font-size: 13px;">版本：v0.0.1 Release</span>
    </div>
    <div class="cover-body">
      <h1 class="cover-title">Kineo AI 漫剧创作平台<br>官方用户使用手册</h1>
      <div class="cover-subtitle">从网络小说到 4K 专业级漫剧视频的一站式智能创作指南</div>
      <div class="cover-tags">
        <span class="tag-chip">⚡ Tauri v2 极速原生</span>
        <span class="tag-chip">🎬 9 步全自动漫剧管线</span>
        <span class="tag-chip">🤖 Multi-Agent 导演工坊</span>
        <span class="tag-chip">🎙️ 智能配音与音画同轴</span>
        <span class="tag-chip">🖥️ 4K Ultra-HD 硬件加速</span>
      </div>
    </div>
    <div class="cover-footer">
      <span>Agions 编撰</span>
      <span>适用于 macOS / Windows / Linux 桌面全平台</span>
    </div>
  </div>

  <!-- 正文第一章：产品概述与系统配置 -->
  <div>
    <div class="section-title">1. 产品架构与系统环境要求</div>
    <p>
      <strong>Kineo</strong> 是一款融合现代生成式人工智能（LLM 大语言模型、扩散图像生成模型、神经网络 TTS、唇同步与运镜渲染）的桌面端专业漫剧视频创作工坊。
      基于 <strong>Tauri v2 + Rust 微内核 + React 19</strong> 构建，提供极速响应、离线工程持久化与本地硬件加速编解码能力。
    </p>

    <div class="subsection-title">1.1 推荐硬件运行环境</div>
    <table>
      <thead>
        <tr>
          <th>平台</th>
          <th>最低运行要求</th>
          <th>推荐创作配置</th>
          <th>硬件加速支持特性</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>macOS</strong></td>
          <td>macOS 10.15+, 8GB 内存</td>
          <td>macOS 13+, Apple Silicon (M1/M2/M3/M4), 16GB+</td>
          <td>Apple VideoToolbox / Metal 4K 压制加速</td>
        </tr>
        <tr>
          <td><strong>Windows</strong></td>
          <td>Windows 10 64-bit, 8GB 内存</td>
          <td>Windows 11, 16GB 内存, NVIDIA GTX 1060+</td>
          <td>NVIDIA NVENC / Intel QSV / AMD AMF 加速</td>
        </tr>
        <tr>
          <td><strong>Linux</strong></td>
          <td>Ubuntu 20.04+, 8GB 内存</td>
          <td>Ubuntu 22.04+, 16GB 内存, NVIDIA 专有驱动</td>
          <td>VA-API / VDPAU / NVENC 视频流水线</td>
        </tr>
      </tbody>
    </table>

    <div class="info-card">
      💡 <strong>免外部依赖设计</strong>：软件内部已集成编译自适应 WebAssembly FFmpeg 与 Rust 原生视听引擎，日常漫剧制作无需在操作系统中自行编译配置复杂的 Python 虚拟环境或命令行工具。
    </div>
  </div>

  <!-- 第二章：模型配置与 API 服务 -->
  <div>
    <div class="section-title">2. 首次启动与模型引擎配置</div>
    <p>
      首次打开 Kineo 后，点击左侧导航底部的 <strong>【设置 (Settings)】</strong>。为保障自动化拆解与渲染质量，需配置至少一组大模型提供商密钥：
    </p>

    <table>
      <thead>
        <tr>
          <th>模型领域</th>
          <th>推荐供应商与型号</th>
          <th>核心功能</th>
          <th>配置指引与特性</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>文本理解与分镜拆解</strong></td>
          <td>Google Gemini (2.0 Flash / 1.5 Pro)<br>OpenAI (GPT-4o)<br>DeepSeek (V3 / R1)</td>
          <td>小说角色识别、高潮情绪走势提炼、镜头构图提示词切分</td>
          <td>超长百万 Token 上下文直读整本网络小说，毫秒级拆解。</td>
        </tr>
        <tr>
          <td><strong>视觉画面渲染</strong></td>
          <td>Kineo 内置 Seedream 5.0<br>Flux / Midjourney API / SDXL</td>
          <td>场景分镜概念图绘制、角色 LoRA 锁脸、高精度动漫插画生成</td>
          <td>支持 16:9 横屏与 9:16 竖屏高分辨率出图。</td>
        </tr>
        <tr>
          <td><strong>多音轨配音 (TTS)</strong></td>
          <td>内置微软 EdgeTTS (免费高速)<br>阿里 CosyVoice / 百度语音</td>
          <td>台词人声旁白合成、音色克隆、情感对齐与自然语调</td>
          <td><strong>无需配置即可直接使用</strong> EdgeTTS 云希/晓晓等高品质人声。</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- 第三章：9 步标准创作管线 -->
  <div>
    <div class="section-title">3. 漫剧创作 9 步标准管线详解</div>
    <p>
      Kineo 采用工业级流水线作业模式，将一部漫剧的诞生抽象为 9 个具备严格质量门禁的工坊阶段：
    </p>

    <div class="pipeline-grid">
      <div class="pipeline-card">
        <div class="step-num">Step 01</div>
        <div class="step-name">策划与剧本导入</div>
        <div class="step-desc">粘贴网络小说文本、段落剧本；亦可直接一键载入内置经典示范工程。</div>
      </div>
      <div class="pipeline-card">
        <div class="step-num">Step 02</div>
        <div class="step-name">故事与情绪洞察</div>
        <div class="step-desc">AI 深度分析起承转合，提炼主配角关系网、高潮爆发点与场景环境标签。</div>
      </div>
      <div class="pipeline-card">
        <div class="step-num">Step 03</div>
        <div class="step-name">极客分镜镜头拆分</div>
        <div class="step-desc">按特写 (CU)、中景 (MS)、全景 (WS) 及仰/俯机位切分为独立电影镜头。</div>
      </div>
      <div class="pipeline-card">
        <div class="step-num">Step 04</div>
        <div class="step-name">分镜大盘与风格</div>
        <div class="step-desc">选定国漫修仙、赛博科幻、日式青春等美术基调，生成标准化渲染 Prompt。</div>
      </div>
      <div class="pipeline-card">
        <div class="step-num">Step 05</div>
        <div class="step-name">角色锁脸与 LoRA</div>
        <div class="step-desc">锁定主角发型、衣着、五官特征与固定随机种子，杜绝多机位“换脸变形”。</div>
      </div>
      <div class="pipeline-card">
        <div class="step-num">Step 06</div>
        <div class="step-name">硬件加速画面渲染</div>
        <div class="step-desc">提交 GPU 批量生成队列，实时查看视觉一致性评分（Consistency Score）。</div>
      </div>
      <div class="pipeline-card">
        <div class="step-num">Step 07</div>
        <div class="step-name">镜头动效与运镜</div>
        <div class="step-desc">赋予静态画面动态呼吸感，智能合成推拉摇移（Pan/Zoom）关键帧与转场。</div>
      </div>
      <div class="pipeline-card">
        <div class="step-num">Step 08</div>
        <div class="step-name">声音后期与配音</div>
        <div class="step-desc">AI 角色对白多角色音轨智能绑定，叠加 BGM 背景音乐，生成时间轴波形。</div>
      </div>
      <div class="pipeline-card">
        <div class="step-num">Step 09</div>
        <div class="step-name">4K 压制同轴导出</div>
        <div class="step-desc">音画同轴合成，自动烧录 ASS 动态字幕，一键输出 B站/抖音多端 4K 成品。</div>
      </div>
    </div>
  </div>

  <!-- 第四章：Multi-Agent 协同工坊与快捷键 -->
  <div>
    <div class="section-title">4. Multi-Agent 多智能体协同工坊</div>
    <p>
      在 <strong>【Agent 协同工坊】</strong> 中，您可以委派 5 位具备专业角色职责的虚拟自治智能体，协同并行完成漫剧生产：
    </p>
    <ul>
      <li><strong>总导演 Agent (Master Director)</strong>：负责全片剧情节拍、分集结构设计与各阶段质量门禁评估。</li>
      <li><strong>编剧 Agent (Writer Agent)</strong>：负责小说原文的大纲拆解、叙事视点提炼、矛盾冲突强化与台词精修。</li>
      <li><strong>分镜师 Agent (Storyboarder)</strong>：输出专业的摄影构图预设、景深光影氛围与影视级 Prompt。</li>
      <li><strong>制作师 Agent (Animator)</strong>：自动调度 GPU 算力进行批量画面生成、运镜轨迹插帧与音频同轴对齐。</li>
      <li><strong>质检员 Agent (Quality Auditor)</strong>：对出图进行防肢体畸变检测、角色一致性交叉比对并实施质量打回。</li>
    </ul>

    <div class="section-title">5. 键盘快捷键速查表</div>
    <table>
      <thead>
        <tr>
          <th>操作动作</th>
          <th>macOS 快捷键</th>
          <th>Windows / Linux 快捷键</th>
          <th>生效场景</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>新建漫剧工程</td>
          <td><span class="kbd">Cmd</span> + <span class="kbd">N</span></td>
          <td><span class="kbd">Ctrl</span> + <span class="kbd">N</span></td>
          <td>全局任何页面</td>
        </tr>
        <tr>
          <td>保存工程进度</td>
          <td><span class="kbd">Cmd</span> + <span class="kbd">S</span></td>
          <td><span class="kbd">Ctrl</span> + <span class="kbd">S</span></td>
          <td>各工坊步骤编辑区</td>
        </tr>
        <tr>
          <td>播放 / 暂停视频预览</td>
          <td><span class="kbd">Space</span> (空格键)</td>
          <td><span class="kbd">Space</span> (空格键)</td>
          <td>视频播放器 / 时间轴</td>
        </tr>
        <tr>
          <td>触发当前步骤 AI 生成</td>
          <td><span class="kbd">Cmd</span> + <span class="kbd">Enter</span></td>
          <td><span class="kbd">Ctrl</span> + <span class="kbd">Enter</span></td>
          <td>剧本分析 / 分镜出图</td>
        </tr>
        <tr>
          <td>倒放 / 暂停 / 快进</td>
          <td><span class="kbd">J</span> / <span class="kbd">K</span> / <span class="kbd">L</span></td>
          <td><span class="kbd">J</span> / <span class="kbd">K</span> / <span class="kbd">L</span></td>
          <td>视频时间轴播放器</td>
        </tr>
        <tr>
          <td>调起桌面端内置帮助中心</td>
          <td><span class="kbd">Cmd</span> + <span class="kbd">/</span></td>
          <td><span class="kbd">Ctrl</span> + <span class="kbd">/</span></td>
          <td>全局任何页面</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- 第六章：常见问题排查与技术支持 -->
  <div>
    <div class="section-title">6. 常见故障诊断与 FAQ</div>

    <div class="subsection-title">Q1: 为什么点击“开始分析”或“生成画面”时提示 API 连接错误？</div>
    <p>
      <strong>解答</strong>：通常为网络通路或密钥权限受限导致。请检查：
      1. 前往【设置】检查 API Key 末尾是否有意外空格；
      2. 若使用海外模型服务（OpenAI / Anthropic / Gemini），请确认本地网络环境开启系统代理或在配置中填写有效的代理网关；
      3. 若模型提供商账户余额不足，亦会返回 402/429 限制响应。
    </p>

    <div class="subsection-title">Q2: 导出的 4K 漫剧视频在手机或某些老旧电脑上无法打开？</div>
    <p>
      <strong>解答</strong>：部分设备不支持高码率 HEVC (H.265) 硬件解码。推荐在 Step 09 导出面板中，将编码器指定为 <strong>H.264 (AVC)</strong>，并将分辨率切换为 1080p 或 2K 兼容档位重新导出。
    </p>

    <div class="subsection-title">Q3: 多智能体协同模式生成时中途意外中断，数据会丢失吗？</div>
    <p>
      <strong>解答</strong>：不会。Kineo 引擎内置 <strong>断点自动续传（Checkpoint Engine）</strong>。每个分镜出图及音频合成完成的瞬间均会持久化保存在本地工程库中，重新打开项目即可一键“继续未完任务”。
    </p>

    <div class="tip-card">
      🎉 <strong>技术支持与社区生态</strong><br>
      • 官方代码仓库与版本发布：<a href="https://github.com/Agions/kineo" style="color: #4338ca;">https://github.com/Agions/kineo</a><br>
      • 提交 Bug 报告与功能需求：<a href="https://github.com/Agions/kineo/issues" style="color: #4338ca;">https://github.com/Agions/kineo/issues</a><br>
      • 软件内离线手册：可随时点击页面顶栏的 <strong>【? 帮助】</strong> 随时查阅离线图文指南。
    </div>
  </div>

</body>
</html>
`;

// 写入临时 HTML
fs.writeFileSync(TEMP_HTML_PATH, manualHtml, 'utf8');
console.log('✓ [Installer Docs] 临时 HTML 排版已就绪：' + TEMP_HTML_PATH);

// 2. 编译为出版级 PDF 手册
let pdfGenerated = false;

// 优先方案 A：使用 Python ReportLab 出版级生成器 (无沙箱 Mach 端口限制，稳定生成 4 页完整手册)
const pythonScriptPath = path.join(ROOT_DIR, 'scripts', 'generate_manual_pdf.py');
if (fs.existsSync(pythonScriptPath)) {
  try {
    console.log(`✓ [Installer Docs] 启动 Python 出版级手册生成器: ${pythonScriptPath}`);
    execSync(`python3 "${pythonScriptPath}" "${OUTPUT_PDF_PATH}"`, { stdio: 'inherit' });
    if (fs.existsSync(OUTPUT_PDF_PATH) && fs.statSync(OUTPUT_PDF_PATH).size > 1000) {
      console.log(`✓ [Installer Docs] 成功生成出版级 PDF 手册: ${OUTPUT_PDF_PATH} (${(fs.statSync(OUTPUT_PDF_PATH).size / 1024).toFixed(1)} KB)`);
      pdfGenerated = true;
    }
  } catch (pyErr) {
    console.warn('⚠️ [Installer Docs] Python 手册生成异常，尝试其他方案:', pyErr.message);
  }
}

// 方案 B：尝试调用 Headless Chrome 渲染 HTML 模版
if (!pdfGenerated) {
  const chromePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    'google-chrome',
    'google-chrome-stable',
    'chromium',
  ];

  let chromeBin = null;
  for (const bin of chromePaths) {
    try {
      if (fs.existsSync(bin)) {
        chromeBin = bin;
        break;
      }
    } catch (_e) {}
  }

  if (chromeBin) {
    try {
      console.log(`✓ [Installer Docs] 找到浏览器引擎: ${chromeBin}，正在渲染 PDF...`);
      const cmd = `"${chromeBin}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${OUTPUT_PDF_PATH}" "file://${TEMP_HTML_PATH}"`;
      execSync(cmd, { stdio: 'pipe' });
      if (fs.existsSync(OUTPUT_PDF_PATH) && fs.statSync(OUTPUT_PDF_PATH).size > 1000) {
        console.log(`✓ [Installer Docs] 成功通过 Chrome 生成 PDF 手册: ${OUTPUT_PDF_PATH} (${(fs.statSync(OUTPUT_PDF_PATH).size / 1024).toFixed(1)} KB)`);
        pdfGenerated = true;
      }
    } catch (err) {
      console.warn('⚠️ [Installer Docs] Chrome 渲染 PDF 遇到问题:', err.message);
    }
  }
}

// 方案 C：若已存在预先编译好的成品 PDF，直接复用
if (!pdfGenerated && fs.existsSync(OUTPUT_PDF_PATH)) {
  console.log(`✓ [Installer Docs] 复用已有的预编译手册成品: ${OUTPUT_PDF_PATH}`);
  pdfGenerated = true;
}

// 清理临时 HTML 模板
try {
  if (fs.existsSync(TEMP_HTML_PATH)) {
    fs.unlinkSync(TEMP_HTML_PATH);
  }
} catch (_e) {}

// 3. 将文档同步复制到 src-tauri/resources/docs/ 与 public/docs/ 目录
const filesToSync = [
  'Kineo_User_Manual.pdf',
  'Kineo_Quick_Start.md',
  'README_FIRST.txt',
];

for (const filename of filesToSync) {
  const srcFile = path.join(RESOURCES_DOCS_DIR, filename);
  if (!fs.existsSync(srcFile)) continue;

  // 同步到 Tauri 打包目录
  const destTauriFile = path.join(TAURI_DOCS_DIR, filename);
  fs.copyFileSync(srcFile, destTauriFile);
  console.log(`✓ [Installer Docs] 已同步到 Tauri 安装包资源: ${destTauriFile}`);

  // 同步到前端公共目录（用于应用内离线预览/直接下载）
  const destPublicFile = path.join(PUBLIC_DOCS_DIR, filename);
  fs.copyFileSync(srcFile, destPublicFile);
  console.log(`✓ [Installer Docs] 已同步到应用内置公共资源: ${destPublicFile}`);
}

console.log('🎉 [Installer Docs] 所有安装包使用文档已就绪并同步完成！');
