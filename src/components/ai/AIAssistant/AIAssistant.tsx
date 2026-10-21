/**
 * AIAssistant — AI助手（Presenter 层）
 *
 * 职责：
 * - 调用 useAIAssistant 获取所有状态和操作
 * - 渲染 JSX UI
 * - 无任何业务逻辑
 *
 * 原始 611 行 → 拆分后 ~250 行
 */

import {
  Bot,
  Send,
  Scissors,
  Radio,
  Lightbulb,
  Zap,
  FlaskConical,
  CircleQuestionMark as HelpCircle,
  Languages,
} from 'lucide-react';
import { useState } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Text, Title, Paragraph } from '@/components/ui/typography';

import { ProgressStatus } from '../ProgressStatus/ProgressStatus';

import styles from './AIAssistant.module.less';
import { EnhanceOptionCard } from './EnhanceOptionCard';
import { useAIAssistant } from './hooks/useAIAssistant';
import { OptionSlider } from './OptionSlider';
import type { ChatMessage } from './types/ai-assistant-entities';

// ========== 子组件 ==========

interface CollapsibleProps {
  header: React.ReactNode;
  children: React.ReactNode;
  ghost?: boolean;
  className?: string;
}

function Collapsible({ header, children, ghost, className }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`${ghost ? '' : 'border rounded-md'} ${className || ''}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors hover:underline ${ghost ? '' : 'bg-background'}`}
      >
        <span>{header}</span>
        <span className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="px-4 pb-4 text-sm">{children}</div>}
    </div>
  );
}

// ========== 主组件 ==========

