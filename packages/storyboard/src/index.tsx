import React, { useState } from 'react';
import { Shot } from '@kineo/core';
import { MangaCard, MangaButton } from '@kineo/ui';
import {
  parseNovelToScript,
  parseDirectScript,
  generateScriptFromIdea,
  ArtStylePreset,
  ScriptParseResult,
} from '@kineo/ai-engine';

export interface StoryboardGridProps {
  shots: Shot[];
  onSelectShot?: (shot: Shot) => void;
  onGenerateImage?: (shotId: string) => void;
}

export const StoryboardGrid: React.FC<StoryboardGridProps> = ({
  shots,
  onSelectShot,
  onGenerateImage,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {shots.map((shot) => {
        const isSelected = selectedId === shot.id;
        return (
          <MangaCard
            key={shot.id}
            className={`transition-all border-2 cursor-pointer ${
              isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-800'
            }`}
          >
            <div
              onClick={() => {
                setSelectedId(shot.id);
                onSelectShot?.(shot);
              }}
            >
              <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800 mb-3">
                {shot.imageUrl ? (
                  <img
                    src={shot.imageUrl}
                    alt={shot.prompt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <span className="text-xs text-slate-500 block mb-2">镜头 #{shot.order}</span>
                    <span className="text-sm text-slate-400">点击生成 AI 画风镜头</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-slate-900/80 px-2 py-0.5 rounded text-xs text-slate-300">
                  镜头 #{shot.order}
                </div>
              </div>

              {shot.dialogue && (
                <div className="bg-slate-800/50 p-2 rounded mb-2 text-xs text-slate-200 font-medium">
                  <span className="text-indigo-400 font-semibold">
                    {shot.characterName || '旁白'}:{' '}
                  </span>
                  “{shot.dialogue}”
                </div>
              )}

              <p className="text-xs text-slate-400 line-clamp-2 mb-3">{shot.prompt}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-500">{shot.durationSeconds}s</span>
                <MangaButton
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateImage?.(shot.id);
                  }}
                >
                  AI 画面重绘
                </MangaButton>
              </div>
            </div>
          </MangaCard>
        );
      })}
    </div>
  );
};

export function validateShotSequence(shots: Shot[]): boolean {
  return shots.every((shot, index) => shot.order === index + 1);
}

export const ShotToolbar: React.FC<{
  shotId: string;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}> = ({ onRegenerate, onDelete, onMoveUp, onMoveDown }) => (
  <div className="flex items-center space-x-2 bg-slate-900 p-2 rounded">
    <MangaButton size="sm" variant="secondary" onClick={onMoveUp}>
      ↑
    </MangaButton>
    <MangaButton size="sm" variant="secondary" onClick={onMoveDown}>
      ↓
    </MangaButton>
    <MangaButton size="sm" variant="secondary" onClick={onRegenerate}>
      重绘
    </MangaButton>
    <MangaButton size="sm" variant="danger" onClick={onDelete}>
      删除
    </MangaButton>
  </div>
);

export const StoryboardStats: React.FC<{
  totalShots: number;
  completedShots: number;
  totalDuration: number;
}> = ({ totalShots, completedShots, totalDuration }) => (
  <div className="flex justify-between items-center bg-slate-800 p-4 rounded-lg text-slate-200 mt-4">
    <div className="flex flex-col">
      <span className="text-xs text-slate-400">总镜头数</span>
      <span className="font-semibold">{totalShots}</span>
    </div>
    <div className="flex flex-col">
      <span className="text-xs text-slate-400">已完成</span>
      <span className="font-semibold">{completedShots}</span>
    </div>
    <div className="flex flex-col">
      <span className="text-xs text-slate-400">总时长</span>
      <span className="font-semibold">{totalDuration}s</span>
    </div>
  </div>
);

export function calculateTotalDuration(shots: Shot[]): number {
  return shots.reduce((acc, shot) => acc + shot.durationSeconds, 0);
}

export interface ScriptSourceManagerProps {
  onParse?: (result: ScriptParseResult) => void;
}

/** 剧本全路径获取与控制中心组件 (小说上传 / 直接上传剧本 / AI 生成剧本) */
export const ScriptSourceManager: React.FC<ScriptSourceManagerProps> = ({ onParse }) => {
  const [activeTab, setActiveTab] = useState<'novel' | 'direct' | 'ai'>('novel');
  const [content, setContent] = useState('');
  const [ideaText, setIdeaText] = useState('');
  const [episodesCount, setEpisodesCount] = useState(1);
  const [style, setStyle] = useState<ArtStylePreset>('modern_anime');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      let res: ScriptParseResult;
      if (activeTab === 'novel') {
        res = await parseNovelToScript(content, style);
      } else if (activeTab === 'direct') {
        res = await parseDirectScript(content);
      } else {
        res = await generateScriptFromIdea(ideaText, episodesCount, style);
      }
      onParse?.(res);
    } catch (e) {
      console.error('剧本解析生成失败', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <MangaCard title="剧本获取与智能生成中心" className="w-full">
      <div className="flex gap-2 mb-4 border-b border-slate-800 pb-3">
        <MangaButton
          size="sm"
          variant={activeTab === 'novel' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('novel')}
        >
          📖 小说上传转剧本
        </MangaButton>
        <MangaButton
          size="sm"
          variant={activeTab === 'direct' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('direct')}
        >
          📝 直接上传剧本
        </MangaButton>
        <MangaButton
          size="sm"
          variant={activeTab === 'ai' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('ai')}
        >
          🪄 AI 生成剧本
        </MangaButton>
      </div>

      <div className="space-y-4">
        {activeTab === 'novel' && (
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              导入小说原文文本 (.txt / Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请在此粘贴或拖入小说文本内容（包含对白、旁白与章节标题）..."
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {activeTab === 'direct' && (
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              导入专业标准剧本 (.fountain / 剧本文本)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="角色：萧炎&#10;对白：“三十年河东，三十年河西，莫欺少年穷！”&#10;（镜头转向天穹，风云巨变...）"
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">创意灵感 / 剧情大纲</label>
              <input
                type="text"
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="例如：修仙天才被退婚后觉醒神级系统，一拳打爆反派..."
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">生成集数</label>
              <input
                type="number"
                min={1}
                max={10}
                value={episodesCount}
                onChange={(e) => setEpisodesCount(Number(e.target.value))}
                className="w-24 bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">画风预设:</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as ArtStylePreset)}
              className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
            >
              <option value="modern_anime">现代日漫</option>
              <option value="xianxia">仙侠国风</option>
              <option value="cyberpunk">赛博朋克</option>
              <option value="shonen_action">热血战斗</option>
              <option value="dark_fantasy">暗黑奇幻</option>
            </select>
          </div>

          <MangaButton
            variant="primary"
            size="md"
            onClick={handleProcess}
            disabled={
              isProcessing ||
              (activeTab !== 'ai' && !content.trim()) ||
              (activeTab === 'ai' && !ideaText.trim())
            }
          >
            {isProcessing ? '正在处理中...' : activeTab === 'ai' ? '生成 AI 剧本' : '开始智能解析'}
          </MangaButton>
        </div>
      </div>
    </MangaCard>
  );
};
