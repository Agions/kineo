import { Brain, Sparkles, Users, Mic2, Download, Shield } from 'lucide-react';
import React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/common/context/ThemeContext';
import { theme } from '@/styles/theme';

import styles from './Features.module.less';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  tag?: string;
}

const featureList: Feature[] = [
  {
    icon: <Brain className="h-6 w-6" />,
    title: '多模型 AI',
    description:
      '支持 Qwen 3.8-Max、DeepSeek-V4-Flash、GPT-5.6 Sol、Claude Opus 5、Kimi K3、Seedance 2.5 等 2026 年 8 月最新发版大模型与视听引擎',
    color: theme.colors.primary,
    tag: 'GLM · Kimi · M2.5',
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: '视觉风格',
    description: '分镜支持写实、动漫、水墨等多种视觉风格一键切换',
    color: theme.colors.secondary,
    tag: '写实 · 动漫 · 水墨',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: '角色一致性',
    description: '种子机制确保多场景角色外观一致，批量生成统一形象',
    color: theme.colors.accent,
    tag: '种子 · 批次',
  },
  {
    icon: <Mic2 className="h-6 w-6" />,
    title: '唇形同步',
    description: 'TTS 语音与视频帧级对齐，支持多语言配音和情感合成',
    color: theme.colors.warning,
    tag: 'TTS · 情感',
  },
  {
    icon: <Download className="h-6 w-6" />,
    title: '多格式导出',
    description: 'MP4/WebM/MOV 多格式输出，2K 直出 + 4K 增强模式',
    color: theme.colors.success,
    tag: '2K · 4K',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: '本地优先',
    description: '基于 Tauri 构建，原生桌面体验，数据完全本地存储',
    color: '#8b5cf6', // 【v3.3】AI 节点分类色（与 workflow 节点定义保持一致）
    tag: 'Tauri · 本地',
  },
];

/**
 * 功能展示组件
 * 展示 Kineo (Kineo AI) 核心功能特性
 */
const Features = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={styles.features}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.titleIcon}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1l1.5 3.5L12 5l-2.5 2.5.5 3.5L7 9.5 4 11l.5-3.5L2 5l3.5-.5L7 1z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        核心能力
      </h3>
      <div className={styles.grid}>
        {featureList.map((feature, index) => (
          <Card
            key={index}
            className={`${styles.featureCard} ${isDarkMode ? styles.darkCard : ''}`}
          >
            <CardContent className="p-5">
              <div
                className={styles.iconWrapper}
                style={{ '--accent': feature.color } as React.CSSProperties}
              >
                <div className={styles.featureIcon} style={{ color: feature.color }}>
                  {feature.icon}
                </div>
              </div>
              <h4 className={styles.featureTitle}>{feature.title}</h4>
              <p className={styles.featureDesc}>{feature.description}</p>
              {feature.tag && <span className={styles.tag}>{feature.tag}</span>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Features;
