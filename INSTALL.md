# 安装 Kineo (Kineo AI)

## macOS

### 选项一：Homebrew（推荐）

```bash
# 克隆并安装
brew tap Agions/tap https://github.com/Agions/homebrew-tap
brew install --cask kineo
```

### 选项二：下载 DMG

从 [GitHub Releases](https://github.com/Agions/kineo/releases/latest) 下载最新的 `.dmg` 文件，将 `Kineo.app` 拖入 `/Applications`。

### 选项三：安装脚本

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/Agions/kineo/main/scripts/install.sh)"
```

---

## Windows

从 [GitHub Releases](https://github.com/Agions/kineo/releases/latest) 下载最新的 `.exe`（NSIS 安装程序）或 `.msi`，运行即可。

---

## Linux

### Debian / Ubuntu

```bash
curl -sL https://raw.githubusercontent.com/Agions/kineo/main/scripts/install.sh | bash
```

或从 [GitHub Releases](https://github.com/Agions/kineo/releases/latest) 下载 `.deb` 并运行：

```bash
sudo dpkg -i kineo_*.deb
```

### Arch Linux (AUR)

```bash
yay -S kineo
```

---

## 源码构建

```bash
git clone https://github.com/Agions/kineo.git
cd kineo
pnpm install
pnpm tauri build
```

构建产物位于 `src-tauri/target/release/bundle/`。
