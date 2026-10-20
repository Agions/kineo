#!/usr/bin/env bash
# ==============================================================================
# Kineo (Kineo AI) - Standardized Desktop Packaging & Build Script
# Usage: ./scripts/build-desktop.sh [--target macos|windows|linux|all] [--release]
# ==============================================================================

set -eo pipefail

COLOR_RESET="\033[0m"
COLOR_INFO="\033[1;34m"
COLOR_SUCCESS="\033[1;32m"
COLOR_WARN="\033[1;33m"
COLOR_ERROR="\033[1;31m"

log_info() { echo -e "${COLOR_INFO}[INFO] ${1}${COLOR_RESET}"; }
log_success() { echo -e "${COLOR_SUCCESS}[SUCCESS] ${1}${COLOR_RESET}"; }
log_warn() { echo -e "${COLOR_WARN}[WARN] ${1}${COLOR_RESET}"; }
log_error() { echo -e "${COLOR_ERROR}[ERROR] ${1}${COLOR_RESET}"; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

log_info "Kineo (Kineo AI) v0.0.1 桌面端打包构建引擎启动..."
log_info "工作区目录: ${ROOT_DIR}"

# 1. 预检依赖环境
log_info "[1/4] 依赖环境检查..."
command -v node >/dev/null 2>&1 || { log_error "Node.js 未安装"; exit 1; }
command -v cargo >/dev/null 2>&1 || { log_error "Rust / Cargo 未安装"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { log_error "pnpm 未安装"; exit 1; }

NODE_VER=$(node -v)
RUST_VER=$(cargo --version)
log_success "Environment OK: Node ${NODE_VER}, Cargo ${RUST_VER}"

# 2. Rust Workspace 增量校验
log_info "[2/4] 编译 Rust 后端 Crates (kineo-core, kineo-ai, kineo-media, kineo-ipc)..."
cargo check -p kineo-ipc -p kineo-ai -p kineo-media -p kineo-core -p kineo-plugin -p kineo-updater --offline
log_success "Rust Crates 编译校验通过 (0 Errors)"

# 3. 生成安装包使用文档与离线手册 (PDF / Markdown / TXT)
log_info "[3/5] 生成离线用户手册与安装包配套文档..."
pnpm run build:docs
log_success "安装包使用文档编译同步完成"

# 4. 前端 Packages & 主应用构建
log_info "[4/5] 编译前端 Packages & Vite bundle..."
pnpm build:check || pnpm build
log_success "前端应用程序打包完成"

# 5. Tauri v2 桌面原生打包
log_info "[5/5] 启动 Tauri v2 原生桌面端构建..."
pnpm tauri build

BUNDLE_PATH="${ROOT_DIR}/src-tauri/target/release/bundle"
log_success "Kineo 桌面应用打包全量完成！"
log_info "产物路径: ${BUNDLE_PATH}"
