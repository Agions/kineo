/**
 * 小说/剧本一站式沉浸输入框导入组件 — 赛博朋克 2026 版
 * 彻底替换陈旧的“方式一/方式二”分块布局，提供专业级沉浸大文本编辑器与文件拖拽功能
 */

import {
  Upload,
  FileText,
  Trash2,
  Sparkles,
  Clipboard,
  FileCode2,
  CheckCircle2,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import React, { useState, useTransition } from 'react';

import { Loading } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import type { ScriptChapter, ScriptSource, ScriptValidationResult } from '@/common/types';
import { handleAsyncError } from '@/common/utils/async';
import { scriptImportService, tauriService } from '@/core/services';

import styles from './NovelImporter.module.less';

interface NovelImporterProps {
  initialContent?: string;
  onContentLoad: (content: string, metadata: ScriptImportMetadata) => void;
  onRemove?: () => void;
  loading?: boolean;
}

export interface ScriptImportMetadata {
  filename: string;
  fileFormat: ScriptSource['fileFormat'];
  sourceType: ScriptSource['sourceType'];
  fileSize: number;
  charCount: number;
  estimatedChapters: number;
  chapterCount: number;
  chapters: ScriptChapter[];
  validation: ScriptValidationResult;
}

// 热门漫剧测试范例
const SAMPLE_SCRIPTS = [
  {
    title: '🔥 赛博修仙·机械灵根',
    text: `【第一章：电路板上的符文】
深夜，黑客城市“新长安”的地下 300 米。
江城擦干手臂上的散热液，将最后一枚“金丹期”计算芯片接入脊柱。
屏幕上，数万条加密阵列疯狂闪烁：
“提示：识别到九天玄天金丹引擎，算力突破 100 000 TFLOPS。”
追捕者的履带机械犬撞碎了合金大门，红外激光扫过江城冷漠的脸庞：
“罪犯江城，交出你的非法计算金丹！”
江城嘴角微微上扬，瞳孔中浮现出金色雷劫符咒：
“御剑术·光纤飞剑，启动！”`,
  },
  {
    title: '⚡ 都市战神·修罗归来',
    text: `【第一场：龙王归来】
时间：黄昏  地点：江城第一财团会议室
三年前，他是被家族弃如敝履的赘婿；
三年后，他是统领十万修罗卫的无敌战神。
秦天推开玻璃大门，冷眼扫视场上众叛亲离的长老们：
“三分钟，我要让江城所有针对苏雪的封锁项目彻底破产。”
秘书战战兢兢地递上加密终端：
“报告战神，全球最大的算力网与资金池，已经全额注入！”`,
  },
  {
    title: '🌌 规则怪谈·高维游戏',
    text: `【第一法则：不要回答小女孩】
守则一：晚上 12 点后，走廊里的滴水声是正常的，切勿开门查看。
守则二：如果你在镜子里看到自己的倒影笑了，请立刻合上眼睛计数 10 秒。
林默紧握手里的诡异铅笔，在墙壁缝隙里刻下最后一行血字：
“他们…已经混进NPC里了！”`,
  },
];

function NovelImporter({
  initialContent,
  onContentLoad,
  onRemove,
  loading = false,
}: NovelImporterProps) {
  const [content, setContent] = useState<string>(initialContent || '');
  const [metadata, setMetadata] = useState<ScriptImportMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [, startTransition] = useTransition();

  const buildMetadata = (
    nextContent: string,
    params: { filename: string; sourceType: ScriptSource['sourceType']; filePath?: string }
  ): ScriptImportMetadata => {
    const result = scriptImportService.analyzeImport({
      content: nextContent,
      filename: params.filename,
      sourceType: params.sourceType,
      filePath: params.filePath,
    });

    return {
      filename: result.source.filename,
      fileFormat: result.source.fileFormat,
      sourceType: result.source.sourceType,
      fileSize: result.source.fileSize,
      charCount: result.source.charCount,
      estimatedChapters: result.estimatedChapters,
      chapterCount: result.chapters.length,
      chapters: result.chapters,
      validation: result.validation,
    };
  };

  /**
   * 选择小说文件
   */
  const handleSelectFile = async () => {
    try {
      const selected = await tauriService.openFile({
        multiple: false,
        filters: [
          {
            name: '小说/剧本文件',
            extensions: ['txt', 'md', 'docx'],
          },
        ],
      });

      if (!selected || Array.isArray(selected)) return;
      const filePath = selected as string;
      setIsLoading(true);

      try {
        const fileContent = await tauriService.readText(filePath);
        const filename = filePath.split(/[\\/]/).pop() || '未知文件';
        const novelMetadata = buildMetadata(fileContent, {
          filename,
          sourceType: 'file',
          filePath,
        });

        if (!validateOrToast(novelMetadata)) return;

        setContent(fileContent);
        setMetadata(novelMetadata);
        onContentLoad(fileContent, novelMetadata);
        toast.success(
          `🎉 文件《${filename}》导入成功！已识别 ${novelMetadata.chapters.length} 个章节`
        );
      } catch (error) {
        handleAsyncError(error, '读取文件失败', {
          toastMessage: '读取文件失败，建议使用标准的 TXT/MD 编码格式',
        });
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      handleAsyncError(error, '选择文件失败', { toastMessage: '选择文件失败，请重试' });
    }
  };

  /**
   * 校验元数据
   */
  const validateOrToast = (novelMetadata: ReturnType<typeof buildMetadata>): boolean => {
    const errors = novelMetadata.validation.issues.filter((issue) => issue.level === 'error');
    if (errors.length > 0) {
      toast.error(errors[0].message);
      return false;
    }
    return true;
  };

  /**
   * 从剪贴板粘贴
   */
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text?.trim()) {
        toast.warning('剪贴板中暂无有效文本内容');
        return;
      }
      setContent(text);
      toast.success('已从剪贴板粘贴文本内容');
    } catch {
      toast.error('无法访问剪贴板，请手动 Ctrl+V / Cmd+V 粘贴');
    }
  };

  /**
   * 提交确认导入
   */
  const handleSubmitContent = () => {
    if (!content.trim()) {
      toast.warning('请输入或导入小说/剧本文本');
      return;
    }

    const novelMetadata = buildMetadata(content, {
      filename: '文本剧本',
      sourceType: 'manual',
    });

    if (!validateOrToast(novelMetadata)) return;

    setMetadata(novelMetadata);
    onContentLoad(content, novelMetadata);
    toast.success(`⚡ 成功加载剧本内容！共 ${novelMetadata.charCount.toLocaleString()} 字`);
  };

  /**
   * 填入预设剧本范例
   */
  const handleLoadSample = (sampleText: string, sampleTitle: string) => {
    setContent(sampleText);
    toast.info(`已填入【${sampleTitle}】漫剧示例大纲`);
  };

  /**
   * 清空文本
   */
  const handleClear = () => {
    setContent('');
    setMetadata(null);
    if (onRemove) onRemove();
    toast.info('文本已清空');
  };

  // 动态字符与行数统计
  const charCount = content.length;
  const lineCount = content ? content.split('\n').length : 0;

  return (
    <div className={styles.novelImporter}>
      {(loading || isLoading) && <Loading tip={isLoading ? '读取分析中...' : '加载中...'} />}

      <div className={styles.heroInputCard}>
        {/* 顶部工具栏 */}
        <div className={styles.toolbarHeader}>
          <div className={styles.toolbarTitle}>
            <FileText className="w-5 h-5 text-[#00f5d4] m-neon-pulse" />
            <h3>剧本 / 小说文本编辑器</h3>
            <span className={styles.toolbarBadge}>TXT · MD · DOCX</span>
          </div>

          <div className={styles.quickActions}>
            <button
              type="button"
              onClick={handleSelectFile}
              className={`${styles.quickBtn} ${styles.primaryFileBtn}`}
              title="从本地选择 TXT / MD / DOCX 文件"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>选择文件导入</span>
            </button>

            <button
              type="button"
              onClick={handlePasteClipboard}
              className={styles.quickBtn}
              title="从系统剪贴板粘贴文本"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>剪贴板粘贴</span>
            </button>

            {content && (
              <button
                type="button"
                onClick={handleClear}
                className={styles.quickBtn}
                title="清空当前所有文本内容"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>清空</span>
              </button>
            )}
          </div>
        </div>

        {/* 核心沉浸编辑器 + 拖拽 Overlay */}
        <div
          className={`${styles.editorDropZone} ${isDragging ? styles.isDragging : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const files = e.dataTransfer.files;
            if (files && files[0]) {
              const file = files[0];
              const reader = new FileReader();
              reader.onload = (evt) => {
                const text = evt.target?.result as string;
                if (text) {
                  setContent(text);
                  toast.success(`拖拽成功！导入文件 《${file.name}》`);
                }
              };
              reader.readAsText(file);
            }
          }}
        >
          {isDragging && (
            <div className={styles.dragOverlay}>
              <Upload className="w-10 h-10 animate-bounce text-[#00f5d4]" />
              <span>松开鼠标，直接导入文件内容</span>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => {
              const val = e.target.value;
              startTransition(() => {
                setContent(val);
              });
            }}
            placeholder="在此粘贴或输入您的原著小说、漫剧大纲、剧本文本... 
或者直接从电脑拖拽 .txt / .md 文件放置到本区域。"
            className={styles.heroTextarea}
          />

          {/* 编辑器底部 Status Bar */}
          <div className={styles.editorFooter}>
            <div className={styles.metaStats}>
              <div className={styles.statItem}>
                <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{charCount.toLocaleString()}</span> 字
              </div>

              <div className={styles.statItem}>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>{lineCount}</span> 行
              </div>

              {metadata && (
                <div className={styles.statItem}>
                  <BookOpen className="w-3.5 h-3.5 text-[#00f5d4]" />
                  预估 <span>{metadata.estimatedChapters}</span> 章节
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-[#00f5d4]/10 text-[#00f5d4] border-[#00f5d4]/30 text-[10px]">
                <Sparkles className="w-3 h-3 mr-1" /> AI 智能切分支持
              </Badge>
            </div>
          </div>
        </div>

        {/* 热门漫剧示例选择 */}
        <div className={styles.samplePillGroup}>
          <span>💡 快速填入热门范例:</span>
          {SAMPLE_SCRIPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadSample(sample.text, sample.title)}
              className={styles.samplePill}
            >
              {sample.title}
            </button>
          ))}
        </div>

        {/* 底部提交按钮 */}
        <div className={styles.submitBar}>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff88]" />
            支持多章节长篇连续生成与高精角色一致性抽离
          </p>

          <button
            type="button"
            disabled={!content.trim()}
            onClick={handleSubmitContent}
            className={styles.submitBtn}
          >
            <span>确认导入并进行智能分析</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 如果已成功识别元数据，显示预览提示 Alert */}
        {metadata && (
          <Alert className="mt-4 bg-[#00f5d4]/10 border-[#00f5d4]/30">
            <AlertDescription className="text-xs text-[#00f5d4] flex items-center justify-between">
              <div>
                🎉 剧本 <strong>《{metadata.filename}》</strong> 已就绪，包含{' '}
                {metadata.charCount.toLocaleString()} 字，已自动识别到 {metadata.chapterCount}{' '}
                个核心场次。
              </div>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 text-xs text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> 移除
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

export default NovelImporter;
