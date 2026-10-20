# 部署文档

> 构建、发布、环境配置

## 构建发布

```bash
# 构建桌面端
pnpm tauri build

# 输出
# macOS: src-tauri/target/release/bundle/macos/Kineo.app
# Windows: src-tauri/target/release/bundle/msi/Kineo_x64.msi
# Linux: src-tauri/target/release/bundle/appimage/Story_Weaver.AppImage
```

## 环境变量

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
ZHIPU_API_KEY=...
```

## Docker 开发环境

```bash
docker compose up -d
```

[完整部署详情 →](https://v2.tauri.app/start/)"
