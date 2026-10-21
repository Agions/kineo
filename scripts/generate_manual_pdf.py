#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Kineo AI 漫剧创作平台 - 官方用户使用手册 (PDF 生成器)
基于 ReportLab 构建出版级 A4 多页中文手册
"""

import sys
import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

OUTPUT_PATH = sys.argv[1] if len(sys.argv) > 1 else "resources/docs/Kineo_User_Manual.pdf"

# 1. 注册系统中文字体
CHINESE_FONT = "Helvetica"
chinese_font_candidates = [
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
]

for font_path in chinese_font_candidates:
    if os.path.exists(font_path):
        try:
            pdfmetrics.registerFont(TTFont("KineoChinese", font_path))
            CHINESE_FONT = "KineoChinese"
            break
        except Exception:
            continue

# 页面尺寸
PAGE_WIDTH, PAGE_HEIGHT = A4

class NumberedCanvas(canvas.Canvas):
    """带页眉与页脚页码的自定义画布"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # 封面页不绘制页眉页脚
            return

        self.saveState()
        self.setFont(CHINESE_FONT, 9)
        self.setFillColor(colors.HexColor("#64748b"))

        # 页眉
        self.drawString(40, PAGE_HEIGHT - 32, "Kineo (Kineo AI) 漫剧创作平台 · 官方用户手册")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(40, PAGE_HEIGHT - 36, PAGE_WIDTH - 40, PAGE_HEIGHT - 36)

        # 页脚
        page_str = f"第 {self._pageNumber} 页 / 共 {page_count} 页"
        self.drawRightString(PAGE_WIDTH - 40, 24, page_str)
        self.drawString(40, 24, "Agions · https://github.com/Agions/kineo")
        self.line(40, 36, PAGE_WIDTH - 40, 36)

        self.restoreState()


