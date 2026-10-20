/**
 * Single source of truth for storage keys used by the persistence layer.
 *
 * 集中定义项目用到的所有 localStorage / zustand-persist key；
 * 这样后续迁移、新增、废弃 key 都有统一出口，避免散落在多处导致拼写漂移。
 */
export const STORAGE_KEYS = {
  legacyProjects: 'STORAGE_KEYS.PROJECTS',
  legacyProjectsZustand: 'kineo-project-storage',
  projects: 'kineo:projects:v2',
  settings: 'kineo:settings:v2',
  app: 'kineo:app:v2',
  storyboard: 'kineo:storyboard:v2',
  migrationVersion: 'kineo:migration:version',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
