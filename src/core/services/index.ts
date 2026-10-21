/**
 * Services 统一导出（按领域重组后）
 *
 * 本文件保留所有原有 export 路径以维持向后兼容（72 个外部调用方已稳定）。
 * 服务按 §1.3 领域驱动原则归类到子目录：
 *   - ai/text/     AI 文本/脚本/小说分析
 *   - ai/image/    AI 图像/视频生成
 *   - video/       视频元数据/合成/字幕/ffmpeg-wasm
 *   - audio/       TTS / 唇同步 / 音频流水线
 *   - pipeline/    流水线引擎 / 质量门 / 评审导出
 *   - project/     项目导入导出 / 成本 / 评估 / 渲染队列
 *   - domain/      角色 / 漫画 / 协作 / 组合
 *   - (root)       平台桥接：desktop-app、tauri、storyboard
 */

// 图像/视频生成服务
export { imageGenerationService } from './ai/image/image-generation-service';
export type {
  ImageGenerationOptions,
  ImageGenerationResult,
  VideoGenerationOptions,
  VideoGenerationResult,
  ImageModel,
} from './ai/image/image-generation-service';

// 唇同步服务
export { lipSyncService } from './audio/lip-sync-service';
export type {
  LipSyncOptions,
  LipSyncResult,
  TalkingFaceOptions,
  TalkingFaceResult,
} from './audio/lip-sync-service';

// 视频合成服务
export { videoCompositorService } from './video/video-compositor-service';
export type {
  CompositionScene,
  BackgroundMusic,
  CompositionOptions,
  CompositionResult,
} from './video/ffmpeg-wasm-service';

// FFmpeg.wasm 服务
export { ffmpegWasmService, loadFFmpeg, isFFmpegWasmAvailable } from './video/ffmpeg-wasm-service';

// 视频脚本流水线服务
export { mangaPipelineService } from './domain/manga-pipeline-service';
export type { PipelineScene, PipelineProgress } from './domain/manga-pipeline-service';

// 核心服务
export { aiService, type AIResponse, type AIRequestConfig } from './ai/text/ai-service';
export { novelService } from './ai/text/novel-service';
export { novelAnalyzer } from './ai/text/novel-analyze-service';
export { scriptImportService } from './ai/text/script-import-service';
export { storyAnalysisService } from './ai/text/story-analysis-service';
export {
  getStoryboardService,
  resetStoryboardService,
  type StoryboardServiceOptions,
} from './storyboard-service';
export { renderQueueService } from './project/render-queue-service';
export { audioPipelineService } from './audio/audio-pipeline-service';
export { evaluationService } from './project/evaluation-service';
export { qualityGateService } from './pipeline/quality-gate-service';
export { collaborationService } from './domain/collaboration-service';
export { reviewExportService } from './pipeline/review-export-service';
export { secureStorage } from './project/secure-storage-service';
export { costService } from './project/cost-service';
export { ttsService, DEFAULT_TTS_CONFIG, TTS_VOICES } from './audio/tts-service';
export {
  videoAnalysisService,
  DEFAULT_ANALYSIS_CONFIG,
  SCENE_TYPES,
} from './video/video-analysis-service';
export type { VideoAnalysisConfig, SceneType } from './video/video-analysis-service';
export {
  subtitleService,
  DEFAULT_SUBTITLE_STYLE,
  ASS_STYLE_PRESETS,
} from './video/subtitle-service';
export type {
  SubtitleStyle,
  SubtitleItem,
  SubtitleTrack,
  SubtitleFormat,
} from './video/subtitle-service';
export { projectImportExportService } from './project/project-import-export-service';
export type {
  ExportFormat,
  ProjectExportData,
  ImportOptions,
  ExportOptions,
} from './project/project-import-export-service';
export { desktopAppService } from './desktop-app-service';
export type {
  ShortcutDefinition,
  TrayMenuItem,
  NotificationOptions,
  WindowState,
} from './desktop-app-service';

// Tauri 服务
export { tauriService } from '@/infrastructure/tauri-bridge/commands';
export type {
  OpenFileOptions,
  SaveFileOptions,
  VideoClipOptions,
  PreviewOptions,
  ExportProgress,
  DirInfo,
} from '@/infrastructure/tauri-bridge/commands';

// ========== 简化线性流程引擎 ==========
export {
  PipelineService,
  getPipelineService,
  createDefaultPipeline,
  createImportStep,
  createAnalysisStep,
  createScriptStep,
  createStoryboardStep,
  createCharacterStep,
  createRenderStep,
  createExportStep,
  PIPELINE_STEP_IDS,
} from './pipeline/pipeline-service';
export type {
  PipelineStep,
  PipelineContext,
  PipelineResult,
  PipelineStepResult,
  PipelineConfig,
  PipelineStatus,
  PipelineStepId,
} from './pipeline/pipeline-service';
export type {
  CostRecord,
  CostStats,
  CostBudget,
  BudgetStatus,
  CostAlert,
} from './project/cost-service';
export type {
  BenchmarkSample,
  EvaluationCaseResult,
  EvaluationScores,
  EvaluationItemReport,
  EvaluationReport,
} from './project/evaluation-service';
export type {
  QualityGateIssueLevel,
  QualityGateIssue,
  QualityGateThresholds,
  QualityGateInput,
  QualityGateMetrics,
  QualityGateResult,
} from './pipeline/quality-gate-service';
export type {
  FrameComment,
  StoryboardVersion,
  VersionDiffSummary,
} from './domain/collaboration-service';
export type {
  ReviewExportInput,
  ReviewExportProjectMeta,
  ReviewExportActivity,
  ReviewExportSource,
  ReviewExportStatus,
  SaveReviewMarkdownOptions,
} from './pipeline/review-export-service';
export type {
  NovelChapter,
  ScriptScene,
  NovelScript,
  NovelParseResult,
  Storyboard,
} from './ai/text/novel-service';
export type {
  TTSProvider,
  TTSVoice,
  TTSConfig,
  TTSRequest,
  TTSResponse,
  TTSStreamChunk,
} from '@/core/types';
