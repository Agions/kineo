/**
 * CharacterDesigner.tsx — 角色设计与视觉一致性锁定工作台 (2026 工业级版)
 *
 * 核心升级：
 * 1. 角色立绘与参考图管理：支持 AI 一键生成高清立绘与本地参考图上传；
 * 2. Visual DNA 视觉基因徽章管理：发色、发型、面容特征、服饰专属标签自由编辑；
 * 3. 人设锁定开关：锁定后全剧分镜自动继承此参考图与视觉提示词；
 * 4. 多角色列表快速切换与管理。
 */

import {
  Plus,
  Trash2,
  Save,
  Wand2,
  Upload,
  Lock,
  Unlock,
  Sparkles,
  Tag,
  Volume2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import type { CharacterAppearance, ClothingItem } from '@/common/types/composition';
import type { Character } from '@/common/types/novel';
import { generateCharId } from '@/common/utils';
import { CharacterPortraitService } from '@/core/services/ai/character/CharacterPortraitService';
import { AutoVoiceSynthesizer } from '@/core/services/audio/AutoVoiceSynthesizer';
import { logger } from '@/core/utils/logger';

import styles from './CharacterDesigner.module.less';

interface SelectFieldOption<T extends string> {
  value: T;
  label: string;
}

function SelectField<T extends string>({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectFieldOption<T>[];
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger id={id}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const CHARACTER_ROLES = [
  { value: 'protagonist', label: '主角 (Protagonist)' },
  { value: 'antagonist', label: '反派 (Antagonist)' },
  { value: 'supporting', label: '主要配角 (Supporting)' },
  { value: 'minor', label: '旁白/路人 (Minor)' },
] as const;

const GENDER_OPTIONS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: '中性/未知' },
] as const;

const CLOTHING_TYPES = [
  { value: 'head', label: '头部' },
  { value: 'top', label: '上装' },
  { value: 'bottom', label: '下装' },
  { value: 'shoes', label: '鞋子' },
  { value: 'accessory', label: '配饰' },
] as const;

export interface CharacterDesignerProps {
  character?: Character;
  characters?: Character[];
  onChange?: (characters: Character[]) => void;
  projectId?: string;
  onSave?: (character: Character) => void;
  onCancel?: () => void;
  onGenerate?: (prompt: string) => void;
}

export function CharacterDesigner({
  character: propCharacter,
  characters: propCharacters = [],
  onChange,
  projectId = 'default_project',
  onSave,
  onCancel,
  onGenerate,
}: CharacterDesignerProps) {
  // 维护内部角色列表
  const [characterList, setCharacterList] = useState<Character[]>(() => {
    if (propCharacters.length > 0) return propCharacters;
    if (propCharacter) return [propCharacter];
    return [
      {
        id: generateCharId(),
        name: '林澈',
        role: 'protagonist',
        gender: 'male',
        description: '冷静沉着的黑客游侠，身手敏捷，配有高阶义眼与光纤战术刃。',
        hairColor: '银白色',
        hairStyle: '碎短发',
        eyeColor: '琥珀金',
        features: ['左眼机械义眼', '冷峻神情'],
        appearance: {
          hairColor: '银白色',
          hairStyle: '碎短发',
          clothing: '高领黑色战术风衣',
        },
        visualDna: ['男性', '银白碎发', '琥珀金义眼', '黑色高领风衣', '主角光环'],
        isLocked: true,
      },
    ];
  });

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const activeCharacter = characterList[selectedIndex] || characterList[0];

  // 当前选中角色的编辑字段状态
  const [name, setName] = useState(activeCharacter?.name ?? '');
  const [description, setDescription] = useState(activeCharacter?.description ?? '');
  const [role, setRole] = useState<Character['role']>(activeCharacter?.role ?? 'protagonist');
  const [gender, setGender] = useState(activeCharacter?.gender ?? 'male');
  const [age, setAge] = useState(activeCharacter?.age ?? '');
  const [personality, setPersonality] = useState(activeCharacter?.personality ?? '');
  const [appearance, setAppearance] = useState<CharacterAppearance>(
    activeCharacter?.appearance ?? {
      hairColor: '#000000',
      eyeColor: '#000000',
      skinTone: '#F5D6BA',
      height: 'average',
    }
  );
  const [clothing, setClothing] = useState<ClothingItem[]>(activeCharacter?.clothing ?? []);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>(
    activeCharacter?.referenceImageUrl ?? activeCharacter?.avatarUrl ?? ''
  );
  const [visualDna, setVisualDna] = useState<string[]>(
    activeCharacter?.visualDna ?? CharacterPortraitService.deriveVisualDna(activeCharacter || {})
  );
  const [isLocked, setIsLocked] = useState<boolean>(activeCharacter?.isLocked ?? false);

  const [newTagInput, setNewTagInput] = useState('');
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当切换角色时同步表单数据
  useEffect(() => {
    if (!activeCharacter) return;
    setName(activeCharacter.name ?? '');
    setDescription(activeCharacter.description ?? '');
    setRole(activeCharacter.role ?? 'protagonist');
    setGender(activeCharacter.gender ?? 'male');
    setAge(activeCharacter.age ?? '');
    setPersonality(activeCharacter.personality ?? '');
    setAppearance(
      activeCharacter.appearance ?? {
        hairColor: '#000000',
        eyeColor: '#000000',
        skinTone: '#F5D6BA',
        height: 'average',
      }
    );
    setClothing(activeCharacter.clothing ?? []);
    setReferenceImageUrl(activeCharacter.referenceImageUrl ?? activeCharacter.avatarUrl ?? '');
    setVisualDna(
      activeCharacter.visualDna && activeCharacter.visualDna.length > 0
        ? activeCharacter.visualDna
        : CharacterPortraitService.deriveVisualDna(activeCharacter)
    );
    setIsLocked(activeCharacter.isLocked ?? false);
  }, [selectedIndex, activeCharacter]);

  // 更新外观属性
  const updateAppearance = useCallback(
    (key: keyof CharacterAppearance, value: string | number | string[] | undefined) => {
      setAppearance((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // 服装操作
  const addClothing = useCallback(() => {
    setClothing((prev) => [
      ...prev,
      {
        type: 'top',
        name: '',
        style: 'casual',
        color: '#FFFFFF',
      },
    ]);
  }, []);

  const updateClothing = useCallback((index: number, updates: Partial<ClothingItem>) => {
    setClothing((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  }, []);

  const removeClothing = useCallback((index: number) => {
    setClothing((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 新增角色
  const handleAddNewCharacter = () => {
    const newChar: Character = {
      id: generateCharId(),
      name: `新角色 ${characterList.length + 1}`,
      role: 'supporting',
      gender: 'female',
      description: '重要故事角色',
      appearance: {
        hairColor: '#E63946',
        eyeColor: '#1D3557',
        skinTone: '#F1FAEE',
      },
      visualDna: ['女性', '红发', '配角'],
      isLocked: false,
    };
    const updated = [...characterList, newChar];
    setCharacterList(updated);
    setSelectedIndex(updated.length - 1);
    onChange?.(updated);
    toast.success('已新建角色卡片');
  };

  // 删除当前角色
  const handleDeleteCurrentCharacter = () => {
    if (characterList.length <= 1) {
      toast.warning('至少需要保留一位漫剧角色');
      return;
    }
    const updated = characterList.filter((_, idx) => idx !== selectedIndex);
    setCharacterList(updated);
    setSelectedIndex(Math.max(0, selectedIndex - 1));
    onChange?.(updated);
    toast.info('已移除角色');
  };

  // 从外貌特征重新提取 Visual DNA
  const handleReDeriveVisualDna = () => {
    const derived = CharacterPortraitService.deriveVisualDna({
      name,
      role,
      gender,
      appearance,
      clothing,
    });
    setVisualDna(derived);
    toast.info(`已重新抽取 ${derived.length} 项视觉基因特征`);
  };

  // 添加自定义标签
  const handleAddVisualDnaTag = () => {
    const tag = newTagInput.trim();
    if (!tag) return;
    if (visualDna.includes(tag)) {
      setNewTagInput('');
      return;
    }
    setVisualDna((prev) => [...prev, tag]);
    setNewTagInput('');
  };

  // 删除单个标签
  const handleRemoveVisualDnaTag = (tagToRemove: string) => {
    setVisualDna((prev) => prev.filter((t) => t !== tagToRemove));
  };

  // AI 生成标准立绘
  const handleGeneratePortrait = async () => {
    setIsGeneratingPortrait(true);
    toast.info(`正在为 [${name || '当前角色'}] 生成立绘与锁定特征...`);

    try {
      const draftChar: Character = {
        id: activeCharacter?.id ?? generateCharId(),
        name: name.trim() || '未命名角色',
        role,
        gender,
        appearance,
        clothing,
        visualDna,
      };

      const result = await CharacterPortraitService.generatePortrait(projectId, draftChar);
      setReferenceImageUrl(result.uri);
      setVisualDna(result.visualDna);
      setIsLocked(true);
      toast.success('🎉 角色立绘生成成功，人设已自动锁定！');
    } catch (err: any) {
      toast.error(`立绘生成失败: ${err?.message || '未知错误'}`);
    } finally {
      setIsGeneratingPortrait(false);
    }
  };

  // 本地上传参考图
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const uploadRes = await CharacterPortraitService.uploadPortrait(
          projectId,
          activeCharacter?.id ?? generateCharId(),
          base64
        );
        setReferenceImageUrl(uploadRes.uri);
        setIsLocked(true);
        toast.success('📷 本地参考图已上传并绑定至角色人设！');
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('读取图片失败，请检查文件格式');
    }
  };

  // 保存当前角色
  const handleSave = useCallback(() => {
    if (!name.trim()) {
      toast.warning('角色名称不能为空');
      return;
    }

    const updatedCharacter: Character = {
      id: activeCharacter?.id ?? generateCharId(),
      name: name.trim(),
      description: description.trim(),
      role,
      gender,
      age,
      personality,
      appearance,
      clothing,
      referenceImageUrl,
      avatarUrl: referenceImageUrl,
      visualDna,
      isLocked,
      updatedAt: new Date().toISOString(),
    };

    const nextList = characterList.map((c, i) => (i === selectedIndex ? updatedCharacter : c));
    setCharacterList(nextList);
    onChange?.(nextList);
    onSave?.(updatedCharacter);
    toast.success(`角色 [${updatedCharacter.name}] 人设已保存`);
  }, [
    name,
    description,
    role,
    gender,
    age,
    personality,
    appearance,
    clothing,
    referenceImageUrl,
    visualDna,
    isLocked,
    activeCharacter,
    characterList,
    selectedIndex,
    onChange,
    onSave,
  ]);

  // 推荐音色预览
  const recommendedVoice = useMemo(() => {
    const g = gender === 'female' ? 'female' : gender === 'male' ? 'male' : 'unknown';
    return AutoVoiceSynthesizer.selectVoiceForCharacter(name, g);
  }, [name, gender]);

  return (
    <div className={styles.container}>
      {/* 顶部角色列表选择条 */}
      <div className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-2xl border border-white/10 mb-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs text-zinc-400 font-bold px-2 shrink-0">剧本角色库:</span>
          {characterList.map((char, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={char.id || index}
                onClick={() => setSelectedIndex(index)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
                }`}
              >
                {char.isLocked && <Lock className="w-3 h-3 text-emerald-400" />}
                <span>{char.name}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  {char.role === 'protagonist' ? '主角' : '配角'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleAddNewCharacter} className="text-xs h-8">
            <Plus className="w-3.5 h-3.5 mr-1" />
            新增角色
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeleteCurrentCharacter}
            className="text-xs h-8"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            删除
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：立绘与视觉一致性锁定卡片 (Visual Consistency Panel) */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-white/10 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-100">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                标准立绘与参考图
              </CardTitle>
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  isLocked ? 'text-emerald-400 border-emerald-500/30' : 'text-zinc-400 border-white/10'
                }`}
              >
                {isLocked ? '🔒 人设已锁定' : '未锁定'}
              </Badge>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* 立绘显示大视窗 */}
              <div className="relative rounded-2xl overflow-hidden aspect-square bg-slate-900 border border-white/10 flex items-center justify-center group shadow-inner">
                {referenceImageUrl ? (
                  <img
                    src={referenceImageUrl}
                    alt={name}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-zinc-400 font-medium">暂未绑定标准立绘参考图</p>
                    <p className="text-[11px] text-zinc-500">可点击下方按钮一键 AI 生成或上传本地原画</p>
                  </div>
                )}

                {/* 悬浮锁定角标 */}
                {isLocked && (
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1 shadow-lg backdrop-blur-md">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    分镜已锁定
                  </div>
                )}
              </div>

              {/* 动作按钮：AI 生成 / 本地上传 */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  onClick={handleGeneratePortrait}
                  disabled={isGeneratingPortrait}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs h-9 shadow-md shadow-cyan-500/20"
                >
                  <Wand2 className="w-3.5 h-3.5 mr-1" />
                  {isGeneratingPortrait ? '正在绘制中...' : 'AI 一键生成立绘'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-white/15 text-zinc-200 hover:text-white text-xs h-9"
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  本地上传参考图
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* 人设锁定状态切换 */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">全剧分镜人设锁定</span>
                  <span className="text-[10px] text-zinc-400 block">
                    锁定后，分镜生图将强制挂载该立绘与特征基因
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={isLocked ? 'default' : 'outline'}
                  onClick={() => setIsLocked(!isLocked)}
                  className={`text-xs h-7 px-3 ${
                    isLocked ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'border-white/15 text-zinc-300'
                  }`}
                >
                  {isLocked ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                  {isLocked ? '已锁定' : '未锁定'}
                </Button>
              </div>

              {/* Visual DNA 视觉特征词基因标签 */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    Visual DNA 视觉基因
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleReDeriveVisualDna}
                    className="text-[11px] h-6 px-2 text-indigo-400 hover:text-indigo-300"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    智能提炼
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[48px] p-2 rounded-xl bg-slate-900 border border-white/5">
                  {visualDna.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[11px] py-0.5 px-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveVisualDnaTag(tag)}
                        className="hover:text-red-400 ml-0.5 font-bold"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {visualDna.length === 0 && (
                    <span className="text-[11px] text-zinc-500 select-none">
                      点击“智能提炼”自动抽取外貌特征词
                    </span>
                  )}
                </div>

                {/* 手动追加标签 */}
                <div className="flex gap-2">
                  <Input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddVisualDnaTag()}
                    placeholder="输入专属特征 (如: 左耳骨钉, 机械左臂)"
                    className="text-xs h-8 bg-white/5 border-white/10"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddVisualDnaTag}
                    className="text-xs h-8 px-3 border-white/15"
                  >
                    添加
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：角色多维属性编辑器 (Tabs) */}
        <div className="lg:col-span-2">
          <Card className="border border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-3 border-b border-white/10 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>编辑角色人设: {name || '未命名'}</span>
                <Badge variant="outline" className="text-[10px] text-indigo-300 font-mono">
                  {role.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10 p-1 rounded-xl">
                  <TabsTrigger value="basic" className="text-xs">基本设定</TabsTrigger>
                  <TabsTrigger value="appearance" className="text-xs">外貌五官</TabsTrigger>
                  <TabsTrigger value="clothing" className="text-xs">服装配饰</TabsTrigger>
                  <TabsTrigger value="voice" className="text-xs">配音音色</TabsTrigger>
                </TabsList>

                {/* 1. 基本信息 */}
                <TabsContent value="basic" className="space-y-4 pt-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs text-zinc-300">角色姓名</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="如: 林澈"
                        className="bg-white/5 border-white/10 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="role" className="text-xs text-zinc-300">剧本定位</Label>
                      <SelectField
                        id="role"
                        value={role}
                        onChange={(value) => setRole(value as Character['role'])}
                        options={CHARACTER_ROLES}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="gender" className="text-xs text-zinc-300">性别</Label>
                      <SelectField
                        id="gender"
                        value={gender}
                        onChange={setGender}
                        options={GENDER_OPTIONS}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="age" className="text-xs text-zinc-300">表观年龄</Label>
                      <Input
                        id="age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="如: 24 岁"
                        className="bg-white/5 border-white/10 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs text-zinc-300">人设背景故事与性格特征</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="描述角色的身份动机、行事风格与内心冲突..."
                      rows={4}
                      className="bg-white/5 border-white/10 text-xs"
                    />
                  </div>
                </TabsContent>

                {/* 2. 外观五官 */}
                <TabsContent value="appearance" className="space-y-4 pt-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="hairColor" className="text-xs text-zinc-300">发色设定</Label>
                      <Input
                        id="hairColor"
                        value={appearance.hairColor ?? '银白色'}
                        onChange={(e) => updateAppearance('hairColor', e.target.value)}
                        placeholder="如: 银白色 / 蓝黑"
                        className="bg-white/5 border-white/10 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="hairStyle" className="text-xs text-zinc-300">发型发长</Label>
                      <Input
                        id="hairStyle"
                        value={appearance.hairStyle ?? '碎短发'}
                        onChange={(e) => updateAppearance('hairStyle', e.target.value)}
                        placeholder="如: 高马尾 / 碎短发"
                        className="bg-white/5 border-white/10 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="eyeColor" className="text-xs text-zinc-300">瞳色特征</Label>
                      <Input
                        id="eyeColor"
                        value={appearance.eyeColor ?? '琥珀金'}
                        onChange={(e) => updateAppearance('eyeColor', e.target.value)}
                        placeholder="如: 琥珀金 / 冰蓝色"
                        className="bg-white/5 border-white/10 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="features" className="text-xs text-zinc-300">特殊外貌特征 (换镜头时不变量)</Label>
                    <Textarea
                      id="features"
                      value={appearance.features?.join('\n') ?? ''}
                      onChange={(e) =>
                        updateAppearance('features', e.target.value.split('\n').filter(Boolean))
                      }
                      placeholder="每行一个特征，如:&#10;左脸颊有十字浅浅刀疤&#10;佩戴发光全息单眼战术镜"
                      rows={3}
                      className="bg-white/5 border-white/10 text-xs"
                    />
                  </div>
                </TabsContent>

                {/* 3. 服装与装束 */}
                <TabsContent value="clothing" className="space-y-4 pt-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-zinc-300">标志性服装套组</Label>
                    <Button variant="outline" size="sm" onClick={addClothing} className="text-xs h-7">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      添加服装部位
                    </Button>
                  </div>

                  <ScrollArea className="h-[220px]">
                    <div className="space-y-3">
                      {clothing.length === 0 ? (
                        <div className="text-center text-zinc-500 py-6 text-xs">
                          暂无专属服装设定，点击上方按钮添加
                        </div>
                      ) : (
                        clothing.map((item, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs"
                          >
                            <div className="w-24 shrink-0">
                              <Select
                                value={item.type}
                                onValueChange={(value) =>
                                  updateClothing(index, { type: value as ClothingItem['type'] })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs bg-transparent">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CLOTHING_TYPES.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Input
                              placeholder="服装名称 (如: 高领风衣)"
                              value={item.name}
                              onChange={(e) => updateClothing(index, { name: e.target.value })}
                              className="h-8 text-xs bg-white/5 border-white/10"
                            />
                            <Input
                              placeholder="风格材质 (如: 战术纳米纤维)"
                              value={item.style}
                              onChange={(e) => updateClothing(index, { style: e.target.value })}
                              className="h-8 text-xs bg-white/5 border-white/10"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeClothing(index)}
                              className="h-8 w-8 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* 4. 配音音色 */}
                <TabsContent value="voice" className="space-y-4 pt-3">
                  <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-zinc-100">自动智能分角色音色分配</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-indigo-300 border-indigo-500/30">
                        Edge-TTS 神经网络
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-300 font-mono">
                      当前自动匹配发音人: <strong className="text-cyan-400">{recommendedVoice}</strong>
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      系统将根据角色名字与性别（男声: 云希 Yunxi / 云扬 Yunyang；女声: 晓晓 Xiaoxiao / 晓伊 Xiaoyi）在压制视频时自动合成专属台词对白。
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator className="my-4 bg-white/10" />

              <div className="flex justify-end gap-2">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel} className="text-xs h-9 border-white/15">
                    取消
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-9 px-5 shadow-lg shadow-indigo-500/20"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  保存角色人设与特征
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CharacterDesigner;
