/**
 * VideoEditorPage — 视频剪辑编辑器页面
 */
import { useParams } from 'react-router-dom';

import { Tabs, TabPane } from '@/components/ui/tabs';

import { useVideoEditor } from './hooks/useVideoEditor';
import { renderVideoPlayer, renderTimeline } from './VideoEditorPage.player';
import { renderSegmentList, renderKeyframeList } from './VideoEditorPage.segments';
import { renderToolbar, ExportProgressModal, renderSettingsPanel } from './VideoEditorPage.toolbar';

const VideoEditor = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const state = useVideoEditor(projectId);

  const {
    videoSrc,
    currentTime,
    duration,
    segments,
    keyframes,
    selectedSegmentIndex,
    isExporting,
    exportProgress,
    exportStatus,
    outputFormat,
    videoQuality,
    videoRef,
    handleTimeUpdate,
    handleVideoLoaded,
    setOutputFormat,
    setVideoQuality,
    togglePlayPause,
  } = state;

  return (
    <div className="space-y-4 p-4 md:p-6 bg-[var(--background)] text-[var(--foreground)] min-h-screen">
      <ExportProgressModal
        isExporting={isExporting}
        exportProgress={exportProgress}
        exportStatus={exportStatus}
        outputFormat={outputFormat}
        videoQuality={videoQuality}
      />

      {renderToolbar(state)}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 视频预览区 & 时间轴 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] backdrop-blur-2xl shadow-xl">
            <h3 className="text-base font-bold text-[var(--foreground)] mb-3">
              Kineo 4K 视听视频播放器
            </h3>
            {renderVideoPlayer(
              videoSrc,
              videoRef,
              handleTimeUpdate,
              handleVideoLoaded,
              togglePlayPause,
              state
            )}
          </div>

          <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] backdrop-blur-2xl shadow-xl">
            {renderTimeline(
              segments,
              selectedSegmentIndex,
              currentTime,
              duration,
              state.handleSelectSegment
            )}
          </div>
        </div>

        {/* 右侧工具面板 */}
        <div className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] backdrop-blur-2xl shadow-xl">
          <Tabs defaultActiveKey="trim">
            <TabPane tab="视频片段" key="trim">
              {renderSegmentList(state)}
            </TabPane>

            <TabPane tab="运镜关键帧" key="keyframes">
              <div className="space-y-3 py-2">
                <h4 className="font-bold text-sm text-[var(--foreground)]">关键帧列表</h4>
                {renderKeyframeList(keyframes)}
              </div>
            </TabPane>

            <TabPane tab="导出与参数" key="settings">
              {renderSettingsPanel(
                outputFormat,
                videoQuality,
                setVideoQuality,
                setOutputFormat
              )}
            </TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
