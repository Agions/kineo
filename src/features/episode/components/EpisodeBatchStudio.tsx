/**
 * EpisodeBatchStudio.tsx — 漫剧多集连载工作台与短剧黄金3秒/尾镜卡点总控台
 *
 * 核心能力：
 * 1. 万字长文智能切分：单集 60~90 秒工业规格，一键切分全集剧集大纲；
 * 2. 黄金 3 秒抓人开篇 (Hook Pill) 评估与视觉冲击提示词注入；
 * 3. 尾镜留白卡点 (Cliffhanger Pill) 完播率提升评估；
 * 4. 剧集张力曲线 (Pacing Curve) 可视化图谱；
 * 5. 全集批量流水线连续渲染排队与单集极速成片导出。
 */

import {
  Film,
  Sparkles,
  Play,
  Layers,
  ChevronRight,
  TrendingUp,
  Flame,
  HelpCircle,
  Skull,
  Zap,
  RotateCcw,
  CheckCircle2,
  Clock,
  Video,
  Split,
  FolderOpen,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import type { ProjectData } from '@/core/project/types/project';
import { EpisodeManagerService } from '@/core/services/episode/EpisodeManagerService';
import type {
  MangaSeriesProject,
  MangaEpisode,
  EpisodeHookCue,
  EpisodeCliffhangerCue,
} from '@/core/services/episode/episode-types';
import { PlayableMangaPipelineService } from '@/core/services/pipeline/PlayableMangaPipelineService';
import { logger } from '@/core/utils/logger';

export interface EpisodeBatchStudioProps {
  project: ProjectData;
  onUpdateProject?: (updates: Partial<ProjectData>) => void;
}

export const EpisodeBatchStudio: React.FC<EpisodeBatchStudioProps> = ({
  project,
  onUpdateProject,
}) => {
  // 长文输入与切分参数
  const [novelInput, setNovelInput] = useState<string>(
    project.content || project.script || ''
  );
  const [scenesPerEpisode, setScenesPerEpisode] = useState<number>(12);
  const [targetDuration, setTargetDuration] = useState<number>(75);
  const [isSplitting, setIsSplitting] = useState<boolean>(false);

  // 连载剧集项目状态
  const [seriesProject, setSeriesProject] = useState<MangaSeriesProject | null>(() => {
    const rawContent = project.content || project.script || '';
    if (rawContent && rawContent.length > 50) {
      return EpisodeManagerService.splitNovelIntoEpisodes(project.name || '漫剧连载短剧', rawContent, {
        scenesPerEpisode: 12,
        targetDurationPerEpisode: 75,
        characters: (project.characters as any) || [],
      });
    }
    return null;
  });

  // 选中的剧集弹窗详情
  const [viewingEpisode, setViewingEpisode] = useState<MangaEpisode | null>(null);

  // 批量渲染状态
  const [isBatchRendering, setIsBatchRendering] = useState<boolean>(false);
  const [renderingEpisodeIndex, setRenderingEpisodeIndex] = useState<number>(-1);
  const [renderProgress, setRenderProgress] = useState<{ percent: number; message: string }>({
    percent: 0,
    message: '',
  });

  // 一键智能拆分长文
  const handleSplitNovel = () => {
    if (!novelInput.trim() || novelInput.trim().length < 30) {
      toast.warning('请输入至少 30 字以上的小说正文或分幕剧本');
      return;
    }
    setIsSplitting(true);
    try {
      const result = EpisodeManagerService.splitNovelIntoEpisodes(
        project.name || '漫剧连载短剧',
        novelInput.trim(),
        {
          scenesPerEpisode,
          targetDurationPerEpisode: targetDuration,
          characters: (project.characters as any) || [],
        }
      );
      setSeriesProject(result);
      onUpdateProject?.({
        content: novelInput.trim(),
        metadata: {
          ...(typeof project.metadata === 'object' && project.metadata !== null ? project.metadata : {}),
          seriesProject: result,
          totalEpisodes: result.totalEpisodes,
        },
      });
      toast.success(`🎉 成功将剧本拆解为 ${result.totalEpisodes} 集短剧连载架构！`);
    } catch (err: any) {
      toast.error(`拆解失败: ${err?.message || '未知错误'}`);
    } finally {
      setIsSplitting(false);
    }
  };

  // 单集渲染
  const handleRenderSingleEpisode = async (episode: MangaEpisode, epIndex: number) => {
    setIsBatchRendering(true);
    setRenderingEpisodeIndex(epIndex);
    setRenderProgress({ percent: 10, message: `正在准备第 ${episode.episodeNumber} 集资产...` });

    try {
      const epProject: ProjectData = {
        ...project,
        id: `${project.id || 'proj'}_ep_${episode.episodeNumber}`,
        name: `${project.name} - 第${episode.episodeNumber}集`,
        parsedScenes: episode.scenes as any,
      };

      const result = await PlayableMangaPipelineService.execute(epProject, (p) => {
        setRenderProgress({ percent: p.percent, message: p.message });
      });

      // 更新该集完成状态
      if (seriesProject) {
        const nextEpisodes = seriesProject.episodes.map((ep, idx) =>
          idx === epIndex
            ? {
                ...ep,
                status: 'completed' as const,
                videoPath: result.videoPath,
                videoUri: result.videoUri,
              }
            : ep
        );
        const updatedSeries = { ...seriesProject, episodes: nextEpisodes };
        setSeriesProject(updatedSeries);
      }

      toast.success(`🎉 第 ${episode.episodeNumber} 集 1080P 漫剧视频压制完成！`);
    } catch (err: any) {
      logger.error('单集渲染失败:', err);
      toast.error(`第 ${episode.episodeNumber} 集渲染失败: ${err?.message || '请检查日志'}`);
    } finally {
      setIsBatchRendering(false);
      setRenderingEpisodeIndex(-1);
    }
  };

  // 一键全集批量连环渲染
  const handleBatchRenderAll = async () => {
    if (!seriesProject || seriesProject.episodes.length === 0) return;
    setIsBatchRendering(true);
    toast.info(`🚀 启动全集流水线批量压制 (共 ${seriesProject.episodes.length} 集)...`);

    for (let i = 0; i < seriesProject.episodes.length; i++) {
      const ep = seriesProject.episodes[i];
      setRenderingEpisodeIndex(i);
      setRenderProgress({
        percent: Math.round((i / seriesProject.episodes.length) * 100),
        message: `正在批量压制 第 ${i + 1}/${seriesProject.episodes.length} 集: ${ep.title}...`,
      });

      try {
        const epProject: ProjectData = {
          ...project,
          id: `${project.id || 'proj'}_ep_${ep.episodeNumber}`,
          name: `${project.name} - 第${ep.episodeNumber}集`,
          parsedScenes: ep.scenes as any,
        };

        const res = await PlayableMangaPipelineService.execute(epProject);
        ep.status = 'completed';
        ep.videoPath = res.videoPath;
        ep.videoUri = res.videoUri;
      } catch (e) {
        logger.error(`批量压制第 ${i + 1} 集异常:`, e);
      }
    }

    setIsBatchRendering(false);
    setRenderingEpisodeIndex(-1);
    toast.success('🎉 全集短剧连载漫剧批量压制任务全部执行完毕！');
  };

  // 渲染开篇黄金3秒徽章
  const renderHookBadge = (cue?: EpisodeHookCue) => {
    if (!cue) return null;
    let icon = <Flame className="w-3.5 h-3.5 text-amber-400" />;
    let text = '视觉冲击';
    let bg = 'bg-amber-950/40 border-amber-500/30 text-amber-300';

    if (cue.type === 'conflict_clash') {
      icon = <Zap className="w-3.5 h-3.5 text-rose-400" />;
      text = '生死博弈';
      bg = 'bg-rose-950/40 border-rose-500/30 text-rose-300';
    } else if (cue.type === 'suspense_question') {
      icon = <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />;
      text = '悬疑质问';
      bg = 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300';
    }

    return (
      <Badge variant="outline" className={`text-[10px] flex items-center gap-1 py-0.5 px-2 border ${bg}`}>
        {icon}
        <span>黄金3秒: {text} ({Math.round(cue.intensity * 100)}分)</span>
      </Badge>
    );
  };

  // 渲染尾镜卡点徽章
  const renderCliffhangerBadge = (cue?: EpisodeCliffhangerCue) => {
    if (!cue) return null;
    let icon = <TrendingUp className="w-3.5 h-3.5 text-purple-400" />;
    let text = '悬念留白';
    let bg = 'bg-purple-950/40 border-purple-500/30 text-purple-300';

    if (cue.type === 'life_death') {
      icon = <Skull className="w-3.5 h-3.5 text-red-400" />;
      text = '绝境死局';
      bg = 'bg-red-950/40 border-red-500/30 text-red-300';
    } else if (cue.type === 'revelation' || cue.type === 'plot_twist') {
      icon = <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />;
      text = '高能反转';
      bg = 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300';
    }

    return (
      <Badge variant="outline" className={`text-[10px] flex items-center gap-1 py-0.5 px-2 border ${bg}`}>
        {icon}
        <span>尾镜卡点: {text} ({Math.round(cue.retentionScore * 100)}分)</span>
      </Badge>
    );
  };

  const totalScenesCount = useMemo(() => {
    return seriesProject?.episodes.reduce((acc, ep) => acc + ep.scenes.length, 0) || 0;
  }, [seriesProject]);

  const totalEstimatedMinutes = useMemo(() => {
    const secs = seriesProject?.episodes.reduce((acc, ep) => acc + ep.estimatedDuration, 0) || 0;
    return (secs / 60).toFixed(1);
  }, [seriesProject]);

  return (
    <div className="space-y-6">
      {/* 头部大纲概览与长文切分栏 */}
      <div className="p-6 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-2xl shadow-2xl space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-indigo-400" />
              漫剧多集短剧连载工作台 (Series Studio)
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              工业级黄金3秒开篇卡点、单集 60~90 秒网文节奏拆解、全集自动化连续压制
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleBatchRenderAll}
              disabled={isBatchRendering || !seriesProject || seriesProject.episodes.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20"
            >
              <Video className="w-3.5 h-3.5 mr-1.5" />
              {isBatchRendering ? '批量压制中...' : `一键批量渲染全集 (${seriesProject?.episodes.length || 0}集)`}
            </Button>
          </div>
        </div>

        {/* 宏观统计指示 */}
        {seriesProject && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-zinc-400 block mb-1">连载总集数</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                全 {seriesProject.totalEpisodes} 集
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-zinc-400 block mb-1">成片预估时长</span>
              <span className="text-xl font-bold font-mono text-indigo-400">
                ~{totalEstimatedMinutes} 分钟
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-zinc-400 block mb-1">分镜总幕数</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {totalScenesCount} 幕
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-zinc-400 block mb-1">叙事节律</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                爽剧快节奏 (60~90s)
              </span>
            </div>
          </div>
        )}

        {/* 长篇小说智能导入与参数折叠区 */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Split className="w-4 h-4 text-cyan-400" />
              小说文本输入与分集参数配置
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <span>每集镜数:</span>
                <select
                  value={scenesPerEpisode}
                  onChange={(e) => setScenesPerEpisode(parseInt(e.target.value))}
                  className="bg-white/10 border border-white/15 rounded px-2 py-0.5 text-zinc-200 text-xs focus:outline-none"
                >
                  <option value={10}>10 镜 (~50s)</option>
                  <option value={12}>12 镜 (~70s)</option>
                  <option value={14}>14 镜 (~85s)</option>
                  <option value={16}>16 镜 (~100s)</option>
                </select>
              </div>
              <Button
                size="sm"
                onClick={handleSplitNovel}
                disabled={isSplitting}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs h-7 px-3"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {isSplitting ? '拆解中...' : '重新智能拆解'}
              </Button>
            </div>
          </div>

          <Textarea
            value={novelInput}
            onChange={(e) => setNovelInput(e.target.value)}
            placeholder="粘贴长篇网文段落，AI 将按黄金3秒、冲突升级、结尾悬念自动切割为多集短剧..."
            className="h-20 text-xs bg-white/5 border-white/10 resize-none font-sans"
          />
        </div>
      </div>

      {/* 渲染进度条 */}
      {isBatchRendering && (
        <Card className="p-5 bg-indigo-950/40 border border-indigo-500/40 backdrop-blur-xl shadow-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-bold text-white">全集流水线压制进行中</span>
            </div>
            <span className="font-mono text-cyan-400">{renderProgress.percent}%</span>
          </div>
          <Progress value={renderProgress.percent} className="h-2" />
          <p className="text-xs text-zinc-300 font-mono">{renderProgress.message}</p>
        </Card>
      )}

      {/* 各集大纲卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {seriesProject?.episodes.map((ep, index) => {
          const isCurrentRendering = isBatchRendering && renderingEpisodeIndex === index;
          const isDone = ep.status === 'completed';

          return (
            <Card
              key={ep.id}
              className={`p-5 space-y-4 border transition-all backdrop-blur-xl ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                  : isCurrentRendering
                  ? 'bg-indigo-950/40 border-cyan-400 shadow-xl shadow-cyan-500/10'
                  : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900/80 shadow-xl'
              }`}
            >
              {/* 卡片头部 */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-600/30 text-indigo-300 border-indigo-500/30 text-[10px] font-mono">
                      第 {ep.episodeNumber} 集
                    </Badge>
                    <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      约 {Math.round(ep.estimatedDuration)}s · {ep.scenes.length} 幕
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100 mt-1.5 line-clamp-1">
                    {ep.title}
                  </h4>
                </div>

                {isDone ? (
                  <Badge className="bg-emerald-500 text-slate-950 text-[10px] font-bold">已成片</Badge>
                ) : isCurrentRendering ? (
                  <Badge className="bg-cyan-500 text-slate-950 text-[10px] animate-pulse">压制中</Badge>
                ) : null}
              </div>

              {/* 梗概 */}
              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {ep.synopsis || '风暴正在酝酿，主角即将面临重大抉择……'}
              </p>

              {/* 黄金3秒与尾镜卡点徽章 */}
              <div className="space-y-1.5 pt-1">
                {renderHookBadge(ep.hookCue)}
                {renderCliffhangerBadge(ep.cliffhangerCue)}
              </div>

              {/* 节律张力曲线柱状微图 */}
              <div className="space-y-1 pt-2 border-t border-white/10">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>戏剧张力曲线</span>
                  <span className="text-zinc-500">Hook → 爆发 → 卡点</span>
                </div>
                <div className="flex items-end gap-1 h-6">
                  {ep.pacingCurve.map((pill, i) => {
                    const heightPercent = Math.max(20, Math.round(pill.tensionLevel * 100));
                    const isHook = pill.pacingTag === 'hook';
                    const isCliff = pill.pacingTag === 'cliffhanger';
                    const isClimax = pill.pacingTag === 'climax';

                    let barColor = 'bg-white/20';
                    if (isHook) barColor = 'bg-amber-400';
                    else if (isCliff) barColor = 'bg-rose-400';
                    else if (isClimax) barColor = 'bg-cyan-400';

                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm ${barColor} transition-all`}
                        style={{ height: `${heightPercent}%` }}
                        title={`第 ${i + 1} 幕: ${pill.pacingTag} (张力: ${pill.tensionLevel})`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 底部操作区 */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewingEpisode(ep)}
                  className="text-xs text-zinc-300 hover:text-white h-7 px-2"
                >
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  分镜清单 ({ep.scenes.length})
                </Button>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    disabled={isBatchRendering}
                    onClick={() => handleRenderSingleEpisode(ep, index)}
                    className="text-xs bg-indigo-600/80 hover:bg-indigo-600 text-white h-7 px-3"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {isDone ? '重新压制' : '独立压制'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 分镜详情弹窗 */}
      <Dialog open={Boolean(viewingEpisode)} onOpenChange={() => setViewingEpisode(null)}>
        <DialogContent className="max-w-2xl bg-zinc-900 border border-white/15 text-zinc-100 max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Film className="w-4 h-4 text-cyan-400" />
              {viewingEpisode?.title} · 分镜对白清单
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {viewingEpisode?.scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-bold text-cyan-300">
                    第 {idx + 1} 幕 · {scene.location || '场景'}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    角色: {scene.dialogues?.[0]?.character || '旁白'}
                  </span>
                </div>
                <p className="text-zinc-200 leading-relaxed font-sans">{scene.content}</p>
                {scene.dialogues?.[0]?.content && (
                  <p className="text-indigo-300 bg-indigo-950/30 p-2 rounded-lg border border-indigo-500/20 font-mono">
                    💬 对白: "{scene.dialogues[0].content}"
                  </p>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewingEpisode(null)}
              className="text-xs border-white/15"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
