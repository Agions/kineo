/**
 * ExportMenu — 脚本导出下拉菜单
 *
 * 内联绝对定位下拉，接收 onExport(format) 回调。
 */

import { Download, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { theme } from '@/styles/theme';

const EXPORT_OPTIONS = [
  { format: 'txt', label: '文本文件 (.txt)' },
  { format: 'srt', label: '字幕文件 (.srt)' },
  { format: 'doc', label: 'Word文档 (.docx)' },
] as const;

export interface ExportMenuProps {
  visible: boolean;
  onToggle: () => void;
  onExport: (format: string) => void;
}

export function ExportMenu({ visible, onToggle, onExport }: ExportMenuProps) {
  return (
    <div style={{ position: 'relative' }}>
      <Button variant="outline" icon={<Download size={16} />} onClick={onToggle}>
        导出 <ChevronDown size={14} />
      </Button>
      {visible && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: 'white',
            border: `1px solid ${theme.borders.medium}`,
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 100,
            minWidth: 120,
          }}
        >
          {EXPORT_OPTIONS.map(({ format, label }) => (
            <div
              key={format}
              style={{ padding: '8px 12px', cursor: 'pointer' }}
              onClick={() => onExport(format)}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.background = theme.colors.gray[50])
              }
              onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
