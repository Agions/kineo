# Kineo 开发指南

## 项目概述

Kineo 是 AI 驱动的 **AI 漫剧创作平台**，输入一本小说，AI 自动把它拍成一部漫剧。基于 Tauri 2.1 + Rust 桌面端，集成多模型 AI（GLM-5 / M2.5 / Kimi / Seedream / Kling / Vidu / Edge TTS）实现端到端自动化。

## 技术栈

- **前端框架**：React 19 · TypeScript 5 · Vite 6
- **UI 组件**：shadcn/ui (Radix UI + Tailwind CSS)
- **状态管理**：Zustand
- **桌面端**：Tauri 2.1 (Rust)
- **动画**：Framer Motion
- **国际化**：i18next
- **测试**：Jest · React Testing Library

## 项目分层架构

Kineo 采用严格的 **downward dependency（向下依赖）** 架构：

```
app（应用入口 + 路由 + Providers）
  └─▶ pages（页面级容器）
       └─▶ components（业务/媒体组件）
            ├─▶ features（垂直切片，可选）
            └─▶ shared（UI 基元 + stores + utils + types）
                 └─▶ types（全局类型定义）

core/services（领域服务：AI/音频/视频/项目/流水线）
core/pipeline（漫剧流水线引擎 + 步骤）
core/ai/providers（多模型策略层）
core（config/constants/data/hooks/utils/domains）

infrastructure（平台桥接：tauri-bridge/queue/telemetry）
```

**铁律：只能向下依赖。** 禁止反向引用（如 `core/*` → `components/`）。

## 核心架构原则

- **依赖方向唯一性**：`app → pages → components/features → core/services → core → common → types`，禁止反向依赖
- **Rust 后端是第一公民**：FFmpeg/文件 I/O/窗口/快捷键/配置全在 Rust，JS/TS 仅做 UI
- **领域驱动分层**：`core/services/` 按 ai/video/audio/pipeline/project/domain 划分
- **Barrel 导出规范**：`index.ts` 仅 `export { }`，禁止混入逻辑
- **Tauri IPC 类型安全**：所有 `#[tauri::command]` 函数返回 `Result<T, String>`，路径必须经过 `validate_input_path` / `validate_output_path` 校验

## 命名规范

| 对象                    | 规范                  | 示例                                            |
| ----------------------- | --------------------- | ----------------------------------------------- |
| 目录名                  | `kebab-case`          | `script-writer/`, `video-export/`               |
| 非组件文件（.ts）       | `kebab-case`          | `ai-provider-registry.ts`, `pipeline-engine.ts` |
| React 组件文件（.tsx）  | `PascalCase`          | `HomePage.tsx`, `StepExport.tsx`                |
| 变量 / 函数             | `camelCase`           | `generateSceneId`, `useProjectStore`            |
| 类 / 接口 / 类型 / 枚举 | `PascalCase`          | `PipelineEngine`, `AIProvider`                  |
| 编译期常量 / 枚举值     | `UPPER_CASE`          | `MAX_RETRIES`, `API_TIMEOUT_MS`                 |
| 测试文件                | `<target>.test.ts(x)` | `provider-registry.test.ts`                     |

> **注意**：拒绝 `snake_case`。项目采用 React 19 + Vite + Tauri + Radix 技术栈，整套工具链以 camelCase/kebab/PascalCase 为默认。

## 依赖方向规则（禁止边）

以下依赖方向**禁止**：

