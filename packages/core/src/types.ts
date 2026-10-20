/**
 * Kineo Core Package - Domain Types & Core Engine Interfaces
 */

export type RoleType = 'writer' | 'storyboarder' | 'animator' | 'auditor';

export type WorkflowStage =
  | 'Draft'
  | 'ScriptPendingReview'
  | 'ScriptRejected'
  | 'Parse'
  | 'StoryboardPendingReview'
  | 'StoryboardRejected'
  | 'Board'
  | 'ProductionPendingReview'
  | 'ProductionRejected'
  | 'Audio'
  | 'Build'
  | 'Final';

export type AuditReviewStatus = 'approved' | 'rejected' | 'pending';

export interface AuditReviewRecord {
  id: string;
  stage: WorkflowStage;
  targetRole: RoleType;
  auditorName: string;
  status: AuditReviewStatus;
  comment: string;
  timestamp: number;
}

export interface Episode {
  id: string;
  title: string;
  order: number;
  scenes: Scene[];
}

export interface Scene {
  id: string;
  episodeId: string;
  order: number;
  title?: string;
  description?: string;
  shots: Shot[];
}

export interface Shot {
  id: string;
  sceneId: string;
  order: number;
  prompt: string;
  negativePrompt?: string;
  imageUrl?: string;
  audioUrl?: string;
  dialogue?: string;
  characterName?: string;
  durationSeconds: number;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  author?: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  stage: WorkflowStage;
  auditHistory?: AuditReviewRecord[];
}

export interface DramaProject {
  metadata: ProjectMetadata;
  episodes: Episode[];
}

export interface CharacterAsset {
  id: string;
  name: string;
  description?: string;
  gender?: 'male' | 'female' | 'unknown' | 'other';
  avatarUrl?: string;
  promptTags: string;
  loraModel?: string;
}

export interface ProjectConfig {
  defaultArtStyle: string;
  defaultResolution: string;
  defaultFps: number;
  autoSaveIntervalSecs: number;
}

export interface MangaProject {
  metadata: ProjectMetadata;
  characters: CharacterAsset[];
  episodes: Episode[];
  config: ProjectConfig;
}

export class WorkflowEngine {
  static getRoleName(role: RoleType): string {
    const map: Record<RoleType, string> = {
      writer: '编剧',
      storyboarder: '分镜师',
      animator: '制作师',
      auditor: '审核员/导演',
    };
    return map[role];
  }

  static getRoleStepIndices(role: RoleType): number[] {
    switch (role) {
      case 'writer':
        return [0, 1, 2]; // 导入、AI解析、剧本拆解
      case 'storyboarder':
        return [3, 4]; // 分镜绘制、角色一致性
      case 'animator':
        return [5, 6, 7, 8]; // 硬件渲染、合成、配音、导出
      case 'auditor':
        return [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 全环节质检审阅
      default:
        return [0, 1, 2, 3, 4, 5, 6, 7, 8];
    }
  }

  static getStageIndex(stage: WorkflowStage): number {
    const stages: WorkflowStage[] = [
      'Draft',
      'ScriptPendingReview',
      'ScriptRejected',
      'Parse',
      'StoryboardPendingReview',
      'StoryboardRejected',
      'Board',
      'ProductionPendingReview',
      'ProductionRejected',
      'Audio',
      'Build',
      'Final',
    ];
    return stages.indexOf(stage);
  }

  static getNextStage(current: WorkflowStage): WorkflowStage | null {
    switch (current) {
      case 'Draft':
        return 'ScriptPendingReview';
      case 'ScriptPendingReview':
        return 'Parse';
      case 'ScriptRejected':
        return 'ScriptPendingReview';
      case 'Parse':
        return 'StoryboardPendingReview';
      case 'StoryboardPendingReview':
        return 'Board';
      case 'StoryboardRejected':
        return 'StoryboardPendingReview';
      case 'Board':
        return 'ProductionPendingReview';
      case 'ProductionPendingReview':
        return 'Audio';
      case 'ProductionRejected':
        return 'ProductionPendingReview';
      case 'Audio':
        return 'Build';
      case 'Build':
        return 'Final';
      case 'Final':
        return null;
      default:
        return null;
    }
  }

  static getRejectStage(current: WorkflowStage): WorkflowStage | null {
    switch (current) {
      case 'ScriptPendingReview':
        return 'ScriptRejected';
      case 'StoryboardPendingReview':
        return 'StoryboardRejected';
      case 'ProductionPendingReview':
        return 'ProductionRejected';
      default:
        return null;
    }
  }

  static canTransition(from: WorkflowStage, to: WorkflowStage): boolean {
    return this.getStageIndex(to) >= 0;
  }

  static getStageLabel(stage: WorkflowStage): string {
    const labels: Record<WorkflowStage, string> = {
      Draft: '草稿/导入',
      ScriptPendingReview: '剧本待审核',
      ScriptRejected: '剧本已驳回',
      Parse: '剧本已通过',
      StoryboardPendingReview: '分镜待审核',
      StoryboardRejected: '分镜已驳回',
      Board: '分镜已通过',
      ProductionPendingReview: '制作待审核',
      ProductionRejected: '制作已驳回',
      Audio: '音频合成完成',
      Build: '硬件渲染中',
      Final: '完工导出',
    };
    return labels[stage] || stage;
  }

  static getStageProgress(stage: WorkflowStage): number {
    switch (stage) {
      case 'Draft':
        return 10;
      case 'ScriptPendingReview':
        return 20;
      case 'ScriptRejected':
        return 15;
      case 'Parse':
        return 30;
      case 'StoryboardPendingReview':
        return 45;
      case 'StoryboardRejected':
        return 40;
      case 'Board':
        return 60;
      case 'ProductionPendingReview':
        return 75;
      case 'ProductionRejected':
        return 70;
      case 'Audio':
        return 85;
      case 'Build':
        return 95;
      case 'Final':
        return 100;
      default:
        return 0;
    }
  }
}
