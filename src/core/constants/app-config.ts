/**
 * 应用级配置常量
 */

/** 存储键名 */
export const STORAGE_KEYS = {
  PROJECTS: 'kineo_projects',
  STORYBOARDS: 'kineo-storyboards',
  COMPOSITIONS: 'kineo-compositions',
  ASSETS: 'panelcraft_assets',
  CHARACTERS: 'man ga-characters',
  BACKUPS: 'kineo_backups',
  REVIEW_EXPORT_ACTIVITIES: 'kineo_review_export_activities',
  TOKEN: 'reelforge_token',
} as const;

/** 路由路径 */
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:id',
  PROJECT_EDIT: '/projects/:id/edit',
  EDITOR: '/editor',
  SETTINGS: '/settings',
  VIDEO_STUDIO: '/video-studio',
} as const;

/** 事件名称 */
export const EVENTS = {
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
  SCRIPT_GENERATED: 'script:generated',
  VIDEO_UPLOADED: 'video:uploaded',
  EXPORT_STARTED: 'export:started',
  EXPORT_COMPLETED: 'export:completed',
  EXPORT_FAILED: 'export:failed',
} as const;

/** 错误码 */
export const ERROR_CODES = {
  UNKNOWN: 'E0000',
  NETWORK_ERROR: 'E0001',
  API_ERROR: 'E0002',
  VALIDATION_ERROR: 'E0003',
  NOT_FOUND: 'E0004',
  UNAUTHORIZED: 'E0005',
  FILE_TOO_LARGE: 'E0006',
  UNSUPPORTED_FORMAT: 'E0007',
  PROCESSING_ERROR: 'E0008',
} as const;

/** 默认配置 */
export const DEFAULTS = {
  AUTO_SAVE_INTERVAL: 30,
  MAX_FILE_SIZE: 2 * 1024 * 1024 * 1024,
  MAX_PROJECTS: 100,
  MAX_RECENT_FILES: 20,
  DEFAULT_VIDEO_QUALITY: 'high',
  DEFAULT_OUTPUT_FORMAT: 'mp4',
  DEFAULT_LANGUAGE: 'zh',
  DEFAULT_SCRIPT_LENGTH: 'medium',
  DEFAULT_STYLE: 'professional',
  DEFAULT_ASPECT_RATIO: '16:9',
  DEFAULT_RESOLUTION: '1080p',
} as const;

/** 文件类型映射 */
export const FILE_TYPE_MAP: Record<string, string> = {
  mp4: 'video',
  mov: 'video',
  avi: 'video',
  mkv: 'video',
  webm: 'video',
  flv: 'video',
  wmv: 'video',
  mp3: 'audio',
  wav: 'audio',
  flac: 'audio',
  aac: 'audio',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  pdf: 'document',
  doc: 'document',
  docx: 'document',
  txt: 'text',
  json: 'code',
  js: 'code',
  ts: 'code',
  srt: 'subtitle',
  vtt: 'subtitle',
  ass: 'subtitle',
} as const;

/** 动画配置 */
export const ANIMATION_CONFIG = {
  duration: { fast: 0.2, normal: 0.3, slow: 0.5 },
  easing: {
    default: [0.4, 0, 0.2, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
    smooth: [0.25, 0.1, 0.25, 1],
  },
} as const;