| 禁止边（from → to）                                               | 理由                                                  |
| ----------------------------------------------------------------- | ----------------------------------------------------- |
| `core/*` → `components/`、`pages/`、`app/`                        | 核心层不得反向依赖 UI                                 |
| `shared/*` → `core/services/*`、`pages/*`、`components/*`、`app/` | shared 是基座，只依赖 `types/*` 与自身                |
| `core/services/*` → `app/`、`pages/`、`components/`               | 领域服务不得依赖 UI                                   |
| 任意文件 → `infrastructure/ai/providers/*`                        | 该目录已删除（死代码）                                |
| 任意文件 → `shared/utils/general`                                 | 该文件已删除，改从 `@/shared/utils` 桶消费            |
| `features/*` → 其它 `features/*` 的内部实现                       | feature 间只允许通过 `core/services` 或 `shared` 协作 |
| 经 `./` 桶自引用的"同居导出"                                      | 禁止在 barrel 中 re-export 又会从同 barrel 导入的模块 |

**校验方式**：CI 加入 `madge --circular`（必须为 0）与 `dependency-cruiser` 守护上述禁止边。

## 代码简化原则

1. **单一职责 + 合理粒度**：一个文件聚合同一关注点的实现，避免"一函数一文件"；文件 >250 行且无逻辑分割时才考虑拆分。
2. **无冗余抽象**：禁止"转发门面"层（re-export 不含逻辑）；新增模块不得新建与 `core/*` 并行的第二套抽象。
3. **不写多余代码**：删除 `@deprecated`、未使用的导出（`knip` 守护）、TODO 占位空实现。
4. **引用最短路径**：消费 utils 一律走 `@/shared/utils` 桶，不穿透到中间桶。
5. **配置即文档**：命名/依赖方向用 ESLint + dependency-cruiser 强制，不靠口头约定。

## features/ 垂直切片约定

`features/` 目录用于承载**业务能力垂直切片**，每个切片自包含：

```
src/features/
  script-writer/        # ① 剧本生成
  storyboard/           # ② 分镜设计
  character-consistency/# ② 角色一致性锚点/角色DNA
  asset-library/        # ③ 图片素材库
  tts-dubbing/          # ⑤ 配音/TTS
  video-export/         # ④⑤ AI视频生成+后期剪辑+发布
```

**约定**：

- 每个切片只通过 `core/services` 或 `shared` 与横向引擎交互
- 切片间不得直接 import 对方的内部实现
- 切片入口为 `index.ts`，导出 `*FeatureService` 对象

## 错误处理约定

- 统一使用 `ServiceError`（来自 `base-ai-service`）
- 禁止散落 try/catch 吞错
- 异步函数必须返回 `Promise<T>`，禁止静默失败

## ID 生成约定

统一使用 `shared/utils/data.ts` 的 `generate*Id` 函数，禁止各模块自造 ID 函数。

## 状态管理约定

- zustand store 放 `shared/stores`，按 domain 切片
- 页面局部状态用 Context selector（如 `useStepExportContext`）
- 禁止在 `core/*` 中引入 React hooks

## 流水线约定

- 新增漫剧环节 = 加 1 个 `step-*.ts` + 注册进 `PipelineEngine`
- 质量门接入 `QualityGate`
- 步骤实现继承 `BasePipelineStep`，实现 `execute()` 方法

## 开发指南

