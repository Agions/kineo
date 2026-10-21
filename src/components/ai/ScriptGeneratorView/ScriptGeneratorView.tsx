import { useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Space } from '@/components/ui/space';
import NovelImporter from '@/features/storyboard/components/NovelImporter';
import type { ScriptImportMetadata } from '@/features/storyboard/components/NovelImporter';

import ScriptGenerator from '../ScriptGenerator/ScriptGenerator';

import styles from './ScriptGeneratorView.module.less';

/**
 * 脚本生成视图组件
 * 组合 NovelImporter 和 ScriptGenerator
 */
const ScriptGeneratorView = () => {
  const [novelMetadata, setNovelMetadata] = useState<ScriptImportMetadata | null>(null);
  const [isGenerating, _setIsGenerating] = useState(false);

  const handleNovelImport = (metadata: ScriptImportMetadata) => {
    setNovelMetadata(metadata);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>脚本生成</h2>
        <p>从小说导入并生成视频脚本</p>
      </div>

      <Space direction="vertical" size="large" className={styles.content}>
        <Card title="导入小说">
          <NovelImporter onContentLoad={(_content, metadata) => handleNovelImport(metadata)} />
        </Card>

        {novelMetadata && (
          <Card title="生成脚本">
            {isGenerating && <Alert>正在生成脚本...</Alert>}
            <ScriptGenerator projectId={undefined} onGenerate={undefined} onSave={undefined} />
          </Card>
        )}
      </Space>
    </div>
  );
};

export default ScriptGeneratorView;
