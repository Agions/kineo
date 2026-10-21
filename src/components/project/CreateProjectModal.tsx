import { Sparkles, Video, Film, Check, Plus, Wand2 } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProjectStore } from '@/stores';
import type { ProjectData } from '@/common/types';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ART_STYLES = [
  {
    id: 'anime',
    name: '日系二次元',
    desc: '清透光效、细腻线稿与鲜明二次元人设',
    badge: '热门推荐',
  },
  {
    id: 'xianxia',
    name: '国风修仙',
    desc: '水墨云雾、玄幻法宝与仙侠宏大场景',
    badge: '高精画质',
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    desc: '霓虹夜景、高科技机械臂与未来都市',
    badge: '4K 画质',
  },
  {
    id: 'realistic',
    name: '美漫写实',
    desc: '强对比光影、电影级景深与美式剧组风格',
    badge: '硬核画风',
  },
];

const ASPECT_RATIOS = [
  { id: '16:9', name: '16:9 横屏漫剧', desc: '桌面大屏与视频平台标准 4K 画幅', icon: Video },
  { id: '9:16', name: '9:16 竖屏微短剧', desc: '移动端短视频竖屏全屏画幅', icon: Film },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const store = useProjectStore();

  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('anime');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRandomFill = () => {
    const samples = [
      {
        name: '赛博修仙：数字元神觉醒',
        desc: '在 2099 年的天道服务器中，凭借数字元神反抗黑神话财阀',
      },
      { name: '都市战神：龙王归来', desc: '隐姓埋名三年的战神重新出山，挥手间执掌万亿资本' },
      { name: '规则怪谈：夜间公交车', desc: '继承编号 404 的诡异公交车，遵循守则在规则怪谈中求存' },
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    setProjectName(picked.name);
    setDescription(picked.desc);
  };

  const handleCreate = async () => {
    const finalTitle = projectName.trim() || `漫剧项目 · ${new Date().toLocaleDateString()}`;
    setIsSubmitting(true);

    try {
      const nowIso = new Date().toISOString();
      const newProjectData: Partial<ProjectData> & Record<string, any> = {
        id: `prj-${Date.now()}`,
        name: finalTitle,
        description: description.trim() || 'AI 自动创建漫剧 SOP 生成项目',
        artStyle: selectedStyle,
        aspectRatio: selectedRatio,
        status: 'draft',
        stage: 'Draft',
        updatedAt: nowIso,
        createdAt: nowIso,
      };

      let createdProject = newProjectData as any;

      if (typeof store.createProject === 'function') {
        createdProject = store.createProject(newProjectData as any);
      }
      if (typeof store.setCurrentProject === 'function') {
        store.setCurrentProject(createdProject);
      }

      onOpenChange(false);
      void navigate('/workflow', {
        state: { projectId: createdProject.id || newProjectData.id, isNewProject: true },
      });
    } catch (e) {
      console.error('Create project failed:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] max-w-2xl backdrop-blur-2xl p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[var(--foreground)]">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Plus className="w-4 h-4" />
              </div>
              <span>新建漫剧工程</span>
            </DialogTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRandomFill}
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
            >
              <Wand2 className="w-3.5 h-3.5 mr-1" />
              随机灵感
            </Button>
          </div>
          <DialogDescription className="text-xs text-[var(--muted-foreground)]">
            配置漫剧元信息与基础画风，确认后将直接进入 6 步漫剧生成车间
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* 项目名称与描述 */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                工程名称 <span className="text-indigo-400">*</span>
              </label>
              <Input
                placeholder="例如：赛博修仙·第1季 或 龙王归来"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-transparent border border-[var(--border)] focus:outline-none focus:ring-0 text-[var(--foreground)] text-xs rounded-xl py-2.5"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                剧情概要 / 看点描述
              </label>
              <Textarea
                rows={2}
                placeholder="简述核心故事梗概或看点，AI 将在分析时自动匹配镜头基调..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-transparent border border-[var(--border)] focus:outline-none focus:ring-0 text-[var(--foreground)] text-xs resize-none rounded-xl py-2.5"
              />
            </div>
          </div>

          {/* 画风选卡器 */}
          <div>
            <label className="text-xs font-bold text-[var(--foreground)] block mb-2">选择视觉画风预设</label>
            <div className="grid grid-cols-2 gap-2.5">
              {ART_STYLES.map((style) => {
                const isSelected = selectedStyle === style.id;
                return (
                  <div
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-transparent border border-[var(--border)] hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[var(--foreground)] flex items-center gap-1.5">
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                        {style.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-bold">
                        {style.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted-foreground)] leading-normal">{style.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 画幅比例选择 */}
          <div>
            <label className="text-xs font-bold text-[var(--foreground)] block mb-2">目标画幅与分辨率</label>
            <div className="grid grid-cols-2 gap-2.5">
              {ASPECT_RATIOS.map((ratio) => {
                const isSelected = selectedRatio === ratio.id;
                const Icon = ratio.icon;
                return (
                  <div
                    key={ratio.id}
                    onClick={() => setSelectedRatio(ratio.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-transparent border border-[var(--border)] hover:border-indigo-500/40'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-white/5 border border-[var(--border)] text-[var(--muted-foreground)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[var(--foreground)] block">{ratio.name}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)] block">{ratio.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-xs"
          >
            取消
          </Button>
          <Button
            size="sm"
            disabled={isSubmitting}
            onClick={handleCreate}
            className="studio-btn-primary px-5 py-2 text-xs rounded-xl border-0"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            确认创建并无缝导入剧本
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;