```
Kineo/
├── src/                          # 前端 UI 层（React + Tauri API 包装）
│   ├── features/                 # 14 个 Feature 模块（DDD 风格）
│   │   ├── ai/                   # AI 模型选择
│   │   ├── audio/                # 音频编辑
│   │   ├── auto-pipeline/        # 自主流水线
│   │   ├── character/            # 角色设计
│   │   ├── cost/                 # 成本追踪
│   │   ├── editor/               # 可视化编辑器（Timeline）
│   │   ├── export/               # 导出功能
│   │   ├── home/                 # 首页
│   │   ├── manga-pipeline/       # 漫剧流水线 (核心)
│   │   ├── notification/         # 通知系统
│   │   ├── project/              # 项目管理
│   │   ├── script/               # 脚本生成
│   │   ├── storyboard/           # 分镜编辑
│   │   ├── subtitle/             # 字幕编辑
│   │   ├── video/                # 视频播放
│   │   └── video-export/         # 视频导出
│   ├── shared/                   # 跨域共享
│   │   ├── components/           # 可复用 UI 组件 (业务 + ui)
│   │   ├── hooks/                # 可复用 React Hooks
│   │   ├── services/             # 存储、API 客户端
│   │   ├── stores/               # Zustand 状态存储（5 个全局 Store）
│   │   ├── types/                # 共享类型
│   │   └── utils/                # 工具函数
│   ├── core/                     # 核心服务
│   │   ├── pipeline/             # 10 步流水线引擎 + PipelineEngine + AsyncStepChain
│   │   ├── autonomous/           # 自主编排层 (AutoPipelineEngine)
│   │   ├── services/             # AI/视频/音频服务（6 领域子目录）
│   │   ├── hooks/                # 核心 Hooks
│   │   ├── config/               # 运行时配置 (app.config / optimization.config)
│   │   └── types/                # 核心类型
│   ├── pages/                    # 路由级页面
│   ├── infrastructure/           # Tauri IPC 桥接 + telemetry
│   └── main.tsx                  # React 入口
├── packages/                     # Monorepo 子包
│   ├── core/                     # 领域核心（pipeline / autonomous / types）
│   │   ├── autonomous/evaluator/ # QualityGate + SelfReviewLoop
│   │   └── types/                # PipelineCheckpoint / StepState
│   └── common/                   # 基础类型/工具（无副作用）
├── src-tauri/                    # Tauri 桌面端（Rust 第一公民）
│   ├── src/commands/             # 21 个 Tauri Commands（按域路由）
│   │   ├── video.rs              # FFmpeg 视频
│   │   ├── app.rs                # 窗口/设置
│   │   ├── file.rs               # 文件/项目
│   │   └── shortcuts.rs          # 全局快捷键
│   ├── src/services/             # FFmpeg/视频/配置业务逻辑
│   ├── src/models/               # Rust 数据模型
│   ├── src/utils/                # 路径验证/ID 生成/FFPS 解析
│   └── src/constants/            # 允许目录白名单
├── docs/                         # VitePress 文档站
│   ├── api/                      # API 参考
│   ├── performance/              # 性能基准报告
│   ├── developer-guide/          # 架构/项目结构/服务
│   ├── getting-started/          # 5 分钟启动/配置
│   ├── user-guide/               # 工作流说明
│   └── deployment/               # 构建/环境/Docker
├── e2e/                          # Playwright E2E 测试
├── assets/                       # 品牌资源（logo 系统）
├── public/                       # Vite 静态资源
└── scripts/                      # 构建脚本
```

## 核心架构原则

- **依赖方向唯一性**：`packages/common → packages/core → src`，禁止反向依赖
- **Rust 后端是第一公民**：FFmpeg/文件 I/O/窗口/快捷键/配置全在 Rust，JS/TS 仅做 UI
- **领域驱动分层**：`core/services/` 按 ai/video/audio/pipeline/project/domain 划分
- **Barrel 导出规范**：`index.ts` 仅 `export { }`，禁止混入逻辑
- **Tauri IPC 类型安全**：所有 `#[tauri::command]` 函数返回 `Result<T, String>`，路径必须经过 `validate_input_path` / `validate_output_path` 校验

## 开发指南

### 添加新服务

1. 在对应的子目录创建服务文件（按 DDD 领域划分）：
   - AI 文本：`src/core/services/ai/text/`
   - AI 图像/视频：`src/core/services/ai/image/`
   - 视频处理：`src/core/services/video/`
   - 音频/TTS：`src/core/services/audio/`
   - Pipeline：`src/core/services/pipeline/`
   - 项目/导出：`src/core/services/project/`
   - 领域业务：`src/core/services/domain/`
2. 使用单例模式导出
3. 在 `src/core/services/index.ts` 的对应子域 barrel 中导出