function AIAssistant() {
  const state = useAIAssistant();

  const {
    activeTab,
    prompt,
    messages,
    selectedModel,
    selectedLang,
    subtitleFormat,
    autoSegment,
    filterFiller,
    precision,
    translateLang,
    smartCutMode,
    targetDuration,
    removeSilence,
    optimizeTransition,
    keyContentPriority,
    sceneSensitivity,
    processing,
    progress,
    setActiveTab,
    setPrompt,
    sendMessage,
    handleKeyPress,
    setSelectedModel,
    generateSubtitles,
    setSelectedLang,
    setSubtitleFormat,
    setAutoSegment,
    setFilterFiller,
    setPrecision,
    setTranslateLang,
    smartCut,
    setSmartCutMode,
    setTargetDuration,
    setRemoveSilence,
    setOptimizeTransition,
    setKeyContentPriority,
    setSceneSensitivity,
  } = state;

  const models = [
    { id: 'gpt-4o', name: 'GPT-4o (通用)', provider: 'openai' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus (高精度)', provider: 'anthropic' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (多模态)', provider: 'google' },
    { id: 'ernie-4.0', name: '文心一言 (中文优化)', provider: 'baidu' },
  ];

  const languages = [
    { code: 'zh', name: '中文' },
    { code: 'en', name: '英语' },
    { code: 'ja', name: '日语' },
    { code: 'ko', name: '韩语' },
    { code: 'fr', name: '法语' },
    { code: 'de', name: '德语' },
    { code: 'es', name: '西班牙语' },
    { code: 'ru', name: '俄语' },
  ];

  // 渲染聊天消息
  const renderMessages = () =>
    messages.map((message: ChatMessage, index: number) => (
      <div
        key={index}
        className={`${styles.message} ${message.role === 'ai' ? styles.aiMessage : styles.userMessage}`}
      >
        <div className={styles.messageAvatar}>
          {message.role === 'ai' ? (
            <Avatar className={styles.aiAvatar}>
              <Bot size={20} />
            </Avatar>
          ) : (
            <Avatar
              className={styles.userAvatar}
              style={{
                backgroundColor: '#1890ff',
                color: '#fff',
              }}
            >
              U
            </Avatar>
          )}
        </div>
        <div className={styles.messageContent}>
          <div className={styles.messageText}>{message.content}</div>
          <div className={styles.messageTime}>{new Date(message.time).toLocaleTimeString()}</div>
        </div>
      </div>
    ));

  return (
    <TooltipProvider>
      <div className={styles.aiAssistantContainer}>
        <div className={styles.aiHeader}>
          <Title level={4} className={styles.aiTitle}>
            <Bot className={styles.aiIcon} /> AI助手
          </Title>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className={styles.aiTabs}
        >
          <TabsList>
            <TabsTrigger value="chat">智能对话</TabsTrigger>
            <TabsTrigger value="subtitles">字幕生成</TabsTrigger>
            <TabsTrigger value="smartcut">智能剪辑</TabsTrigger>
            <TabsTrigger value="enhance">视频增强</TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            <div className={styles.chatContainer}>
              <div className={styles.chatMessages}>{renderMessages()}</div>

              <div className={styles.chatInput}>
                <div className={styles.modelSelector}>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger style={{ width: '100%' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="请描述您需要的帮助..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyPress}
                  rows={1}
                  disabled={processing}
                  className="resize-none"
                />
                <Button
                  variant="default"
                  onClick={sendMessage}
                  disabled={!prompt.trim() || processing}
                  className={styles.sendButton}
                >
                  <Send />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subtitles">
            <div className={styles.toolContainer}>
              <Card className={styles.toolCard}>
                <CardHeader>
                  <CardTitle>自动生成字幕</CardTitle>
                </CardHeader>
                <CardContent>
                  <Paragraph className={styles.toolDescription}>
                    使用AI识别视频中的语音内容,自动生成字幕并添加到时间轴
                  </Paragraph>

                  <div className={styles.toolOptions}>
                    <div className={styles.optionItem}>
                      <Text>识别语言</Text>
                      <Select value={selectedLang} onValueChange={setSelectedLang}>
                        <SelectTrigger style={{ width: '100%' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={styles.optionItem}>
                      <Text>字幕格式</Text>
                      <Select
                        value={subtitleFormat}
                        onValueChange={(v) => setSubtitleFormat(v as typeof subtitleFormat)}
                      >
                        <SelectTrigger style={{ width: '100%' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="srt">SRT</SelectItem>
                          <SelectItem value="vtt">VTT</SelectItem>
                          <SelectItem value="ass">ASS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={styles.optionItem}>
                      <div className={styles.switchOption}>
                        <Switch checked={autoSegment} onCheckedChange={setAutoSegment} />
                        <Text>自动分段</Text>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle />
                          </TooltipTrigger>
                          <TooltipContent>根据语义自动将字幕分成多个段落</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className={styles.optionItem}>
                      <div className={styles.switchOption}>
                        <Switch checked={filterFiller} onCheckedChange={setFilterFiller} />
                        <Text>过滤语气词</Text>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle />
                          </TooltipTrigger>
                          <TooltipContent>移除'嗯'、'啊'等语气词,使字幕更加清晰</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="default"
                    onClick={generateSubtitles}
                    disabled={processing}
                    className="w-full mt-4"
                  >
                    <Languages />
                    {processing && activeTab === 'subtitles' ? '生成中...' : '开始生成字幕'}
                  </Button>

                  {processing && activeTab === 'subtitles' && (
                    <ProgressStatus
                      progress={progress}
                      stages={[
                        '正在分析音频...',
                        '识别语音内容...',
                        '生成字幕文件...',
                        '完成中...',
                      ]}
                      containerClass={styles.progressContainer}
                      statusClass={styles.progressStatus}
                    />
                  )}
                </CardContent>
              </Card>

              <Collapsible header="高级选项" ghost className={styles.extraOptions}>
                <div className={styles.advancedOptions}>
                  <OptionSlider
                    label="识别精度"
                    value={precision}
                    onValueChange={setPrecision}
                    scaleLabels={['快速', '标准', '高精度']}
                  />

                  <div className={styles.optionItem}>
                    <Text>翻译字幕</Text>
                    <Select value={translateLang} onValueChange={setTranslateLang}>
                      <SelectTrigger style={{ width: '100%' }}>
                        <SelectValue placeholder="选择目标语言(可选)" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages
                          .filter((lang) => lang.code !== 'zh')
                          .map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Collapsible>
            </div>
          </TabsContent>

          <TabsContent value="smartcut">
            <div className={styles.toolContainer}>
              <Card className={styles.toolCard}>
                <CardHeader>
                  <CardTitle>智能剪辑</CardTitle>
                </CardHeader>
                <CardContent>
                  <Paragraph className={styles.toolDescription}>
                    AI分析视频内容,自动移除不需要的部分,保留精华片段
                  </Paragraph>

                  <div className={styles.toolOptions}>
                    <div className={styles.optionItem}>
                      <Text>剪辑模式</Text>
                      <Select
                        value={smartCutMode}
                        onValueChange={(v) => setSmartCutMode(v as typeof smartCutMode)}
                      >
                        <SelectTrigger style={{ width: '100%' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="content">内容优先</SelectItem>
                          <SelectItem value="pace">节奏优先</SelectItem>
                          <SelectItem value="compact">精简模式</SelectItem>
                          <SelectItem value="highlight">亮点提取</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={styles.optionItem}>
                      <Text>目标时长</Text>
                      <Select
                        value={targetDuration}
                        onValueChange={(v) => setTargetDuration(v as typeof targetDuration)}
                      >
                        <SelectTrigger style={{ width: '100%' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">自动优化</SelectItem>
                          <SelectItem value="30">30秒</SelectItem>
                          <SelectItem value="60">1分钟</SelectItem>
                          <SelectItem value="120">2分钟</SelectItem>
                          <SelectItem value="custom">自定义</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={styles.optionItem}>
                      <div className={styles.switchOption}>
                        <Switch checked={removeSilence} onCheckedChange={setRemoveSilence} />
                        <Text>移除沉默</Text>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle />
                          </TooltipTrigger>
                          <TooltipContent>自动检测并移除视频中的沉默部分</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    <div className={styles.optionItem}>
                      <div className={styles.switchOption}>
                        <Switch
                          checked={optimizeTransition}
                          onCheckedChange={setOptimizeTransition}
                        />
                        <Text>优化转场</Text>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle />
                          </TooltipTrigger>
                          <TooltipContent>在剪辑点添加平滑转场效果</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="default"
                    onClick={smartCut}
                    disabled={processing}
                    className="w-full mt-4"
                  >
                    <Scissors />
                    {processing && activeTab === 'smartcut' ? '剪辑中...' : '开始智能剪辑'}
                  </Button>

                  {processing && activeTab === 'smartcut' && (
                    <ProgressStatus
                      progress={progress}
                      stages={['分析视频内容...', '识别关键片段...', '优化剪辑点...', '完成中...']}
                      containerClass={styles.progressContainer}
                      statusClass={styles.progressStatus}
                    />
                  )}
                </CardContent>
              </Card>

              <Collapsible header="高级选项" ghost className={styles.extraOptions}>
                <div className={styles.advancedOptions}>
                  <OptionSlider
                    label="关键内容优先级"
                    value={keyContentPriority}
                    onValueChange={setKeyContentPriority}
                    scaleLabels={['低', '中', '高']}
                  />

                  <OptionSlider
                    label="场景检测灵敏度"
                    value={sceneSensitivity}
                    onValueChange={setSceneSensitivity}
                    scaleLabels={['低', '中', '高']}
                  />
                </div>
              </Collapsible>
            </div>
          </TabsContent>

          <TabsContent value="enhance">
            <div className={styles.toolContainer}>
              <Card className={styles.toolCard}>
                <CardHeader>
                  <CardTitle>视频增强</CardTitle>
                </CardHeader>
                <CardContent>
                  <Paragraph className={styles.toolDescription}>
                    AI提升视频质量,修复问题并应用智能效果
                  </Paragraph>

                  <div className={styles.enhanceOptions}>
                    <EnhanceOptionCard
                      icon={<Zap />}
                      title="画质提升"
                      description="提升清晰度和细节"
                    />
                    <EnhanceOptionCard
                      icon={<Lightbulb />}
                      title="色彩优化"
                      description="改善对比度和饱和度"
                    />
                    <EnhanceOptionCard
                      icon={<Radio />}
                      title="音频降噪"
                      description="移除背景噪音"
                    />
                    <EnhanceOptionCard
                      icon={<FlaskConical />}
                      title="智能特效"
                      description="应用AI生成的特效"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

export default AIAssistant;

// Re-export types for backward compatibility
export type { ChatMessage } from './types/ai-assistant-entities';
