---
title: 安装指南
description: Kineo (Kineo AI) 安装指南 — 系统要求 + 安装步骤 + 环境配置
category: getting-started
version: '>=3.0'
---

# Kineo (Kineo AI) 安装指南

> Kineo 是基于 Tauri v2 + React 19 + Rust + Monorepo 构建的现代桌面端漫剧创作平台。

---

## 系统要求

| 平台         | 最低要求                                    | 推荐配置                                    |
| :----------- | :------------------------------------------ | :------------------------------------------ |
| **macOS**    | macOS 12+ (Monterey)，Apple Silicon / Intel | macOS 14+ M1/M2/M3 (Apple Silicon 硬件加速) |
| **Windows**  | Windows 10+ 64-bit (Build 1903)             | Windows 11 + NVIDIA 显卡 (NVENC 硬件加速)   |
| **Linux**    | Ubuntu 22.04+ / Arch Linux / Debian 12+     | Ubuntu 24.04 64-bit                         |
| **内存**     | ≥ 8 GB                                      | ≥ 16 GB                                     |
| **磁盘空间** | ≥ 1 GB 可用空间                             | ≥ 10 GB (用于生成漫剧高帧率视频)            |

---

## 前置依赖

若从源码进行编译开发或打包，需准备以下工具链：

```bash
# 1. Rust 工具链 (≥ 1.80)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Node.js 环境 (≥ 20.0)
nvm install 20
nvm use 20

# 3. pnpm 包管理器 (≥ 10.0)
npm install -g pnpm
```

---

## 安装与运行

### 方式 1：使用二进制桌面安装包

从 [GitHub Releases](https://github.com/Agions/kineo/releases/latest) 下载对应平台安装包：

- **macOS**: 下载 `Kineo.dmg` 拖入 `/Applications`。
- **Windows**: 双击运行 `kineo_x64-setup.exe`。
- **Linux**: 执行 `sudo dpkg -i kineo_amd64.deb`。

### 方式 2：源码本地构建

```bash
# 克隆仓库
git clone https://github.com/Agions/kineo.git
cd kineo

# 安装依赖
pnpm install

# 运行开发桌面端 (Tauri v2 + Vite Dev)
pnpm tauri dev

# 执行全量打包
bash scripts/build-desktop.sh
```
