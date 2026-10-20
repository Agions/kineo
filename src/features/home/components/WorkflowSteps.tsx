import { FileInput, FileText, Layers, User, Mic2, Download } from 'lucide-react';
import React from 'react';

import { Card, CardContent } from '@/common/components/ui/card';
import { useTheme } from '@/common/context/ThemeContext';

import styles from './WorkflowSteps.module.less';

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: <FileInput className="h-5 w-5" />,
    title: '导入内容',
    description: '上传小说、剧本或输入提示词，AI 自动解析结构',
  },
  {
    number: 2,
    icon: <FileText className="h-5 w-5" />,
    title: '生成剧本',
    description: '大模型理解内容，输出结构化分镜脚本',
  },
  {
    number: 3,
    icon: <Layers className="h-5 w-5" />,
    title: 'AI 分镜',
    description: '根据剧本生成分镜图，支持写实、动漫、水墨多种风格',
  },
  {
    number: 4,
    icon: <User className="h-5 w-5" />,
    title: '角色设计',
    description: '种子机制确保多场景角色外观一致性',
  },
  {
    number: 5,
    icon: <Mic2 className="h-5 w-5" />,
    title: '语音合成',
    description: 'TTS 唇形同步，支持多语言和情感合成',
  },
  {
    number: 6,
    icon: <Download className="h-5 w-5" />,
    title: '导出成片',
    description: 'MP4/WebM/MOV 多格式输出，2K 直出 + 4K 增强',
  },
];

/**
 * 工作流程步骤组件
 * 展示 Kineo (Kineo AI) 完整创作流程
 */
const WorkflowSteps = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={styles.workflow}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.titleIcon}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 8h12M8 2l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        创作流程
      </h3>
      <div className={styles.steps}>
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <Card className={`${styles.stepCard} ${isDarkMode ? styles.darkCard : ''}`}>
              <CardContent className="text-center p-5">
                <div className={styles.stepNumber}>{step.number}</div>
                <div className={`${styles.stepIcon} ${isDarkMode ? styles.darkIcon : ''}`}>
                  {step.icon}
                </div>
                <h4
                  className={`mb-1.5 font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </CardContent>
            </Card>
            {index < steps.length - 1 && (
              <div className={styles.connector}>
                <svg
                  width="20"
                  height="12"
                  viewBox="0 0 20 12"
                  fill="none"
                  className={styles.connectorSvg}
                >
                  <path
                    d="M0 6h18M14 1l4 5-4 5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WorkflowSteps;
