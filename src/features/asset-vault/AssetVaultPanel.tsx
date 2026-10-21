import {
  Users,
  Image as ImageIcon,
  Music,
  Lock,
  Copy,
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';

export interface CharacterAsset {
  id: string;
  name: string;
  role: '主角' | '配角' | '反派';
  seed: number;
  loraPrompt: string;
  frontView: string;
  sideView: string;
  backView: string;
  tags: string[];
}

export interface SceneAsset {
  id: string;
  name: string;
  location: string;
  timeOfDay: '白天' | '黄昏' | '夜景' | '室内';
  imageUrl: string;
  prompt: string;
  reusedEpisodesCount: number;
}

const DEFAULT_CHARACTERS: CharacterAsset[] = [
  {
    id: 'char-1',
    name: '林修 (主角)',
    role: '主角',
    seed: 8942105,
    loraPrompt: 'linxiu_cyber, cyan neon coat, silver hair, sharp eyes, 4k ultra detailed',
    frontView: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80',
    sideView: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&q=80',
    backView: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
    tags: ['银发', '青色风衣', '高冷', '阵法师'],
  },
  {
    id: 'char-2',
    name: '苏瑶 (女主)',
    role: '主角',
    seed: 4321098,
    loraPrompt: 'suyao_fairy, white dress, purple ribbon, elegant, glowing lotus',
    frontView: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    sideView: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    backView: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
    tags: ['白裙', '紫带', '温婉', '医仙'],
  },
];

const DEFAULT_SCENES: SceneAsset[] = [
  {
    id: 'scene-1',
    name: '天道财阀大厦',
    location: '赛博大都会 88 层',
    timeOfDay: '夜景',
    imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&q=80',
    prompt: 'cyberpunk metropolis skyscraper, glowing neon billboards, rainy reflection',
    reusedEpisodesCount: 12,
  },
  {
    id: 'scene-2',
    name: '青云宗禁地大殿',
    location: '修仙宗门后山',
    timeOfDay: '黄昏',
    imageUrl: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=600&q=80',
    prompt: 'xianxia ancient temple on mountain cliff, floating islands, mist sunset',
    reusedEpisodesCount: 8,
  },
];

export const AssetVaultPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'character' | 'scene' | 'audio'>('character');
  const [characters] = useState<CharacterAsset[]>(DEFAULT_CHARACTERS);
  const [scenes] = useState<SceneAsset[]>(DEFAULT_SCENES);

  const copyPrompt = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success('Prompt 与 Seed 参数已复制到剪贴板！');
  };

  return (
    <Card className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl p-5 rounded-2xl mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00f5d4]/10 border border-[#00f5d4]/30 flex items-center justify-center text-[#00f5d4] shadow-[0_0_16px_rgba(0,245,212,0.2)]">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              中心化漫剧资产库 (Central Project Asset Vault)
              <Badge className="bg-[#00f5d4]/10 text-[#00f5d4] border-[#00f5d4]/30 text-[10px]">
                防止跑脸 / 场景一致性
              </Badge>
            </h3>
            <p className="text-xs text-slate-400">
              统一锁定角色三视图定妆照、种子 Seed 与场景底图，跨集数高复用
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('character')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'character'
                ? 'bg-[#00f5d4] text-slate-950 shadow-[0_0_12px_rgba(0,245,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            角色定妆库 ({characters.length})
          </button>
          <button
            onClick={() => setActiveTab('scene')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'scene'
                ? 'bg-[#00f5d4] text-slate-950 shadow-[0_0_12px_rgba(0,245,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            场景底图库 ({scenes.length})
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'audio'
                ? 'bg-[#00f5d4] text-slate-950 shadow-[0_0_12px_rgba(0,245,212,0.3)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            声线音色库 (4)
          </button>
        </div>
      </div>

      {/* Tab 1: 角色三视图定妆库 */}
      {activeTab === 'character' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map((char) => (
              <div
                key={char.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-[#00f5d4]/40 transition-all group relative"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{char.name}</span>
                    <Badge className="bg-slate-800 text-slate-300 text-[10px]">{char.role}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#00f5d4] font-mono bg-[#00f5d4]/10 px-2 py-0.5 rounded border border-[#00f5d4]/30">
                    <span>Seed: {char.seed}</span>
                  </div>
                </div>

                {/* 三视图展台 */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-[3/4] border border-slate-800 group-hover:border-[#00f5d4]/30">
                    <img src={char.frontView} alt="正面" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] bg-slate-950/80 px-1 rounded text-slate-300">
                      正面三视图
                    </span>
                  </div>
                  <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-[3/4] border border-slate-800 group-hover:border-[#00f5d4]/30">
                    <img src={char.sideView} alt="侧面" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] bg-slate-950/80 px-1 rounded text-slate-300">
                      侧面视角
                    </span>
                  </div>
                  <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-[3/4] border border-slate-800 group-hover:border-[#00f5d4]/30">
                    <img src={char.backView} alt="背面" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] bg-slate-950/80 px-1 rounded text-slate-300">
                      背面服饰
                    </span>
                  </div>
                </div>

                {/* LoRA Prompt 规则与标签 */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 mb-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-300 font-mono line-clamp-1 truncate">
                    {char.loraPrompt}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyPrompt(char.loraPrompt)}
                    className="h-6 px-2 text-[10px] text-[#00f5d4] hover:text-[#00f5d4] hover:bg-[#00f5d4]/10"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    复制
                  </Button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {char.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: 场景底图库 */}
      {activeTab === 'scene' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-[#00f5d4]/40 transition-all flex gap-4"
            >
              <div className="w-36 h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 relative">
                <img src={scene.imageUrl} alt={scene.name} className="w-full h-full object-cover" />
                <span className="absolute top-1 left-1 text-[9px] bg-slate-950/90 text-[#00f5d4] px-1.5 py-0.5 rounded font-bold border border-[#00f5d4]/30">
                  {scene.timeOfDay}
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm text-slate-100">{scene.name}</h4>
                    <span className="text-[10px] text-[#a855f7] font-mono bg-[#a855f7]/10 px-1.5 py-0.5 rounded border border-[#a855f7]/30">
                      已复用 {scene.reusedEpisodesCount} 集
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{scene.location}</p>
                  <div className="p-2 rounded bg-slate-900 text-[10px] text-slate-300 font-mono line-clamp-1 border border-slate-800">
                    {scene.prompt}
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyPrompt(scene.prompt)}
                    className="h-6 px-2 text-[10px] text-[#00f5d4] hover:bg-[#00f5d4]/10"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    套用场景底图
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: 声线音色库 */}
      {activeTab === 'audio' && (
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <Music className="w-8 h-8 text-[#00f5d4] mx-auto mb-2 opacity-80" />
          <h4 className="text-sm font-bold text-slate-200 mb-1">多角色声线克隆与音色库</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            支持绑定 Edge-TTS、CosyVoice、ElevenLabs 多角色情感情感配音与专属音效轨
          </p>
          <Badge className="bg-[#00f5d4]/10 text-[#00f5d4] border-[#00f5d4]/30">
            已绑定林修 (青色玄音)、苏瑶 (温婉仙音) 2 个标准声线
          </Badge>
        </div>
      )}
    </Card>
  );
};

export default AssetVaultPanel;
