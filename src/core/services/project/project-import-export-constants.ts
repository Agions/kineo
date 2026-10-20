/**
 * Project import/export constants — extracted
 */

export const CURRENT_VERSION = '1.0.0';
export const MIN_SUPPORTED_VERSION = '1.0.0';

/** 备份索引存储键 */
export const BACKUP_INDEX_KEY = 'kineo_backups';

/** 单条备份内容存储键前缀 */
export const BACKUP_ITEM_PREFIX = 'kineo_backup_';

/** 备份最大保留数量 */
export const MAX_BACKUPS = 10;

/** 验证项目数据时的必需字段 */
export const REQUIRED_PROJECT_FIELDS = ['id', 'name', 'status'] as const;

/** 验证项目数据时的数组字段 */
export const ARRAY_PROJECT_FIELDS = ['videos', 'scripts'] as const;

/** 解析失败的统一错误 */
export const INVALID_FORMAT_ERROR = '无效的项目文件格式';
