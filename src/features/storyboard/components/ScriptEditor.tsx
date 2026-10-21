/**
 * ScriptEditor — 脚本片段编辑器
 *
 * 受控组件：外部通过 segments/onSegmentsChange 管理状态,
 * 添加/删除/编辑操作通过 onSegmentsChange 回调向上传递。
 */

import { convertFileSrc } from '@tauri-apps/api/core';
import { Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import type { VideoSegment } from '@/common/types/script';
import { formatDurationShort } from '@/common/utils';
import { ExportMenu } from '@/components/ai/ExportMenu';
import { SegmentTable } from '@/components/ai/SegmentTable';
import { tauriService } from '@/core/services';
import { logger } from '@/core/utils/logger';
import { theme } from '@/styles/theme';

import styles from './ScriptEditor.module.less';

// --- Props ---

export interface ScriptEditorProps {
  /** 片段列表（受控） */
  segments: VideoSegment[];
  /** 片段变更回调 */
  onSegmentsChange: (segments: VideoSegment[]) => void;
  /** 视频路径（用于预览生成，可选） */
  videoPath?: string;
}

// --- Component ---

function ScriptEditor({ segments, onSegmentsChange, videoPath = '' }: ScriptEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    start: number;
    end: number;
    type: string;
    content: string;
  } | null>(null);

  // Dialog states
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [exportMenuVisible, setExportMenuVisible] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState<number | null>(null);

  const totalDuration = useMemo(
    () => segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0),
    [segments]
  );

  // --- handlers ---

  const handleAddSegment = () => {
    const lastSeg = segments.length > 0 ? segments[segments.length - 1] : null;
    const start = lastSeg ? lastSeg.end : 0;
    setEditForm({ start, end: start + 30, type: 'narration', content: '' });
    setEditingIndex(segments.length);
  };

  const handleEditSegment = (index: number) => {
    const seg = segments[index];
    setEditForm({
      start: seg.start,
      end: seg.end,
      type: seg.type || 'narration',
      content: seg.content || '',
    });
    setEditingIndex(index);
  };

  const handleSaveSegment = () => {
    if (!editForm || editingIndex === null) return;
    if (editForm.end <= editForm.start) {
      toast.error('结束时间必须大于开始时间');
      return;
    }

    const updated = [...segments];
    const seg: VideoSegment = {
      id: updated[editingIndex]?.id || `seg_${Date.now()}`,
      start: editForm.start,
      end: editForm.end,
      type: editForm.type,
      content: editForm.content,
    };

    if (editingIndex < segments.length) {
      updated[editingIndex] = seg;
    } else {
      updated.push(seg);
    }

    onSegmentsChange(updated);
    setEditingIndex(null);
    setEditForm(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const handleDeleteSegment = (index: number) => {
    setSegmentToDelete(index);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (segmentToDelete !== null) {
      const updated = [...segments];
      updated.splice(segmentToDelete, 1);
      onSegmentsChange(updated);
    }
    setDeleteConfirmOpen(false);
    setSegmentToDelete(null);
  };

  const handlePreviewSegment = async (index: number) => {
    try {
      setPreviewLoading(true);
      const seg = segments[index];
      const previewPath = await tauriService.generatePreview({
        inputPath: videoPath,
        segment: { start: seg.start, end: seg.end, type: 'preview' },
      });
      setPreviewSrc(convertFileSrc(previewPath));
      setPreviewVisible(true);
    } catch (error) {
      logger.error('生成预览失败:', error);
      toast.error('生成预览失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExport = (format: string) => {
    setExportMenuVisible(false);
    // Convert segments to the requested format and trigger download
    const content = segments
      .map(
        (seg) =>
          `[${formatDurationShort(seg.start)} - ${formatDurationShort(seg.end)}] ${seg.content || ''}`
      )
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAIImprove = () => {
    setAiModalVisible(false);
    toast.info('AI 优化功能即将上线');
  };

  // --- render ---

  return (
    <div className={styles.scriptEditor}>
      <Card
        title="脚本编辑"
        className={styles.editorCard}
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="outline"
              icon={<Sparkles size={16} />}
              onClick={() => setAiModalVisible(true)}
            >
              AI优化
            </Button>
            <ExportMenu
              visible={exportMenuVisible}
              onToggle={() => setExportMenuVisible((v) => !v)}
              onExport={handleExport}
            />
          </div>
        }
      >
        <div className={styles.statsBar}>
          <div>总片段: {segments.length}</div>
          <div>总时长: {formatDurationShort(totalDuration)}</div>
        </div>

        <SegmentTable
          segments={segments}
          onAdd={handleAddSegment}
          onEdit={handleEditSegment}
          onPreview={handlePreviewSegment}
          onDelete={handleDeleteSegment}
        />

        {editingIndex !== null && editForm && (
          <div className={styles.editForm}>
            <Card title={`编辑片段 #${editingIndex + 1}`} className={styles.editCard}>
              <div className={styles.timeInputs}>
                <div className={styles.formField}>
                  <label
                    style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}
                  >
                    开始时间 (秒)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editForm.start}
                    onChange={(e) =>
                      setEditForm({ ...editForm, start: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className={styles.formField}>
                  <label
                    style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}
                  >
                    结束时间 (秒)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editForm.end}
                    onChange={(e) =>
                      setEditForm({ ...editForm, end: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                  类型
                </label>
                <Select
                  value={editForm.type}
                  onValueChange={(v) => setEditForm({ ...editForm, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="narration">旁白</SelectItem>
                    <SelectItem value="dialogue">对白</SelectItem>
                    <SelectItem value="action">动作</SelectItem>
                    <SelectItem value="transition">转场</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.formField}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
                  内容
                </label>
                <textarea
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme.borders.medium}`,
                    borderRadius: 6,
                    fontSize: 14,
                    resize: 'vertical',
                  }}
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                />
              </div>

              <div className={styles.formActions}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outline" onClick={handleCancelEdit}>
                    取消
                  </Button>
                  <Button variant="default" onClick={handleSaveSegment}>
                    保存
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Card>

      {/* Preview dialog */}
      <Dialog open={previewVisible} onOpenChange={setPreviewVisible}>
        <DialogContent style={{ maxWidth: 700 }}>
          <DialogHeader>
            <DialogTitle>预览片段</DialogTitle>
          </DialogHeader>
          <div className={styles.previewContainer}>
            {previewLoading ? (
              <div className={styles.previewLoading}>
                <p>正在生成预览...</p>
              </div>
            ) : (
              <video
                src={previewSrc}
                controls
                autoPlay
                className={styles.previewVideo}
                style={{ width: '100%' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI optimize dialog */}
      <Dialog open={aiModalVisible} onOpenChange={setAiModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI 优化脚本</DialogTitle>
          </DialogHeader>
          <p>使用 AI 优化脚本将会根据视频内容和当前脚本，生成更加专业的表达和结构。</p>
          <p>点击确定开始优化。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiModalVisible(false)}>
              取消
            </Button>
            <Button variant="default" onClick={handleAIImprove}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p>确定要删除这个片段吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ScriptEditor;
