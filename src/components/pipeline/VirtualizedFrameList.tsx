import { Trash2 } from 'lucide-react';
import { memo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { StoryboardFrame } from '@/common/types/storyboard';

import styles from './StoryboardEditor.module.less';

interface FrameItemProps {
  index: number;
  frame: StoryboardFrame;
  selectedFrameId: string | null;
  onFrameSelect: (id: string) => void;
  onFrameRemove: (id: string) => void;
}

interface VirtualizedFrameListProps {
  frames: StoryboardFrame[];
  selectedFrameId: string | null;
  onFrameSelect: (id: string) => void;
  onFrameRemove: (id: string) => void;
}

const FrameItem = memo(function FrameItem({
  index,
  frame,
  selectedFrameId,
  onFrameSelect,
  onFrameRemove,
}: FrameItemProps) {
  const isSelected = frame.id === selectedFrameId;

  return (
    <Card
      key={frame.id}
      className={`${styles.frameItem} ${isSelected ? styles.selected : ''}`}
      onClick={() => onFrameSelect(frame.id)}
      size="small"
      style={{ marginBottom: 8 }}
    >
      <div className={styles.frameItemContent}>
        <div className={styles.frameNumber}>{index + 1}</div>
        <div className={styles.frameInfo}>
          <div className={styles.frameTitle}>{frame.title}</div>
          <div className={styles.frameDuration}>
            {frame.duration}秒 | {frame.cameraType}
          </div>
        </div>
        <div className={styles.frameActions}>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onFrameRemove(frame.id);
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </Card>
  );
});

// 帧列表中的固定高度项目尺寸
const FRAME_ITEM_HEIGHT = 72;

export function VirtualizedFrameList({
  frames,
  selectedFrameId,
  onFrameSelect,
  onFrameRemove,
}: VirtualizedFrameListProps) {
  const itemContent = useCallback(
    (index: number) => (
      <FrameItem
        index={index}
        frame={frames[index]}
        selectedFrameId={selectedFrameId}
        onFrameSelect={onFrameSelect}
        onFrameRemove={onFrameRemove}
      />
    ),
    [frames, selectedFrameId, onFrameSelect, onFrameRemove]
  );

  // 渲染空状态
  if (frames.length === 0) {
    return (
      <div className={styles.emptyList}>
        <span style={{ fontSize: 48 }}>📷</span>
        <div className={styles.emptyText}>暂无分镜，点击下方按钮添加</div>
      </div>
    );
  }

  return (
    <Virtuoso
      style={{ height: '100%' }}
      totalCount={frames.length}
      itemContent={itemContent}
      overscan={5}
      fixedItemHeight={FRAME_ITEM_HEIGHT}
    />
  );
}

export default VirtualizedFrameList;
