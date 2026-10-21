import { motion } from 'framer-motion';
import {
  PlayCircle,
  PauseCircle,
  Settings,
  Video,
  FastForward,
  Plus,
  Trash2,
  Download,
  Palette,
} from 'lucide-react';
import React, { memo, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/divider';
import Empty from '@/components/ui/empty';
import { Flex } from '@/components/ui/flex';
import { Row, Col } from '@/components/ui/grid';
import { InputNumber } from '@/components/ui/input-number';
import { Modal } from '@/components/ui/modal';
import { SelectItem, AntDSelect as Select } from '@/components/ui/select';
import { Space } from '@/components/ui/space';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Tag } from '@/components/ui/tag';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import type {
  StoryboardFrame,
  CompositionProject,
  FrameAnimation,
  AnimationKeyframe,
} from '@/common/types';

import FrameEditForm from './FrameEditForm';
import GlobalSettingsForm from './GlobalSettingsForm';
import styles from './index.module.less';
import { useCompositionStudio } from './useCompositionStudio';

// PreviewArea subcomponent
interface PreviewAreaProps {
  currentFrame: StoryboardFrame | undefined;
  currentFrameConfig: FrameAnimation | undefined;
  currentFrameIndex: number;
  frameDuration: number;
  framesLength: number;
}

const PreviewArea: React.FC<PreviewAreaProps> = memo(
  ({ currentFrame, currentFrameConfig, currentFrameIndex, frameDuration, framesLength }) => (
    <div className={styles.previewArea}>
      {currentFrame?.imageUrl ? (
        <motion.div
          className={styles.previewFrame}
          animate={{
            scale: currentFrameConfig?.zoom ?? 1,
            rotate: currentFrameConfig?.rotation ?? 0,
            opacity: currentFrameConfig?.opacity ?? 1,
            x: (currentFrameConfig?.pan?.x ?? 0) * 5,
            y: (currentFrameConfig?.pan?.y ?? 0) * 5,
          }}
          transition={{
            duration: frameDuration,
            ease: 'easeInOut',
          }}
          style={{
            filter: `
            blur(${currentFrameConfig?.filters?.blur ?? 0}px)
            brightness(${currentFrameConfig?.filters?.brightness ?? 100}%)
            contrast(${currentFrameConfig?.filters?.contrast ?? 100}%)
            saturate(${currentFrameConfig?.filters?.saturation ?? 100}%)
          `,
          }}
        >
          <img src={currentFrame.imageUrl} alt={currentFrame.title} />
        </motion.div>
      ) : (
        <Empty description="请先完成场景渲染" />
      )}
      <div className={styles.frameIndicator}>
        帧 {currentFrameIndex + 1} / {framesLength} · {frameDuration}s
      </div>
    </div>
  )
);

