import { Download, Video, Settings, CheckCircle } from 'lucide-react';
import { useState, useCallback } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/toast';
import {
  EXPORT_FORMATS,
  RESOLUTIONS,
  FRAME_RATES,
  RESOLUTION_VALUES,
  QUALITY_PRESETS,
  type ExportFormat,
  type Resolution,
  type FrameRate,
  type QualityPreset,
} from '@/common/constants/media-presets';
import type { ExportSettings as _ExportSettings } from '@/common/types/composition';
import { logger } from '@/core/utils/logger';

export type { ExportFormat, Resolution, FrameRate, QualityPreset };

// 格式标签映射
const FORMAT_LABELS: Record<ExportFormat, string> = {
  MP4: 'MP4',
  MOV: 'MOV',
  WebM: 'WebM',
};

// 格式描述映射
const FORMAT_DESCRIPTIONS: Record<ExportFormat, string> = {
  MP4: '通用格式，兼容性最好',
  MOV: 'Apple 设备推荐',
  WebM: 'Web 优化，体积更小',
};

interface VideoExporterProps {
  projectId?: string;
  projectName?: string;
  estimatedDuration?: number;
  onExport?: (settings: ExportSettings) => Promise<void>;
  onCancel?: () => void;
  initialSettings?: Partial<ExportSettings>;
}

/**
 * Canonical ExportSettings — re-exported from @/common/types/composition.
 * Local strict-typed aliases (ExportFormat/Resolution/FrameRate) still apply.
 */

export type ExportSettings = _ExportSettings;

function VideoExporter({
  projectId: _projectId,
  projectName = '未命名项目',
  estimatedDuration = 0,
  onExport,
  onCancel,
  initialSettings,
}: VideoExporterProps) {
  const [format, setFormat] = useState<ExportFormat>(
    (initialSettings?.format as ExportFormat) || 'MP4'
  );
  const [resolution, setResolution] = useState<Resolution>(
    (initialSettings?.resolution as Resolution) || '1080p'
  );
  const [frameRate, setFrameRate] = useState<FrameRate>(
    (initialSettings?.frameRate as FrameRate) || 30
  );
  const [quality, setQuality] = useState<string>('high');
  const [filename, setFilename] = useState(
    `${projectName}_${new Date().toISOString().slice(0, 10)}`
  );
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [exportComplete, setExportComplete] = useState(false);
  const [exportedFilePath, setExportedFilePath] = useState('');

  const estimatedFileSize = useCallback(() => {
    const preset = QUALITY_PRESETS[quality];
    if (!preset) return '0';
    const bitrateMbps = parseFloat(preset.bitrate);
    const durationMinutes = estimatedDuration / 60;
    const sizeMB = (bitrateMbps * durationMinutes * 60) / 8;
    return sizeMB.toFixed(1);
  }, [quality, estimatedDuration]);

  const handleExport = async () => {
    if (!onExport) return;

    setExporting(true);
    setExportProgress(0);
    setExportStatus('准备导出...');
    setExportComplete(false);

    try {
      const settings: ExportSettings = {
        format,
        resolution,
        frameRate,
        quality,
        filename: `${filename}.${format.toLowerCase()}`,
      };

      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      await onExport(settings);

      clearInterval(progressInterval);
      setExportProgress(100);
      setExportStatus('导出完成！');
      setExportComplete(true);
      setExportedFilePath(settings.filename);
      toast.success('视频导出成功');
    } catch (error) {
      logger.error('导出失败:', error);
      setExportStatus('导出失败');
      toast.error('视频导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          导出设置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 格式选择 */}
        <div className="space-y-3">
          <Label>格式</Label>
          <RadioGroup
            value={format}
            onChange={(v) => setFormat(v as ExportFormat)}
            className="flex gap-4"
          >
            {EXPORT_FORMATS.map((fmt) => (
              <div key={fmt} className="flex items-center space-x-2">
                <RadioGroupItem value={fmt} id={`format-${fmt}`} />
                <Label htmlFor={`format-${fmt}`} className="cursor-pointer">
                  <span className="font-medium">{FORMAT_LABELS[fmt]}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {FORMAT_DESCRIPTIONS[fmt]}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* 分辨率选择 */}
        <div className="space-y-3">
          <Label>分辨率</Label>
          <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTIONS.map((res) => (
                <SelectItem key={res} value={res}>
                  {res} ({RESOLUTION_VALUES[res].width}x{RESOLUTION_VALUES[res].height})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 帧率选择 */}
        <div className="space-y-3">
          <Label>帧率</Label>
          <Select
            value={frameRate.toString()}
            onValueChange={(v) => setFrameRate(Number(v) as FrameRate)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FRAME_RATES.map((fps) => (
                <SelectItem key={fps} value={fps.toString()}>
                  {fps} fps
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 质量选择 */}
        <div className="space-y-3">
          <Label>质量</Label>
          <RadioGroup value={quality} onChange={setQuality} className="flex gap-4">
            {Object.entries(QUALITY_PRESETS).map(([key, preset]) => (
              <div key={key} className="flex items-center space-x-2">
                <RadioGroupItem value={key} id={`quality-${key}`} />
                <Label htmlFor={`quality-${key}`} className="cursor-pointer">
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {preset.description} - {preset.bitrate}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* 文件名 */}
        <div className="space-y-3">
          <Label>文件名</Label>
          <div className="flex gap-2 items-center">
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="输入文件名"
              className="flex-1"
            />
            <span className="text-muted-foreground">.{format.toLowerCase()}</span>
          </div>
        </div>

        {/* 预计信息 */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>预计时长：{Math.ceil(estimatedDuration)}秒</span>
          <span>预计大小：{estimatedFileSize()} MB</span>
        </div>

        {/* 导出进度 */}
        {exporting && (
          <div className="space-y-2">
            <Progress value={exportProgress} />
            <p className="text-sm text-muted-foreground">{exportStatus}</p>
          </div>
        )}

        {/* 导出完成 */}
        {exportComplete && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>导出完成！文件已保存为: {exportedFilePath}</AlertDescription>
          </Alert>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={exporting}>
              取消
            </Button>
          )}
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Settings className="h-4 w-4 mr-2 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                开始导出
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default VideoExporter;
