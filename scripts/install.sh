#!/bin/bash
set -e

REPO="Agions/kineo"
APP_NAME="Kineo"

darwin_install() {
  if command -v brew &> /dev/null; then
    echo "Installing Kineo via Homebrew..."
    brew install --cask $REPO
  else
    echo "Homebrew not found. Installing Kineo directly..."
    LATEST=$(curl -sL https://api.github.com/repos/$REPO/releases/latest | grep -o '"tag_name":.*' | cut -d'"' -f4)
    DMG_URL=$(curl -sL https://api.github.com/repos/$REPO/releases/latest | python3 -c "import sys,json; print([a['browser_download_url'] for a in json.load(sys.stdin)['assets'] if '.dmg' in a['name']][0])")
    TMPFILE="/tmp/Kineo.dmg"
    curl -sL "$DMG_URL" -o "$TMPFILE"
    VOLUME=$(hdiutil attach "$TMPFILE" | grep -o '/Volumes/[^ ]*')
    cp -r "$VOLUME/$APP_NAME.app" /Applications/
    hdiutil detach "$VOLUME" -quiet
    rm "$TMPFILE"
  fi
  echo "FrameFlow installed successfully!"
}

linux_install() {
  LATEST=$(curl -sL https://api.github.com/repos/$REPO/releases/latest | grep -o '"tag_name":.*' | cut -d'"' -f4)
  DEB_URL=$(curl -sL https://api.github.com/repos/$REPO/releases/latest | python3 -c "import sys,json; print([a['browser_download_url'] for a in json.load(sys.stdin)['assets'] if '.deb' in a['name']][0])")
  curl -sL "$DEB_URL" -o /tmp/Kineo.deb
  sudo dpkg -i /tmp/Kineo.deb || sudo apt-get install -f -y
  rm /tmp/Kineo.deb
  echo "Kineo installed successfully!"
}

windows_install() {
  LATEST=$(curl -sL https://api.github.com/repos/$REPO/releases/latest | grep -o '"tag_name":.*' | cut -d'"' -f4)
  EXE_URL=$(curl -sL https://api.github.com/repos/$REPO/releases/latest | python3 -c "import sys,json; print([a['browser_download_url'] for a in json.load(sys.stdin)['assets'] if '.exe' in a['name']][0])")
  curl -sL "$EXE_URL" -o $TEMP/Kineo-Setup.exe
  Start-Process -Wait $TEMP/Kineo-Setup.exe
  rm $TEMP/Kineo-Setup.exe
  echo "Kineo installed successfully!"
}

case "$(uname -s)" in
  Darwin*)  darwin_install ;;
  Linux*)   linux_install ;;
  MINGW*|MSYS*|CYGWIN*) windows_install ;;
  *)        echo "Unsupported OS" && exit 1 ;;
esac