def build_pdf():
    os.makedirs(os.path.dirname(os.path.abspath(OUTPUT_PATH)), exist_ok=True)
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # 自定义文字样式
    title_style = ParagraphStyle(
        'CoverTitle',
        fontName=CHINESE_FONT,
        fontSize=28,
        leading=36,
        textColor=colors.HexColor("#ffffff"),
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        fontName=CHINESE_FONT,
        fontSize=14,
        leading=22,
        textColor=colors.HexColor("#94a3b8"),
        alignment=1
    )
    h1_style = ParagraphStyle(
        'Heading1_Custom',
        fontName=CHINESE_FONT,
        fontSize=16,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=12,
        spaceAfter=8,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Heading2_Custom',
        fontName=CHINESE_FONT,
        fontSize=12,
        leading=18,
        textColor=colors.HexColor("#334155"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body_Custom',
        fontName=CHINESE_FONT,
        fontSize=9.5,
        leading=14.5,
        textColor=colors.HexColor("#334155"),
        spaceAfter=5
    )
    table_cell_style = ParagraphStyle(
        'TableCell',
        fontName=CHINESE_FONT,
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1e293b")
    )
    table_header_style = ParagraphStyle(
        'TableHeader',
        fontName=CHINESE_FONT,
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#ffffff"),
        fontStyle='bold'
    )
    info_box_style = ParagraphStyle(
        'InfoBox',
        fontName=CHINESE_FONT,
        fontSize=9,
        leading=14,
        textColor=colors.HexColor("#1e1b4b"),
        backColor=colors.HexColor("#eef2ff"),
        borderColor=colors.HexColor("#6366f1"),
        borderWidth=1,
        borderPadding=8,
        spaceBefore=6,
        spaceAfter=8
    )

    story = []

    # ================= 封面页 =================
    story.append(Spacer(1, 100))
    cover_card_data = [
        [Paragraph("KINEO AI · OFFICIAL USER & CREATOR MANUAL", ParagraphStyle('CoverBadge', fontName=CHINESE_FONT, fontSize=11, leading=14, textColor=colors.HexColor("#818cf8"), alignment=1))],
        [Spacer(1, 16)],
        [Paragraph("Kineo AI 漫剧创作平台", title_style)],
        [Spacer(1, 6)],
        [Paragraph("官方用户使用与创作全流程实操手册", title_style)],
        [Spacer(1, 16)],
        [Paragraph("从网络小说到 4K 专业级漫剧视频的一站式智能创作指南", subtitle_style)],
        [Spacer(1, 24)],
        [Paragraph("⚡ Tauri v2 原生引擎  |  🎬 9 步标准管线  |  🤖 Multi-Agent 导演工坊  |  🖥️ 4K 压制加速", subtitle_style)],
        [Spacer(1, 80)],
        [Paragraph("适用平台：macOS (Apple Silicon / Intel) · Windows 10/11 · Linux", ParagraphStyle('CoverSub', fontName=CHINESE_FONT, fontSize=10, leading=14, textColor=colors.HexColor("#64748b"), alignment=1))],
        [Paragraph("Agions 编撰 · 版本：v0.0.1 Release", ParagraphStyle('CoverVer', fontName=CHINESE_FONT, fontSize=9.5, leading=14, textColor=colors.HexColor("#64748b"), alignment=1))],
    ]
    cover_table = Table(cover_card_data, colWidths=[PAGE_WIDTH - 80])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#090d16")),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#1e293b")),
    ]))
    story.append(cover_table)
    story.append(PageBreak())

    # ================= 第一章：产品概述与系统配置 =================
    story.append(Paragraph("1. 产品架构与系统环境要求", h1_style))
    story.append(Paragraph(
        "Kineo 是一款融合现代生成式人工智能（LLM、扩散图像模型、多音轨 TTS、运镜合成与 4K 硬件压制）的专业漫剧视频创作工坊。"
        "软件基于 <b>Tauri v2 + Rust 微内核 + React 19</b> 模块化架构构建，具备内存占用低、毫秒级响应、本地持久化工程存储及跨平台原生支持等特点。",
        body_style
    ))

    hw_table_data = [
        [Paragraph("操作系统", table_header_style), Paragraph("最低要求", table_header_style), Paragraph("推荐配置", table_header_style), Paragraph("硬件加速特性", table_header_style)],
        [Paragraph("macOS", table_cell_style), Paragraph("macOS 10.15+, 8G 内存", table_cell_style), Paragraph("macOS 13+, Apple Silicon M1-M4, 16G+", table_cell_style), Paragraph("Apple VideoToolbox / Metal 硬件编码", table_cell_style)],
        [Paragraph("Windows", table_cell_style), Paragraph("Win10 64-bit, 8G 内存", table_cell_style), Paragraph("Win11, 16G 内存, NVIDIA 独立显卡", table_cell_style), Paragraph("NVIDIA NVENC / Intel QSV / AMD AMF", table_cell_style)],
        [Paragraph("Linux", table_cell_style), Paragraph("Ubuntu 20.04+, 8G", table_cell_style), Paragraph("Ubuntu 22.04+, 16G, 官方驱动", table_cell_style), Paragraph("VA-API / VDPAU / NVENC 流水线", table_cell_style)],
    ]
    hw_table = Table(hw_table_data, colWidths=[65, 140, 160, 150])
    hw_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4338ca")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(hw_table)
    story.append(Paragraph("💡 <b>免外部依赖设计</b>：软件内置自适应 WebAssembly 与 Rust 原生视听引擎，无需自行配置 Python 虚拟环境或编译 FFmpeg，安装后即可直接生成视频。", info_box_style))

    # ================= 第二章：首次启动与模型引擎配置 =================
    story.append(Paragraph("2. 首次启动与模型引擎配置", h1_style))
    story.append(Paragraph(
        "首次启动后，请点击左侧导航栏底部的【设置 (Settings)】。系统支持主流大语言模型、视觉图像模型与语音服务商：",
        body_style
    ))

    model_table_data = [
        [Paragraph("模型领域", table_header_style), Paragraph("推荐服务商与型号", table_header_style), Paragraph("核心功能职责", table_header_style), Paragraph("配置注意点", table_header_style)],
        [Paragraph("文本理解 / 分镜拆解", table_cell_style), Paragraph("Google Gemini 2.0 / 1.5 Pro<br/>OpenAI GPT-4o / DeepSeek", table_cell_style), Paragraph("小说长文本解析、情绪走势提炼、镜头构图提示词切分", table_cell_style), Paragraph("支持超长上下文整书拆解，兼容 OpenAI 代理端点", table_cell_style)],
        [Paragraph("场景分镜图像渲染", table_cell_style), Paragraph("Kineo Seedream 5.0 (内置)<br/>Flux / Midjourney / SDXL", table_cell_style), Paragraph("概念图绘制、角色锁脸 (LoRA)、动漫二次元风格生成", table_cell_style), Paragraph("支持 16:9 横屏与 9:16 竖屏高分辨率出图", table_cell_style)],
        [Paragraph("语音合成与音频 (TTS)", table_cell_style), Paragraph("微软 EdgeTTS (内置免费高速)<br/>阿里 CosyVoice / 百度语音", table_cell_style), Paragraph("台词对白旁白配音、情感音调控制、波形时间轴对齐", table_cell_style), Paragraph("<b>免配置即可使用</b> EdgeTTS 云希/晓晓等人声", table_cell_style)],
    ]
    model_table = Table(model_table_data, colWidths=[90, 140, 160, 125])
    model_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#312e81")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(model_table)
    story.append(PageBreak())

    # ================= 第三章：9 步标准漫剧创作管线 =================
    story.append(Paragraph("3. 漫剧创作 9 步标准工坊管线", h1_style))
    story.append(Paragraph(
        "在首页点击【新建工程】后，进入项目编辑工坊。Kineo 提供了业界领先的 9 步工业级流水线，每步均配备严格的数据校验与质检门禁：",
        body_style
    ))

    pipeline_data = [
        [Paragraph("步骤阶段", table_header_style), Paragraph("工坊名称", table_header_style), Paragraph("核心操作与交付成果", table_header_style), Paragraph("质量门禁 (Quality Gate)", table_header_style)],
        [Paragraph("Step 01", table_cell_style), Paragraph("策划导入", table_cell_style), Paragraph("导入小说正文或大纲，支持一键载入经典示范剧本", table_cell_style), Paragraph("文本字符数与段落规范校验", table_cell_style)],
        [Paragraph("Step 02", table_cell_style), Paragraph("故事洞察", table_cell_style), Paragraph("AI 深度提取主线大纲、情绪弧线走向、主角关系图谱", table_cell_style), Paragraph("故事完整度与冲突指数评分", table_cell_style)],
        [Paragraph("Step 03", table_cell_style), Paragraph("镜头切分", table_cell_style), Paragraph("将章节拆分为数十个电影分镜镜头（特写/中景/全景机位）", table_cell_style), Paragraph("镜头机位与景别合理性校验", table_cell_style)],
        [Paragraph("Step 04", table_cell_style), Paragraph("分镜大盘", table_cell_style), Paragraph("选定国漫修仙、赛博未来、日漫青春等风格，生成标准 Prompt", table_cell_style), Paragraph("提示词一致性与负向词注入", table_cell_style)],
        [Paragraph("Step 05", table_cell_style), Paragraph("角色锁脸", table_cell_style), Paragraph("锁定角色发型发色、服饰细节与种子，建立人物 LoRA 档案", table_cell_style), Paragraph("参考图一致性评分 (≥85分)", table_cell_style)],
        [Paragraph("Step 06", table_cell_style), Paragraph("场景渲染", table_cell_style), Paragraph("批量提交 GPU 渲染集群，并发生成各分镜 2K/4K 概念画面", table_cell_style), Paragraph("出图完整率与防肢体畸变质检", table_cell_style)],
        [Paragraph("Step 07", table_cell_style), Paragraph("镜头运镜", table_cell_style), Paragraph("赋予静态图生命力，配置推拉摇移 (Pan/Zoom) 3D 轨迹动效", table_cell_style), Paragraph("帧率平滑度与画面位移检测", table_cell_style)],
        [Paragraph("Step 08", table_cell_style), Paragraph("声音后期", table_cell_style), Paragraph("角色音轨自动匹配，多声道混音，生成音画同轴波形时间轴", table_cell_style), Paragraph("对白字幕毫秒级时序对齐", table_cell_style)],
        [Paragraph("Step 09", table_cell_style), Paragraph("压制导出", table_cell_style), Paragraph("硬件同轴编码压制，烧录 ASS 字幕，输出 4K MP4 视频成品", table_cell_style), Paragraph("最终成品码率与音画同步校验", table_cell_style)],
    ]
    pipeline_table = Table(pipeline_data, colWidths=[55, 75, 235, 150])
    pipeline_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#065f46")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(pipeline_table)

    # ================= 第四章：Multi-Agent 多智能体协同工坊 =================
    story.append(Paragraph("4. Multi-Agent 多智能体协同工坊模式", h1_style))
    story.append(Paragraph(
        "在左侧导航点击【Agent 协同工坊】，可进入全自动自治创作空间。由五位具备独立认知职能的 AI 智能体分工协同：",
        body_style
    ))
    agent_info = (
        "• <b>总导演 Agent (Master Director)</b>：统揽全片全局节奏，分发创作任务并实施质量验收。<br/>"
        "• <b>编剧 Agent (Writer Agent)</b>：负责原著小说拆解、冲突高潮提炼与台词对白精修。<br/>"
        "• <b>分镜师 Agent (Storyboarder)</b>：主导摄影视角、景深焦距选择与影视级视觉提示词生成。<br/>"
        "• <b>制作师 Agent (Animator)</b>：自动化调度 GPU 算力执行批处理渲染、运镜补帧与混音。<br/>"
        "• <b>质检员 Agent (Quality Auditor)</b>：执行一致性锚定校验、防画面崩坏检测并负责异常打回。"
    )
    story.append(Paragraph(agent_info, info_box_style))
    story.append(PageBreak())

    # ================= 第五章：键盘快捷键与常见 FAQ =================
    story.append(Paragraph("5. 常用键盘快捷键速查表", h1_style))
    shortcut_data = [
        [Paragraph("操作动作", table_header_style), Paragraph("macOS 快捷键", table_header_style), Paragraph("Windows / Linux 快捷键", table_header_style), Paragraph("生效场景", table_header_style)],
        [Paragraph("新建漫剧工程", table_cell_style), Paragraph("Cmd + N", table_cell_style), Paragraph("Ctrl + N", table_cell_style), Paragraph("全局生效", table_cell_style)],
        [Paragraph("保存当前工程", table_cell_style), Paragraph("Cmd + S", table_cell_style), Paragraph("Ctrl + S", table_cell_style), Paragraph("编辑器各步骤", table_cell_style)],
        [Paragraph("视频播放 / 暂停", table_cell_style), Paragraph("Space (空格键)", table_cell_style), Paragraph("Space (空格键)", table_cell_style), Paragraph("视频播放器与时间轴", table_cell_style)],
        [Paragraph("触发当前步骤 AI 生成", table_cell_style), Paragraph("Cmd + Enter", table_cell_style), Paragraph("Ctrl + Enter", table_cell_style), Paragraph("剧本分析 / 分镜渲染", table_cell_style)],
        [Paragraph("倒放 / 暂停 / 快进", table_cell_style), Paragraph("J / K / L", table_cell_style), Paragraph("J / K / L", table_cell_style), Paragraph("视频播放控制", table_cell_style)],
        [Paragraph("调起桌面内置帮助中心", table_cell_style), Paragraph("Cmd + /", table_cell_style), Paragraph("Ctrl + /", table_cell_style), Paragraph("全局生效", table_cell_style)],
    ]
    shortcut_table = Table(shortcut_data, colWidths=[120, 110, 130, 155])
    shortcut_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5),
    ]))
    story.append(shortcut_table)

    story.append(Paragraph("6. 常见故障诊断与 FAQ", h1_style))
    faq_text = (
        "<b>Q1: 为什么点击“开始分析”或“生成”时出现网络错误或超时？</b><br/>"
        "答：请在【设置】中核查 API Key 是否有效。若使用海外模型服务（OpenAI / Claude），请确认本地网络环境支持该服务的正常访问或在软件中配置了正确的代理端点。<br/><br/>"
        "<b>Q2: 导出的 4K 漫剧视频在微信或手机相册中播放黑屏？</b><br/>"
        "答：由于某些移动设备对超高码率 H.265 (HEVC) 支持不完善，建议在 Step 09 导出面板中将视频编码器切换为兼容性最好的 <b>H.264 (AVC)</b> 格式重新导出。<br/><br/>"
        "<b>Q3: 制作途中软件意外关闭，工程进度会丢失吗？</b><br/>"
        "答：不会。Kineo 内置毫秒级断点续传（Checkpoint Engine），每个分镜出图及音频对齐成果均会即时持久化写入本地工程，重新打开项目即可继续制作。"
    )
    story.append(Paragraph(faq_text, body_style))

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "🎉 <b>社区技术支持与版本更新</b><br/>"
        "• 官方开源代码仓库：https://github.com/Agions/kineo<br/>"
        "• 问题反馈与建议提交：https://github.com/Agions/kineo/issues<br/>"
        "• 在线与离线帮助：随时点击软件顶栏右上角的【? 帮助】进入多功能文档中心。",
        info_box_style
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✓ [PDF Builder] 出版级用户手册生成成功: {OUTPUT_PATH}")

if __name__ == '__main__':
    build_pdf()