```typescript
// src/core/services/ai/text/example.service.ts
class ExampleService {
  private static instance: ExampleService;

  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }
}

export const exampleService = ExampleService.getInstance();
```

### 添加新状态

1. 在 `src/common/stores/` 创建 store 文件
2. 使用 Zustand 的 persist 中间件
3. 配置防抖存储以优化性能

```typescript
// src/common/stores/example.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ExampleState {
  data: string;
  setData: (data: string) => void;
}

export const useExampleStore = create<ExampleState>()(
  persist(
    (set) => ({
      data: '',
      setData: (data) => set({ data }),
    }),
    {
      name: 'example-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### 添加新组件

1. UI 基元组件放入 `src/common/components/ui/`（PascalCase.tsx 命名）
2. Feature 业务组件放入对应 `src/features/<feature>/components/`
3. 通过 `cn()` 工具合并 className

```typescript
// src/common/components/ui/example.tsx
import { cn } from '@/common/utils/class-names';

interface ExampleProps {
  className?: string;
  children?: React.ReactNode;
}

export function Example({ className, children }: ExampleProps) {
  return <div className={cn('some-class', className)}>{children}</div>;
}
```

### 添加新特性（features/ 切片）

1. 在 `src/features/` 下新建目录（kebab-case）
2. 创建 `index.ts` 作为切片入口
3. 切片只能通过 `core/services` 或 `shared` 与横向引擎交互
4. 导出 `*FeatureService` 对象

```typescript
// src/features/my-feature/index.ts
export const myFeatureService = {
  // feature-level business logic
};

export default myFeatureService;
```

## 质量门禁

合并 PR 前必须运行以下命令，且全部通过：

```bash
# 类型检查
pnpm exec tsc --noEmit

# 测试
pnpm test

# 循环依赖（必须为 0）
pnpm exec madge --circular --extensions ts,tsx src

# 未用导出
pnpm exec knip

# 代码重复率
pnpm exec jscpd src --pattern '**/*.{ts,tsx}' --min-tokens 50
```

## 命令

```bash
# 开发模式
pnpm dev

# 生产构建
pnpm build

# 类型检查
pnpm build:check

# 运行测试
pnpm test

# 快速测试（含覆盖率）
pnpm test:fast

# 监听模式
pnpm test:watch

# 构建 Tauri 桌面应用
pnpm tauri build

# 代码检查
pnpm lint

# 自动修复代码检查问题
pnpm lint:fix

# 构建文档
pnpm docs:vp:build

# 开发文档
pnpm docs:vp:dev
```

## AI 服务使用

```typescript
import { aiService } from '@/core/services';

// 文本生成
const result = await aiService.generate('写一段戏剧性场景', {
  provider: 'minimax',
  model: 'M2.5',
  maxTokens: 1000,
});
console.log(result.content);

// 多轮对话
const chatResult = await aiService.chat(messages, {
  provider: 'minimax',
  model: 'M2.5',
});
```

## 测试

- 使用 TypeScript 严格模式
- 使用函数式组件 + Hooks
- 遵循 React 组件拆分原则
- 使用 ESLint + Prettier 格式化

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 类型

| Type       | Description              |
| ---------- | ------------------------ |
| `feat`     | 新功能                   |
| `fix`      | Bug 修复                 |
| `docs`     | 文档变更                 |
| `style`    | 代码格式化（无逻辑变更） |
| `refactor` | 代码重构                 |
| `perf`     | 性能改进                 |
| `test`     | 添加或更新测试           |
| `build`    | 构建系统变更             |
| `ci`       | CI/CD 配置变更           |
| `chore`    | 其他变更                 |

### 示例

```bash
# 新功能
git commit -m "feat(editor): add video preview functionality"

# Bug 修复
git commit -m "fix(workflow): resolve pipeline cancellation issue"

# 文档
git commit -m "docs(readme): update installation instructions"

# 重构
git commit -m "refactor(services): extract common retry logic"
```
