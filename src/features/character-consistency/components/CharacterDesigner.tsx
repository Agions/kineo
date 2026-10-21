/**
 * CharacterDesigner — 角色设计组件
 * 用于创建和编辑角色的外观、服装等属性
 */

import { Plus, Trash2, Save, Wand2 } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CharacterAppearance, ClothingItem } from '@/common/types/composition';
import type { Character } from '@/common/types/novel';
import { generateCharId } from '@/common/utils';
import { logger } from '@/core/utils/logger';

import styles from './CharacterDesigner.module.less';

/**
 * 选项驱动 Select 字段组件：渲染 {value,label}[] options 为 shadcn Select。
 * 内部 helper — 消除 CHARACTER_ROLES / GENDER_OPTIONS Select 模板重复。
 */
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

// 角色定位选项
const CHARACTER_ROLES = [
  { value: 'protagonist', label: '主角' },
  { value: 'antagonist', label: '反派' },
  { value: 'supporting', label: '配角' },
  { value: 'minor', label: '路人' },
  { value: 'main', label: '主要' },
] as const;

// 性别选项
const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
] as const;

// 服装类型选项
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

/**
 * 角色设计组件
 */
export function CharacterDesigner({
  character,
  characters: _characters,
  onChange: _onChange,
  projectId: _projectId,
  onSave,
  onCancel,
  onGenerate,
}: CharacterDesignerProps) {
  // 表单状态
  const [name, setName] = useState(character?.name ?? '');
  const [description, setDescription] = useState(character?.description ?? '');
  const [role, setRole] = useState<Character['role']>(character?.role ?? 'protagonist');
  const [gender, setGender] = useState(character?.gender ?? 'male');
  const [age, setAge] = useState(character?.age ?? '');
  const [personality, setPersonality] = useState(character?.personality ?? '');
  const [appearance, setAppearance] = useState<CharacterAppearance>(
    character?.appearance ?? {
      hairColor: '#000000',
      eyeColor: '#000000',
      skinTone: '#F5D6BA',
      height: 'average',
    }
  );
  const [clothing, setClothing] = useState<ClothingItem[]>(character?.clothing ?? []);

  // 更新外观属性
  const updateAppearance = useCallback(
    (key: keyof CharacterAppearance, value: string | number | string[] | undefined) => {
      setAppearance((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // 添加服装
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

  // 更新服装
  const updateClothing = useCallback((index: number, updates: Partial<ClothingItem>) => {
    setClothing((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  }, []);

  // 删除服装
  const removeClothing = useCallback((index: number) => {
    setClothing((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 保存角色
  const handleSave = useCallback(() => {
    if (!name.trim()) {
      logger.warn('角色名称不能为空');
      return;
    }

    const characterData: Character = {
      id: character?.id ?? generateCharId(),
      name: name.trim(),
      description: description.trim(),
      role,
      gender,
      age,
      personality,
      appearance,
      clothing,
      createdAt: character?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave?.(characterData);
  }, [name, description, role, gender, age, personality, appearance, clothing, character, onSave]);

  // 生成角色描述
  const handleGenerate = useCallback(() => {
    const roleLabel = CHARACTER_ROLES.find((r) => r.value === role)?.label ?? role;
    const genderLabel = GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? gender;

    const prompt = `角色名称：${name}
角色定位：${roleLabel}
性别：${genderLabel}
年龄：${age || '未设定'}
性格特征：${personality || '未设定'}
外观描述：${appearance.features?.join('、') || '未设定'}`;

    onGenerate?.(prompt);
  }, [name, role, gender, age, personality, appearance, onGenerate]);

  // 计算是否可以保存
  const canSave = useMemo(() => name.trim().length > 0, [name]);

  return (
    <div className={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{character ? '编辑角色' : '创建角色'}</span>
            <div className="flex gap-2">
              {onGenerate && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleGenerate}>
                        <Wand2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI 生成角色描述</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="appearance">外观</TabsTrigger>
              <TabsTrigger value="clothing">服装</TabsTrigger>
              <TabsTrigger value="personality">性格</TabsTrigger>
            </TabsList>

            {/* 基本信息 */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">角色名称</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="输入角色名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">角色定位</Label>
                  <SelectField
                    id="role"
                    value={role}
                    onChange={(value) => setRole(value as Character['role'])}
                    options={CHARACTER_ROLES}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">性别</Label>
                  <SelectField
                    id="gender"
                    value={gender}
                    onChange={setGender}
                    options={GENDER_OPTIONS}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">年龄</Label>
                  <Input
                    id="age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="输入年龄"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">角色描述</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述角色的背景故事、特点等"
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* 外观 */}
            <TabsContent value="appearance" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hairColor">发色</Label>
                  <div className="flex gap-2">
                    <Input
                      id="hairColor"
                      type="color"
                      value={appearance.hairColor ?? '#000000'}
                      onChange={(e) => updateAppearance('hairColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={appearance.hairColor ?? '#000000'}
                      onChange={(e) => updateAppearance('hairColor', e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eyeColor">瞳色</Label>
                  <div className="flex gap-2">
                    <Input
                      id="eyeColor"
                      type="color"
                      value={appearance.eyeColor ?? '#000000'}
                      onChange={(e) => updateAppearance('eyeColor', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={appearance.eyeColor ?? '#000000'}
                      onChange={(e) => updateAppearance('eyeColor', e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skinTone">肤色</Label>
                  <div className="flex gap-2">
                    <Input
                      id="skinTone"
                      type="color"
                      value={appearance.skinTone ?? '#F5D6BA'}
                      onChange={(e) => updateAppearance('skinTone', e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={appearance.skinTone ?? '#F5D6BA'}
                      onChange={(e) => updateAppearance('skinTone', e.target.value)}
                      placeholder="#F5D6BA"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">身高</Label>
                  <Select
                    value={String(appearance.height ?? 'average')}
                    onValueChange={(value) => updateAppearance('height', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">矮</SelectItem>
                      <SelectItem value="average">中等</SelectItem>
                      <SelectItem value="tall">高</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyType">体型</Label>
                  <Select
                    value={appearance.bodyType ?? 'average'}
                    onValueChange={(value) => updateAppearance('bodyType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slim">纤细</SelectItem>
                      <SelectItem value="average">中等</SelectItem>
                      <SelectItem value="athletic">健壮</SelectItem>
                      <SelectItem value="heavy">丰满</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">外观特征</Label>
                <Textarea
                  id="features"
                  value={appearance.features?.join('\n') ?? ''}
                  onChange={(e) =>
                    updateAppearance('features', e.target.value.split('\n').filter(Boolean))
                  }
                  placeholder="每行输入一个特征"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* 服装 */}
            <TabsContent value="clothing" className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>服装列表</Label>
                <Button variant="outline" size="sm" onClick={addClothing}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加服装
                </Button>
              </div>

              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {clothing.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      暂无服装，点击上方按钮添加
                    </div>
                  ) : (
                    clothing.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                              <Select
                                value={item.type}
                                onValueChange={(value) =>
                                  updateClothing(index, { type: value as ClothingItem['type'] })
                                }
                              >
                                <SelectTrigger>
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
                              <Input
                                placeholder="服装名称"
                                value={item.name}
                                onChange={(e) => updateClothing(index, { name: e.target.value })}
                              />
                              <Input
                                placeholder="风格"
                                value={item.style}
                                onChange={(e) => updateClothing(index, { style: e.target.value })}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="color"
                                value={item.color}
                                onChange={(e) => updateClothing(index, { color: e.target.value })}
                                className="w-12 h-10 p-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeClothing(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* 性格 */}
            <TabsContent value="personality" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="personality">性格特征</Label>
                <Textarea
                  id="personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  placeholder="描述角色的性格特征"
                  rows={4}
                />
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-4" />

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                取消
              </Button>
            )}
            <Button onClick={handleSave} disabled={!canSave}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CharacterDesigner;