// PlaybackControls subcomponent
interface PlaybackControlsProps {
  currentFrameIndex: number;
  framesLength: number;
  playbackSpeed: number;
  onPrev: () => void;
  onNext: () => void;
  onSpeedChange: (speed: number) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = memo(
  ({ currentFrameIndex, framesLength, playbackSpeed, onPrev, onNext, onSpeedChange }) => (
    <div className={styles.controls}>
      <Divider orientation="left">播放控制</Divider>
      <Row gutter={8} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Space>
            <Button onClick={onPrev} disabled={currentFrameIndex === 0}>
              上一帧
            </Button>
            <Button onClick={onNext} disabled={currentFrameIndex >= framesLength - 1}>
              下一帧
            </Button>
          </Space>
        </Col>
        <Col span={12}>
          <Space>
            <Text>速度:</Text>
            <Select
              value={String(playbackSpeed)}
              onChange={(v) => onSpeedChange(parseFloat(String(v)))}
              style={{ width: 80 }}
            >
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </Select>
          </Space>
        </Col>
      </Row>
    </div>
  )
);

// AnimationTableRow subcomponent
interface AnimationTableRowProps {
  record: FrameAnimation;
  frame: StoryboardFrame | undefined;
  onEdit: (frameId: string) => void;
  onOpenKeyframes: (frameId: string) => void;
}

const AnimationTableRow: React.FC<AnimationTableRowProps> = memo(
  ({ record, frame, onEdit, onOpenKeyframes }) => {
    const type = record.cameraMotion?.type;
    return (
      <TableRow key={record.frameId}>
        <TableCell>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{frame?.title ?? record.frameId}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{frame?.sceneDescription}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
        <TableCell>
          <Tag color={type ? 'blue' : 'default'}>{type ?? '静止'}</Tag>
        </TableCell>
        <TableCell>{((record.zoom ?? 1) * 100).toFixed(0)}%</TableCell>
        <TableCell>{(record.rotation ?? 0).toFixed(0)}°</TableCell>
        <TableCell>{((record.opacity ?? 1) * 100).toFixed(0)}%</TableCell>
        <TableCell>
          <Tag color={record.keyframes?.length ? 'green' : 'default'}>
            {record.keyframes?.length ?? 0}
          </Tag>
        </TableCell>
        <TableCell>
          <Space>
            <Button size="sm" variant="outline" onClick={() => onEdit(record.frameId)}>
              编辑
            </Button>
            <Button size="sm" variant="outline" onClick={() => onOpenKeyframes(record.frameId)}>
              关键帧
            </Button>
          </Space>
        </TableCell>
      </TableRow>
    );
  }
);

// KeyframeEditorContent subcomponent

// KeyframeEditorContent subcomponent
interface KeyframeEditorContentProps {
  keyframes: AnimationKeyframe[];
  frameDuration: number;
  onDeleteKeyframe: (index: number) => void;
}

const KeyframeEditorContent: React.FC<KeyframeEditorContentProps> = memo(
  ({ keyframes, frameDuration, onDeleteKeyframe }) => (
    <div className={styles.keyframeEditor}>
      <Divider orientation="left">关键帧列表</Divider>
      <div className={styles.keyframeList}>
        {keyframes.length === 0 ? (
          <Empty description="暂无关键帧" />
        ) : (
          <Timeline>
            {keyframes.map((kf, idx) => (
              <TimelineItem key={idx} dot={<Tag color="blue">{kf.time}s</Tag>} color="blue">
                <Space>
                  <span className="font-semibold">{kf.property}</span>
                  <span>= {kf.value}</span>
                  <Text type="secondary">({kf.easing})</Text>
                  <Button size="sm" variant="destructive" onClick={() => onDeleteKeyframe(idx)}>
                    <Trash2 />
                  </Button>
                </Space>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </div>

      <Divider orientation="left">添加关键帧</Divider>
      <Row gutter={16}>
        <Col span={8}>
          <label className="block text-sm font-medium mb-1">时间点 (秒)</label>
          <InputNumber min={0} max={frameDuration} style={{ width: '100%' }} placeholder="0-3" />
        </Col>
        <Col span={8}>
          <label className="block text-sm font-medium mb-1">属性</label>
          <Select placeholder="选择属性">
            <SelectItem value="zoom">缩放</SelectItem>
            <SelectItem value="rotation">旋转</SelectItem>
            <SelectItem value="opacity">透明度</SelectItem>
            <SelectItem value="pan-x">水平平移</SelectItem>
            <SelectItem value="pan-y">垂直平移</SelectItem>
          </Select>
        </Col>
        <Col span={8}>
          <label className="block text-sm font-medium mb-1">值</label>
          <InputNumber style={{ width: '100%' }} placeholder="数值" />
        </Col>
      </Row>
      <Button type="dashed" block icon={<Plus />}>
        添加关键帧
      </Button>
    </div>
  )
);

interface CompositionStudioProps {
  frames: StoryboardFrame[];
  projectId?: string;
  onCompositionChange?: (composition: CompositionProject) => void;
}

// 镜头运动类型选项

// 转场效果选项

const CompositionStudio = ({ frames, projectId, onCompositionChange }: CompositionStudioProps) => {
  const {
    composition,
    editingFrameId,
    setEditingFrameId,
    frameModalVisible,
    setFrameModalVisible,
    globalModalVisible,
    setGlobalModalVisible,
    keyframeModalVisible,
    setKeyframeModalVisible,
    previewModalVisible,
    setPreviewModalVisible,
    isPlaying,
    currentFrameIndex,
    playbackSpeed,
    setPlaybackSpeed,
    keyframes,
    handleEditFrame,
    handleOpenKeyframes,
    handleSaveKeyframes,
    handleDeleteKeyframe,
    handleSaveFrame,
    handleResetFrame,
    handleOpenGlobalSettings,
    handleSaveGlobalSettings,
    handlePreviewTransition,
    handleExportComposition,
    handlePlay,
    handlePause,
    handleNext,
    handlePrev,
  } = useCompositionStudio({ frames, projectId, onCompositionChange });

  // 当前帧的动画配置
  const currentFrameConfig = useMemo(() => {
    return composition.frames.find((f) => f.frameId === frames[currentFrameIndex]?.id);
  }, [composition.frames, currentFrameIndex, frames]);

  // 当前帧对象
  const currentFrame = frames[currentFrameIndex];

  return (
    <div className={styles.container}>
      <Card
        title={
          <Flex>
            <Video />
            <span>动态合成工作室</span>
          </Flex>
        }
        extra={
          <Space>
            <Button icon={<Settings />} onClick={handleOpenGlobalSettings}>
              全局设置
            </Button>
            <Button icon={<Palette />} onClick={() => setPreviewModalVisible(true)}>
              效果预览
            </Button>
            <Button
              icon={<Download />}
              onClick={handleExportComposition}
              disabled={composition.frames.length === 0}
            >
              导出数据
            </Button>
            {!isPlaying ? (
              <Button
                type="primary"
                icon={<PlayCircle />}
                onClick={handlePlay}
                disabled={frames.length === 0}
              >
                播放预览
              </Button>
            ) : (
              <Button icon={<PauseCircle />} onClick={handlePause}>
                暂停
              </Button>
            )}
            <Button
              icon={<FastForward />}
              onClick={handleNext}
              disabled={currentFrameIndex >= frames.length - 1}
            >
              下一帧
            </Button>
          </Space>
        }
      >
        <Row gutter={16}>
          {/* 左侧预览区 */}
          <Col span={12}>
            <PreviewArea
              currentFrame={currentFrame}
              currentFrameConfig={currentFrameConfig}
              currentFrameIndex={currentFrameIndex}
              frameDuration={composition.masterSettings.frameDuration}
              framesLength={frames.length}
            />
          </Col>

          {/* 右侧控制面板 */}
          <Col span={12}>
            <div className={styles.controls}>
              <PlaybackControls
                currentFrameIndex={currentFrameIndex}
                framesLength={frames.length}
                playbackSpeed={playbackSpeed}
                onPrev={handlePrev}
                onNext={handleNext}
                onSpeedChange={setPlaybackSpeed}
              />
              <Divider orientation="left">全局设置</Divider>
              <Row gutter={8} align="middle">
                <Col span={12}>
                  <Text>每帧默认时长: {composition.masterSettings.frameDuration}s</Text>
                </Col>
                <Col span={12}>
                  <Button type="link" onClick={handleOpenGlobalSettings}>
                    修改
                  </Button>
                </Col>
              </Row>

              <Divider orientation="left">默认转场</Divider>
              <Row gutter={8} align="middle">
                <Col span={14}>
                  <Text>
                    {composition.masterSettings.defaultTransition.effect}(
                    {composition.masterSettings.defaultTransition.duration}s)
                  </Text>
                </Col>
                <Col span={10}>
                  <Button
                    size="small"
                    onClick={() =>
                      handlePreviewTransition(composition.masterSettings.defaultTransition)
                    }
                  >
                    预览
                  </Button>
                </Col>
              </Row>

              <Divider orientation="left">动画列表</Divider>
              <div className={styles.tableContainer}>
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: 150 }}>分镜</TableHead>
                      <TableHead style={{ width: 120 }}>镜头运动</TableHead>
                      <TableHead style={{ width: 80 }}>缩放</TableHead>
                      <TableHead style={{ width: 80 }}>旋转</TableHead>
                      <TableHead style={{ width: 80 }}>透明度</TableHead>
                      <TableHead style={{ width: 80 }}>关键帧</TableHead>
                      <TableHead style={{ width: 150 }}>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {composition.frames.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          暂无动画配置
                        </TableCell>
                      </TableRow>
                    ) : (
                      composition.frames.map((record) => (
                        <AnimationTableRow
                          key={record.frameId}
                          record={record}
                          frame={frames.find((f) => f.id === record.frameId)}
                          onEdit={handleEditFrame}
                          onOpenKeyframes={handleOpenKeyframes}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 帧编辑模态框 */}
      <Modal
        title={`编辑动画 - ${frames.find((f) => f.id === editingFrameId)?.title ?? ''}`}
        open={frameModalVisible}
        onCancel={() => {
          setFrameModalVisible(false);
          setEditingFrameId(null);
        }}
        width={700}
        cancelText="取消"
        footer={null}
      >
        {editingFrameId && (
          <FrameEditForm
            frameId={editingFrameId}
            initialValues={composition.frames.find((f) => f.frameId === editingFrameId)}
            onSave={handleSaveFrame}
            onReset={handleResetFrame}
          />
        )}
      </Modal>

      {/* 关键帧编辑器模态框 */}
      <Modal
        title={`关键帧编辑 - ${frames.find((f) => f.id === editingFrameId)?.title ?? ''}`}
        open={keyframeModalVisible}
        onOk={handleSaveKeyframes}
        onCancel={() => {
          setKeyframeModalVisible(false);
          setEditingFrameId(null);
        }}
        width={800}
        okText="保存关键帧"
        cancelText="取消"
      >
        <KeyframeEditorContent
          keyframes={keyframes}
          frameDuration={composition.masterSettings.frameDuration}
          onDeleteKeyframe={handleDeleteKeyframe}
        />
      </Modal>

      {/* 全局设置模态框 */}
      <Modal
        title="全局合成设置"
        open={globalModalVisible}
        onCancel={() => setGlobalModalVisible(false)}
        width={600}
        footer={null}
      >
        <GlobalSettingsForm
          initialValues={{
            frameDuration: composition.masterSettings.frameDuration,
            defaultTransition: composition.masterSettings.defaultTransition,
            transitions: composition.transitions,
          }}
          onSave={handleSaveGlobalSettings}
        />
      </Modal>

      {/* 效果预览模态框 */}
      <Modal
        title="转场效果预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={800}
      >
        <div className={styles.transitionPreview}>
          <div className="preview-slide">
            <Space direction="vertical">
              <span>帧 A</span>
              <Text type="secondary">转场效果演示</Text>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CompositionStudio;
export type { CompositionStudioProps };
