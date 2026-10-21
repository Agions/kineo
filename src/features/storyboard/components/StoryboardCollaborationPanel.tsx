/**
 * 分镜协作面板
 * 包含：分镜列表选择、镜头评论、版本管理（保存快照/版本对比/回滚）
 */

import { AlertCircle, CheckCircle2, GitCompare, RotateCcw, Save } from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/toast';
import type { StoryboardFrame } from '@/common/types/storyboard';
import { collaborationService } from '@/core/services';
import type { FrameComment, StoryboardVersion, VersionDiffSummary } from '@/core/services';

export interface StoryboardCollaborationPanelProps {
  projectId: string;
  storyboardFrames: StoryboardFrame[];
  selectedFrameId: string | undefined;
  onSelectFrame: (id: string | undefined) => void;
  /** 持久化分镜数据变更（评论、版本快照） */
  onPersistPatch: (patch: Record<string, unknown>) => void;
  /** 回滚后更新父侧 frames 列表 */
  onFrameUpdate: (frames: StoryboardFrame[]) => void;
}

export const StoryboardCollaborationPanel: React.FC<StoryboardCollaborationPanelProps> = ({
  projectId,
  storyboardFrames,
  selectedFrameId,
  onSelectFrame,
  onPersistPatch,
  onFrameUpdate,
}) => {
  // 评论相关状态
  const [commentDraft, setCommentDraft] = useState('');
  const [_storyboardComments, setStoryboardComments] = useState<FrameComment[]>([]);

  // 版本管理状态
  const [storyboardVersions, setStoryboardVersions] = useState<StoryboardVersion[]>([]);
  const [versionLabel, setVersionLabel] = useState('');
  const [compareLeftVersionId, setCompareLeftVersionId] = useState<string | undefined>(undefined);
  const [compareRightVersionId, setCompareRightVersionId] = useState<string | undefined>(undefined);
  const [versionDiff, setVersionDiff] = useState<VersionDiffSummary | null>(null);

  if (storyboardFrames.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">暂无分镜</div>
    );
  }

  const selectedFrame = storyboardFrames.find((frame) => frame.id === selectedFrameId) ?? null;
  const comments = projectId ? collaborationService.listComments(projectId, selectedFrame?.id) : [];

  // 添加评论
  const handleAddComment = () => {
    if (!projectId || !selectedFrame || !commentDraft.trim()) return;
    collaborationService.addComment({
      projectId,
      frameId: selectedFrame.id,
      content: commentDraft.trim(),
      author: 'current-user',
    });
    const updated = collaborationService.listComments(projectId);
    setStoryboardComments(updated);
    onPersistPatch({ storyboardComments: updated });
    setCommentDraft('');
    toast.success('评论已添加');
  };

  // 保存快照
  const handleSaveVersion = () => {
    if (!projectId) return;
    collaborationService.saveVersion({
      projectId,
      label: versionLabel.trim() || `版本-${new Date().toLocaleTimeString()}`,
      createdBy: 'current-user',
      payload: storyboardFrames,
    });
    const versions = collaborationService.listVersions(projectId);
    setStoryboardVersions(versions);
    onPersistPatch({ storyboardVersions: versions });
    setVersionLabel('');
    toast.success('快照已保存');
  };

  // 版本对比
  const handleCompareVersions = () => {
    if (!compareLeftVersionId || !compareRightVersionId) {
      toast.warning('请选择两个版本进行对比');
      return;
    }
    const diff = collaborationService.diffVersions(compareLeftVersionId, compareRightVersionId);
    setVersionDiff(diff);
  };

  // 回滚
  const handleRollback = () => {
    if (!projectId || !compareLeftVersionId) {
      toast.warning('请选择要回滚的版本');
      return;
    }
    const payload = collaborationService.rollback(projectId, compareLeftVersionId);
    if (!Array.isArray(payload)) {
      toast.error('回滚失败，未找到对应版本');
      return;
    }
    onPersistPatch({ storyboardFrames: payload });
    onFrameUpdate(payload as StoryboardFrame[]);
    toast.success('已回滚到所选版本');
  };

  return (
    <div className="space-y-4">
      {/* 分镜列表 */}
      <div className="space-y-2">
        <Label>选择分镜</Label>
        <Select value={selectedFrameId} onValueChange={(value) => onSelectFrame(value)}>
          <SelectTrigger>
            <SelectValue placeholder="选择分镜" />
          </SelectTrigger>
          <SelectContent>
            {storyboardFrames.map((frame, index) => (
              <SelectItem key={frame.id} value={frame.id}>
                {index + 1}. {frame.title || `分镜 ${index + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedFrame && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-1">
              <p className="font-medium">{selectedFrame.title || '未命名分镜'}</p>
              <p className="text-sm text-muted-foreground">
                {selectedFrame.sceneDescription || '无场景描述'}
              </p>
              <p className="text-sm text-muted-foreground">
                镜头: {selectedFrame.cameraType || '-'} / 时长: {selectedFrame.duration || 0}s
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 镜头评论 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">镜头评论</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder={selectedFrame ? `对 ${selectedFrame.title} 添加评论` : '先选择分镜'}
              disabled={!selectedFrame}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddComment();
                }
              }}
            />
            <Button onClick={handleAddComment} disabled={!selectedFrame || !commentDraft.trim()}>
              添加
            </Button>
          </div>

          <ScrollArea className="h-[200px]">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">暂无评论</p>
            ) : (
              <div className="space-y-2">
                {comments.map((item: FrameComment) => (
                  <div key={item.id} className="p-2 rounded-md bg-muted/50 text-sm">
                    <p>{item.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 版本管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">版本管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              placeholder="版本标签（可选）"
              className="flex-1"
            />
            <Button onClick={handleSaveVersion}>
              <Save className="h-4 w-4 mr-2" />
              保存快照
            </Button>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            {[
              {
                value: compareLeftVersionId,
                onChange: setCompareLeftVersionId,
                placeholder: '选择版本A',
              },
              {
                value: compareRightVersionId,
                onChange: setCompareRightVersionId,
                placeholder: '选择版本B',
              },
            ].map(({ value, onChange, placeholder }) => (
              <Select key={placeholder} value={value} onValueChange={onChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {storyboardVersions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            <Button variant="outline" onClick={handleCompareVersions}>
              <GitCompare className="h-4 w-4 mr-2" />
              版本差异
            </Button>

            <Button variant="destructive" onClick={handleRollback} disabled={!compareLeftVersionId}>
              <RotateCcw className="h-4 w-4 mr-2" />
              回滚到版本A
            </Button>
          </div>

          {versionDiff && (
            <Alert variant={versionDiff.changeCount > 0 ? 'default' : 'default'}>
              {versionDiff.changeCount > 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertTitle>差异字段数: {versionDiff.changeCount}</AlertTitle>
              <AlertDescription>
                {versionDiff.changedKeys.slice(0, 8).join(', ') || '无差异'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryboardCollaborationPanel;
