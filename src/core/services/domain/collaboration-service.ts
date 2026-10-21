/**
 * 协同服务（D3）：分镜评论、版本快照、回滚
 *
 * 支持多内容类型版本控制：
 *   - storyboard: 分镜帧
 *   - script: 剧本内容
 *   - character: 角色设计
 *   - asset: 素材库资源
 */

import type { FrameComment, StoryboardVersion, ScriptVersionPayload, CharacterVersionPayload } from '@/core/project/types/project';

/** @deprecated Use @/core/project/types/project. Re-exported for backward compat. */
export type { FrameComment, StoryboardVersion };

/** 内容类型 */
export type ContentType = 'storyboard' | 'script' | 'character' | 'asset';

/** 版本 payload 类型映射 */
export interface VersionPayloadMap {
  storyboard: unknown;
  script: ScriptVersionPayload;
  character: CharacterVersionPayload;
  asset: unknown;
}

export interface VersionDiffSummary {
  leftVersionId: string;
  rightVersionId: string;
  changedKeys: string[];
  changeCount: number;
}

class CollaborationService {
  private comments: FrameComment[] = [];
  private versions: StoryboardVersion[] = [];

  addComment(input: Omit<FrameComment, 'id' | 'createdAt'>): FrameComment {
    const comment: FrameComment = {
      ...input,
      id: `comment_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.comments.push(comment);
    return comment;
  }

  listComments(projectId: string, frameId?: string): FrameComment[] {
    return this.comments
      .filter((item) => item.projectId === projectId && (!frameId || item.frameId === frameId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** 保存版本快照（默认 content type = 'storyboard'） */
  saveVersion(input: Omit<StoryboardVersion, 'id' | 'createdAt'>): StoryboardVersion {
    return this.saveVersionByType(input, 'storyboard');
  }

  /**
   * 按内容类型保存版本快照
   * @param input 版本数据
   * @param contentType 内容类型
   */
  saveVersionByType(
    input: Omit<StoryboardVersion, 'id' | 'createdAt' | 'contentType'>,
    contentType: ContentType
  ): StoryboardVersion {
    const version: StoryboardVersion = {
      ...input,
      contentType,
      id: `version_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.versions.push(version);
    return version;
  }

  /** 列出项目所有版本 */
  listVersions(projectId: string): StoryboardVersion[] {
    return this.versions
      .filter((item) => item.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * 按内容类型列出版本
   * @param projectId 项目 ID
   * @param contentType 内容类型，默认 'storyboard'
   */
  listVersionsByType(projectId: string, contentType: ContentType = 'storyboard'): StoryboardVersion[] {
    return this.versions
      .filter((item) => item.projectId === projectId && (item.contentType ?? 'storyboard') === contentType)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getVersion(versionId: string): StoryboardVersion | undefined {
    return this.versions.find((item) => item.id === versionId);
  }

  diffVersions(leftVersionId: string, rightVersionId: string): VersionDiffSummary {
    const left = this.getVersion(leftVersionId);
    const right = this.getVersion(rightVersionId);
    if (!left || !right) {
      return {
        leftVersionId,
        rightVersionId,
        changedKeys: [],
        changeCount: 0,
      };
    }

    const leftStr = JSON.stringify(left.payload ?? {});
    const rightStr = JSON.stringify(right.payload ?? {});

    const changedKeys = new Set<string>();

    try {
      const leftObj = JSON.parse(leftStr);
      const rightObj = JSON.parse(rightStr);
      collectDiffKeys(leftObj, rightObj, '', changedKeys);
    } catch {
      if (leftStr !== rightStr) changedKeys.add('root');
    }

    return {
      leftVersionId,
      rightVersionId,
      changedKeys: [...changedKeys],
      changeCount: changedKeys.size,
    };
  }

  rollback(projectId: string, versionId: string): unknown | null {
    const version = this.versions.find(
      (item) => item.projectId === projectId && item.id === versionId
    );
    return version ? version.payload : null;
  }

  hydrate(
    projectId: string,
    comments: FrameComment[] = [],
    versions: StoryboardVersion[] = []
  ): void {
    this.comments = [
      ...this.comments.filter((item) => item.projectId !== projectId),
      ...comments.filter((item) => item.projectId === projectId),
    ];
    this.versions = [
      ...this.versions.filter((item) => item.projectId !== projectId),
      ...versions.filter((item) => item.projectId === projectId),
    ];
  }
}

function collectDiffKeys(a: unknown, b: unknown, prefix: string, target: Set<string>): void {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      target.add(prefix || 'frames');
    }
    return;
  }

  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      target.add(prefix || 'value');
    }
    return;
  }

  const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)]);
  keys.forEach((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const av = (a as Record<string, unknown>)[key];
    const bv = (b as Record<string, unknown>)[key];

    if (typeof av === 'object' && av !== null && typeof bv === 'object' && bv !== null) {
      collectDiffKeys(av, bv, path, target);
      return;
    }

    if (JSON.stringify(av) !== JSON.stringify(bv)) {
      target.add(path);
    }
  });
}

export const collaborationService = new CollaborationService();
export default CollaborationService;
