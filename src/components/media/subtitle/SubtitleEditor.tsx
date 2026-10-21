/**
 * 字幕编辑器组件 - Presenter 层
 * 提供字幕文本编辑、样式配置、预览等功能
 */
import { AlignLeft, AlignCenter, AlignRight, Copy, Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { formatTime } from '@/common/utils';

import { useSubtitleEditor } from './hooks/useSubtitleEditor';
import styles from './SubtitleEditor.module.less';
import type { SubtitleItem } from './types/subtitle-entities';
import {
  ALIGNMENT_OPTIONS,
  FONT_FAMILY_OPTIONS,
  POSITION_OPTIONS,
} from './types/subtitle-entities';

// ColorPicker - uses HTML color input
interface ColorPickerProps {
  value?: string;
  onChange?: (color: { toHexString: () => string }) => void;
  disabled?: boolean;
}

function ColorPicker({ value = '#ffffff', onChange, disabled }: ColorPickerProps) {
  return (
    <input
      type="color"
      value={value}
      disabled={disabled}
      onChange={(e) => {
        if (onChange) {
          onChange({
            toHexString: () => e.target.value,
          });
        }
      }}
      className="h-9 w-14 rounded border border-input cursor-pointer"
    />
  );
}

interface SubtitleEditorProps {
  subtitles: SubtitleItem[];
  onChange: (subtitles: SubtitleItem[]) => void;
  currentTime?: number;
  videoWidth?: number;
  videoHeight?: number;
  showPreview?: boolean;
  readonly?: boolean;
  className?: string;
}

export function SubtitleEditor({
  subtitles,
  onChange,
  currentTime = 0,
  videoWidth = 1920,
  videoHeight = 1080,
  showPreview = true,
  readonly = false,
  className,
}: SubtitleEditorProps) {
  const {
    selectedId,
    editingText,
    setEditingText,
    previewStyle,
    selectedSubtitle,
    activeSubtitle,
    updateSubtitle,
    updateStyle,
    addSubtitle,
    deleteSubtitle,
    duplicateSubtitle,
    selectSubtitle,
  } = useSubtitleEditor({ subtitles, onChange, currentTime, videoWidth, videoHeight });

  // 预览字幕渲染
  const renderPreview = () => {
    const active = activeSubtitle || selectedSubtitle;
    if (!active) return null;

    const style = active.style || previewStyle;
    const positionY =
      style.position === 'top' ? '10%' : style.position === 'middle' ? '50%' : '90%';

    return (
      <div
        className={styles.previewSubtitle}
        style={{
          fontFamily: style.fontFamily,
          fontSize: `${style.fontSize}px`,
          color: style.color,
          backgroundColor: style.backgroundColor,
          textAlign: style.alignment,
          top: positionY,
          WebkitTextStroke: style.outline ? `1px ${style.outlineColor}` : undefined,
          textShadow: style.outline
            ? `-1px -1px 0 ${style.outlineColor},1px -1px 0 ${style.outlineColor},-1px 1px 0 ${style.outlineColor},1px 1px 0 ${style.outlineColor}`
            : undefined,
        }}
      >
        {editingText || active.text}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className={`${styles.container} ${className || ''}`}>
        {/* 预览区域 */}
        {showPreview && (
          <div className={styles.previewArea}>
            <div
              className={styles.preview}
              style={{
                width: videoWidth,
                height: videoHeight,
                maxWidth: '100%',
                maxHeight: 300,
              }}
            >
              <div className={styles.previewBg}>
                <Text type="secondary">视频预览区域</Text>
              </div>
              {renderPreview()}
            </div>
          </div>
        )}

        <div className={styles.editorArea}>
          {/* 字幕列表 */}
          <Card className={styles.subtitleList}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Text strong>字幕列表</Text>
                  <Badge variant="info">{subtitles.length}</Badge>
                </div>
                {!readonly && (
                  <Button size="sm" variant="default" onClick={addSubtitle}>
                    <Plus /> 添加字幕
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {subtitles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无字幕，点击添加</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {subtitles.map((subtitle) => (
                    <div
                      key={subtitle.id}
                      className={`${styles.subtitleItem} flex items-center justify-between px-3 py-2 rounded-md cursor-pointer border transition-colors ${
                        selectedId === subtitle.id
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent hover:bg-muted/50'
                      } ${
                        currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
                          ? 'bg-primary/10'
                          : ''
                      }`}
                      onClick={() => selectSubtitle(subtitle)}
                    >
                      <div className={styles.subtitleInfo}>
                        <Badge variant="outline">{formatTime(subtitle.startTime, { ms: 2 })}</Badge>
                        <span className={styles.subtitleText}>{subtitle.text}</span>
                        <Badge variant="outline">{formatTime(subtitle.endTime, { ms: 2 })}</Badge>
                      </div>
                      {!readonly && (
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateSubtitle(subtitle);
                                }}
                              >
                                <Copy />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>复制</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSubtitle(subtitle.id);
                                }}
                              >
                                <Trash2 />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>删除</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 字幕编辑 */}
          {selectedSubtitle && (
            <Card className={styles.subtitleEditor}>
              <CardHeader>
                <CardTitle>字幕编辑</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* 时间设置 */}
                <div className={styles.timeRow}>
                  <Text type="secondary">时间:</Text>
                  <Input
                    type="number"
                    value={selectedSubtitle.startTime}
                    onChange={(e) =>
                      updateSubtitle(selectedSubtitle.id, { startTime: Number(e.target.value) })
                    }
                    style={{ width: 80 }}
                    step={0.1}
                    min={0}
                    disabled={readonly}
                  />
                  <Text> - </Text>
                  <Input
                    type="number"
                    value={selectedSubtitle.endTime}
                    onChange={(e) =>
                      updateSubtitle(selectedSubtitle.id, { endTime: Number(e.target.value) })
                    }
                    style={{ width: 80 }}
                    step={0.1}
                    min={0}
                    disabled={readonly}
                  />
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    ({formatTime(selectedSubtitle.endTime - selectedSubtitle.startTime, { ms: 2 })})
                  </Text>
                </div>

                {/* 文本编辑 */}
                <div>
                  <Text type="secondary">文本内容:</Text>
                  <Textarea
                    value={editingText}
                    onChange={(e) => {
                      setEditingText(e.target.value);
                      updateSubtitle(selectedSubtitle.id, { text: e.target.value });
                    }}
                    rows={2}
                    disabled={readonly}
                  />
                </div>

                {/* 样式设置 */}
                <div className={styles.styleSection}>
                  <Text type="secondary">样式:</Text>
                  <div className={styles.styleGrid}>
                    {/* 字体 */}
                    <div className={styles.styleItem}>
                      <Text type="secondary" className="text-xs">
                        字体
                      </Text>
                      <OptionsSelect
                        value={previewStyle.fontFamily}
                        onChange={(v) => updateStyle({ fontFamily: v })}
                        options={FONT_FAMILY_OPTIONS}
                        disabled={readonly}
                      />
                    </div>

                    {/* 字号 */}
                    <div className={styles.styleItem}>
                      <Text type="secondary" className="text-xs">
                        字号
                      </Text>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[previewStyle.fontSize]}
                          onValueChange={(v) =>
                            updateStyle({ fontSize: Array.isArray(v) ? v[0] : v })
                          }
                          min={12}
                          max={72}
                          step={2}
                          disabled={readonly}
                          className="w-24"
                        />
                        <span className="text-xs w-8">{previewStyle.fontSize}px</span>
                      </div>
                    </div>

                    {/* 颜色 */}
                    <div className={styles.styleItem}>
                      <Text type="secondary" className="text-xs">
                        颜色
                      </Text>
                      <ColorPicker
                        value={previewStyle.color}
                        onChange={(c) => updateStyle({ color: c.toHexString() })}
                        disabled={readonly}
                      />
                    </div>

                    {/* 描边颜色 */}
                    <div className={styles.styleItem}>
                      <Text type="secondary" className="text-xs">
                        描边
                      </Text>
                      <ColorPicker
                        value={previewStyle.outlineColor}
                        onChange={(c) => updateStyle({ outlineColor: c.toHexString() })}
                        disabled={readonly}
                      />
                    </div>

                    {/* 位置 */}
                    <div className={styles.styleItem}>
                      <Text type="secondary" className="text-xs">
                        位置
                      </Text>
                      <OptionsSelect
                        value={previewStyle.position}
                        onChange={(v) =>
                          updateStyle({ position: v as 'top' | 'middle' | 'bottom' })
                        }
                        options={POSITION_OPTIONS}
                        disabled={readonly}
                      />
                    </div>

                    {/* 对齐 */}
                    <div className={styles.styleItem}>
                      <Text type="secondary" className="text-xs">
                        对齐
                      </Text>
                      <div className="flex gap-1">
                        {ALIGNMENT_OPTIONS.map((opt, i) => {
                          const Icon = [AlignLeft, AlignCenter, AlignRight][i];
                          return (
                            <Button
                              key={opt.value}
                              size="sm"
                              variant={previewStyle.alignment === opt.value ? 'default' : 'outline'}
                              onClick={() =>
                                updateStyle({ alignment: opt.value as 'left' | 'center' | 'right' })
                              }
                              disabled={readonly}
                              className="px-2"
                            >
                              <Icon size={14} />
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * 通用 OptionsSelect 组件 — 渲染 {value, label}[] 选项的 Select。
 * 内部 helper — 消除 SubtitleEditor 内 fontFamily 与 position 两个 Select 的 12L 模板重复。
 */
function OptionsSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Re-export types for backward compatibility
export type { SubtitleItem, SubtitleStyle, SubtitleEditorProps } from './types/subtitle-entities';
