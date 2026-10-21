import { saveAs } from 'file-saver';
import { Download, FileText, FileType, Globe } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/toast';
import { Tooltip } from '@/components/ui/tooltip';
import type { Script } from '@/common/types';
import { logger } from '@/core/utils/logger';

import styles from './ExportPanel.module.less';

/** 导出格式类型 */

/**
 * 脚本导出函数 - 支持多种格式
 * @param script 脚本数据
 * @param format 导出格式 (txt|srt|pdf|html)
 * @param filename 文件名（不含扩展名）
 */
const exportScript = async (script: Script, format: ExportFormat, filename: string) => {
  const content = generateScriptContent(script, format);
  const mimeType = getMimeType(format);
  const extension = format;

  // 使用 file-saver 保存文件
  const blob = new Blob([content], { type: mimeType });
  saveAs(blob, `${filename}.${extension}`);
};

/**
 * 根据格式生成脚本内容
 */
const generateScriptContent = (script: Script, format: ExportFormat): string => {
  switch (format) {
    case 'txt':
      return generateTxtContent(script);
    case 'srt':
      return generateSrtContent(script);
    case 'pdf':
      return generatePdfText(script);
    case 'html':
      return generateHtmlContent(script);
    default:
      return generateTxtContent(script);
  }
};

/**
 * 生成纯文本格式
 */
const generateTxtContent = (script: Script): string => {
  const lines: string[] = [];
  lines.push(`# ${script.title || '脚本'}\n`);
  lines.push(`创建时间: ${new Date().toLocaleString()}\n`);
  lines.push('='.repeat(50));
  lines.push('');

  if (script.scenes) {
    script.scenes.forEach((scene, index) => {
      lines.push(`\n[场景 ${index + 1}] ${scene.description || ''}`);
      if (scene.dialogues) {
        scene.dialogues.forEach((d) => {
          lines.push(`  ${d.character}: ${d.text}`);
        });
      }
    });
  } else if (script.content) {
    lines.push(script.content);
  }

  return lines.join('\n');
};

/**
 * 生成 SRT 字幕格式
 */
const generateSrtContent = (script: Script): string => {
  const subtitles: string[] = [];
  let index = 1;

  if (script.scenes) {
    script.scenes.forEach((scene) => {
      if (scene.dialogues) {
        scene.dialogues.forEach((d) => {
          const startTime = formatSrtTime(scene.startTime || 0);
          const endTime = formatSrtTime((scene.startTime || 0) + (d.duration || 3));
          subtitles.push(`${index}`);
          subtitles.push(`${startTime} --> ${endTime}`);
          subtitles.push(`${d.character}: ${d.text}`);
          subtitles.push('');
          index++;
        });
      }
    });
  }

  return subtitles.join('\n');
};

/**
 * 格式化 SRT 时间 (HH:MM:SS,mmm)
 */
const formatSrtTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

/**
 * 生成 PDF 文本（jsPDF 需要单独处理）
 * 注意：此函数返回文本，实际 PDF 生成在 exportScript 中调用 jsPDF
 */
const generatePdfText = (script: Script): string => {
  return generateTxtContent(script);
};

/**
 * 生成 HTML 格式
 */
const generateHtmlContent = (script: Script): string => {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${script.title || '脚本'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #FF6B35; padding-bottom: 10px; }
    .scene { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
    .scene-title { font-weight: bold; color: #FF6B35; margin-bottom: 10px; }
    .dialogue { margin: 8px 0; }
    .character { font-weight: bold; color: #555; }
    .meta { color: #888; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>${script.title || '脚本'}</h1>
  <p class="meta">导出时间: ${new Date().toLocaleString()}</p>
  ${
    script.scenes
      ? script.scenes
          .map(
            (scene, i) => `
    <div class="scene">
      <div class="scene-title">场景 ${i + 1}: ${scene.description || ''}</div>
      ${
        scene.dialogues
          ? scene.dialogues
              .map(
                (d) => `
        <div class="dialogue">
          <span class="character">${d.character}:</span> ${d.text}
        </div>
      `
              )
              .join('')
          : ''
      }
    </div>
  `
          )
          .join('')
      : `<pre>${script.content || ''}</pre>`
  }
</body>
</html>`;
  return html;
};

/**
 * 获取 MIME 类型
 */
const getMimeType = (format: ExportFormat): string => {
  const mimeTypes: Record<ExportFormat, string> = {
    txt: 'text/plain;charset=utf-8',
    srt: 'text/plain;charset=utf-8',
    pdf: 'application/pdf',
    html: 'text/html;charset=utf-8',
  };
  return mimeTypes[format];
};

// 导出格式
type ExportFormat = 'txt' | 'srt' | 'pdf' | 'html';

interface ExportPanelProps {
  script: Script;
}

function ExportPanel({ script }: ExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('txt');
  const [filename, setFilename] = useState<string>(`脚本_${script.id || 'draft'}`);
  const [exporting, setExporting] = useState(false);

  // handleFormatChange is no longer needed - using RadioGroup onValueChange directly

  // 处理文件名变更
  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilename(e.target.value);
  };

  // 执行导出
  const handleExport = async () => {
    if (!filename.trim()) {
      toast.error('请输入有效的文件名');
      return;
    }

    setExporting(true);
    try {
      await exportScript(script, exportFormat as 'txt' | 'srt', filename);
      toast.success(`脚本已成功导出为${exportFormat.toUpperCase()}格式`);
    } catch (error) {
      logger.error('导出失败:', error);
      toast.error('导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card
      title="导出脚本"
      className={styles.exportPanel}
      extra={
        <Tooltip title="导出后的文件将保存到您选择的位置">
          <Button
            variant="default"
            icon={<Download size={16} />}
            onClick={handleExport}
            loading={exporting}
          >
            导出
          </Button>
        </Tooltip>
      }
    >
      <div className={styles.content}>
        <div className={styles.filenameSection}>
          <label htmlFor="filename" className={styles.label}>
            文件名:
          </label>
          <Input
            id="filename"
            value={filename}
            onChange={handleFilenameChange}
            placeholder="输入文件名(不含扩展名)"
            className={styles.filenameInput}
          />
        </div>

        <div className={styles.formatSection}>
          <span className={styles.label}>导出格式:</span>
          <RadioGroup
            value={exportFormat}
            onChange={(value) => setExportFormat(value as ExportFormat)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RadioGroupItem value="txt" id="txt" />
                <label
                  htmlFor="txt"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                >
                  <FileText size={16} /> 纯文本 (.txt)
                  <span className={styles.formatDesc}>- 简单文本格式，适合通用场景</span>
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RadioGroupItem value="srt" id="srt" />
                <label
                  htmlFor="srt"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                >
                  <FileText size={16} /> 字幕文件 (.srt)
                  <span className={styles.formatDesc}>- 标准字幕格式，可导入视频编辑软件</span>
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RadioGroupItem value="pdf" id="pdf" />
                <label
                  htmlFor="pdf"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                >
                  <FileType size={16} /> PDF文档 (.pdf)
                  <span className={styles.formatDesc}>- 带格式的PDF文档，适合打印或分享</span>
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RadioGroupItem value="html" id="html" />
                <label
                  htmlFor="html"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                >
                  <Globe size={16} /> 网页 (.html)
                  <span className={styles.formatDesc}>- 可在浏览器中打开的网页格式</span>
                </label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>
    </Card>
  );
}

export default ExportPanel;
