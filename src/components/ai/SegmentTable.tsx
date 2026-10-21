/**
 * SegmentTable — 脚本片段表格 + 行操作
 *
 * 纯展示组件：接收 segments 和行级回调，渲染表格和添加按钮。
 */

import { Edit3, Trash2, Play, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { VideoSegment } from '@/common/types/script';
import { formatDurationShort } from '@/common/utils';
import styles from '@/features/storyboard/components/ScriptEditor.module.less';
import { theme } from '@/styles/theme';

const SEGMENT_TYPE_LABELS: Record<string, string> = {
  narration: '旁白',
  dialogue: '对白',
  action: '动作',
  transition: '转场',
};

export interface SegmentTableProps {
  segments: VideoSegment[];
  onAdd: () => void;
  onEdit: (index: number) => void;
  onPreview: (index: number) => void;
  onDelete: (index: number) => void;
}

export function SegmentTable({ segments, onAdd, onEdit, onPreview, onDelete }: SegmentTableProps) {
  return (
    <div className={styles.tableContainer}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${theme.borders.light}` }}>
            <th style={{ padding: '8px', textAlign: 'left', width: 180 }}>时间</th>
            <th style={{ padding: '8px', textAlign: 'left', width: 80 }}>时长</th>
            <th style={{ padding: '8px', textAlign: 'left', width: 100 }}>类型</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>内容</th>
            <th style={{ padding: '8px', textAlign: 'left', width: 180 }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((record, index) => (
            <tr
              key={record.id || index}
              style={{ borderBottom: `1px solid ${theme.borders.light}` }}
            >
              <td style={{ padding: '8px' }}>
                {formatDurationShort(record.start)} - {formatDurationShort(record.end)}
              </td>
              <td style={{ padding: '8px' }}>{formatDurationShort(record.end - record.start)}</td>
              <td style={{ padding: '8px' }}>{SEGMENT_TYPE_LABELS[record.type] || record.type}</td>
              <td style={{ padding: '8px' }}>
                <div className={styles.contentCell}>
                  {record.content || <span className={styles.emptyContent}>（无内容）</span>}
                </div>
              </td>
              <td style={{ padding: '8px' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="ghost" size="small" onClick={() => onEdit(index)}>
                    <Edit3 size={14} />
                  </Button>
                  <Button variant="ghost" size="small" onClick={() => onPreview(index)}>
                    <Play size={14} />
                  </Button>
                  <Button variant="ghost" size="small" onClick={() => onDelete(index)}>
                    <Trash2 size={14} color={theme.colors.error} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        variant="outline"
        icon={<Plus size={16} />}
        style={{ width: '100%', marginTop: 16, borderStyle: 'dashed' }}
        onClick={onAdd}
      >
        添加片段
      </Button>
    </div>
  );
}
