/**
 * 剧本生成服务
 * 负责将分析结果导出为剧本格式
 */

import type { AnalyzeResult } from '@/core/types';

/**
 * 剧本生成器
 * 负责将分析结果导出为剧本格式
 */
export class ScriptAnalyzer {
  /**
   * 导出为剧本格式
   */
  exportToScript(
    result: AnalyzeResult,
    _format: 'screenplay' | 'comic' | 'manga' = 'manga'
  ): string {
    const lines: string[] = [
      `# ${result.metadata.title}`,
      `作者：${result.metadata.author ?? '未知'}`,
      `字数：${result.metadata.wordCount}`,
      `角色数：${result.characters.length}`,
      '',
      '=== 角色列表 ===',
      '',
    ];

    for (const char of result.characters) {
      lines.push(
        `【${char.name}】`,
        `  角色类型：${char.role === 'main' ? '主角' : char.role === 'supporting' ? '配角' : '龙套'}`,
        `  描述：${char.description || char.personality || '无'}`,
        ''
      );
    }

    lines.push('', '=== 场景列表 ===', '');

    for (const scene of result.scenes) {
      lines.push(
        `【场景 ${scene.sceneNumber}】`,
        `  地点：${scene.location ?? '未指定'}`,
        `  时间：${scene.time ?? '未指定'}`,
        `  角色：${scene.characters.join('、')}`,
        ''
      );

      if (scene.narrator) {
        lines.push(`  旁白：${scene.narrator.slice(0, 100)}...`, '');
      }

      for (const dialogue of scene.dialogues) {
        lines.push(`  ${dialogue.character}：${dialogue.content}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * 导出为分镜格式
   */
  exportToStoryboard(result: AnalyzeResult): string {
    const lines: string[] = [
      `# ${result.metadata.title}`,
      `## 故事概要`,
      result.metadata.summary ?? '无',
      '',
      `## 角色设定`,
      '',
    ];

    for (const char of result.characters.filter((c) => c.role === 'main')) {
      lines.push(`### ${char.name}`, char.description || char.personality || '无', '');
    }

    lines.push('', '## 分镜脚本', '');

    for (const scene of result.scenes) {
      lines.push(
        `### 场景 ${scene.sceneNumber}`,
        `- 地点：${scene.location ?? '未指定'}`,
        `- 时间：${scene.time ?? '未指定'}`,
        `- 画面描述：${scene.content.slice(0, 100)}...`,
        `- 角色：${scene.characters.join('、')}`,
        ''
      );
    }

    return lines.join('\n');
  }
}

// 导出单例
export const scriptAnalyzer = new ScriptAnalyzer();
