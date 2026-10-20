#!/usr/bin/env python3
"""render-assets.py — 渲染所有 SVG 资产到 PNG

用法：
  python3 scripts/render-assets.py
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS_SVG = ROOT / "assets"
PUBLIC_SVG = ROOT / "public"


def render_svg_to_png(svg_path: Path, png_path: Path, size: int) -> None:
    """用 cairosvg 渲染 SVG 到指定尺寸 PNG (保留 SVG 透明度)"""
    png_path.parent.mkdir(parents=True, exist_ok=True)
    cairosvg.svg2png(
        url=str(svg_path),
        write_to=str(png_path),
        output_width=size,
        output_height=size,
    )
    print(f"  ✅ {png_path.name}  {size}x{size}")


def resize_png(src: Path, dst: Path, size: int) -> None:
    """缩放 PNG 到目标尺寸 (高质量)"""
    img = Image.open(src).convert("RGBA")
    img = img.resize((size, size), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    img.save(dst, "PNG", optimize=True)
    print(f"  ✅ {dst.name}  {size}x{size}")


def main() -> int:
    print("🎨 Kineo 资产渲染器\n")

    # === 1. 主方形 logo PNG (assets/) ===
    print("📦 assets/logo.svg → 多尺寸 PNG")
    src = ASSETS_SVG / "logo.svg"
    sizes_a = [128, 256, 512, 1024]
    for s in sizes_a:
        render_svg_to_png(src, ASSETS_SVG / f"logo-{s}.png", s)

    # === 2. 堆叠式 logo PNG ===
    print("\n📦 assets/logo-stacked.svg → PNG (640x720)")
    cairosvg.svg2png(
        url=str(ASSETS_SVG / "logo-stacked.svg"),
        write_to=str(ASSETS_SVG / "logo-stacked.png"),
        output_width=640,
        output_height=720,
    )
    print("  ✅ logo-stacked.png  640x720")

    # === 3. 横向 logo PNG ===
    print("\n📦 assets/logo-horizontal.svg → PNG (960x240)")
    cairosvg.svg2png(
        url=str(ASSETS_SVG / "logo-horizontal.svg"),
        write_to=str(ASSETS_SVG / "logo-horizontal.png"),
        output_width=960,
        output_height=240,
    )
    print("  ✅ logo-horizontal.png  960x240")

    # === 4. OG Image (assets -> public) ===
    print("\n📦 assets/logo-og.svg → public/og-image.png (1280x640)")
    cairosvg.svg2png(
        url=str(ASSETS_SVG / "logo-og.svg"),
        write_to=str(PUBLIC_SVG / "og-image.png"),
        output_width=1280,
        output_height=640,
    )
    print("  ✅ og-image.png  1280x640")

    # === 5. favicon 多尺寸 PNG (public/) ===
    # 先把 logo.svg 渲染成大 PNG, 再缩放各尺寸
    print("\n📦 public/favicon.svg → 多尺寸 PNG")
    src = PUBLIC_SVG / "favicon.svg"
    # 先渲染大尺寸
    tmp_large = PUBLIC_SVG / "_favicon-large.png"
    cairosvg.svg2png(url=str(src), write_to=str(tmp_large), output_width=512, output_height=512)
    for s in [16, 32, 48, 64, 128, 256, 512]:
        resize_png(tmp_large, PUBLIC_SVG / f"favicon-{s}x{s}.png", s)
    tmp_large.unlink()

    # === 6. favicon.ico (含多尺寸, 兼容性最好) ===
    print("\n📦 public/favicon.ico (多尺寸合集)")
    favicon_sizes = [16, 32, 48, 64, 128, 256]
    # 先做一张大 PNG
    cairosvg.svg2png(url=str(PUBLIC_SVG / "favicon.svg"), write_to=str(PUBLIC_SVG / "_tmp.png"), output_width=512, output_height=512)
    base = Image.open(PUBLIC_SVG / "_tmp.png").convert("RGBA")
    ico_path = PUBLIC_SVG / "favicon.ico"
    base.save(ico_path, format="ICO", sizes=[(s, s) for s in favicon_sizes])
    print(f"  ✅ favicon.ico  ({', '.join(f'{s}x{s}' for s in favicon_sizes)})")
    (PUBLIC_SVG / "_tmp.png").unlink()

    # === 7. logo SVG 同步到 public/ (Vite 用) ===
    print("\n📦 public/*.svg (Vite 用)")
    import shutil
    shutil.copy(ASSETS_SVG / "logo.svg", PUBLIC_SVG / "logo.svg")
    shutil.copy(ASSETS_SVG / "logo-horizontal.svg", PUBLIC_SVG / "logo-horizontal.svg")
    shutil.copy(ASSETS_SVG / "logo-og.svg", PUBLIC_SVG / "og-image.svg")
    print("  ✅ public/logo.svg")
    print("  ✅ public/logo-horizontal.svg")
    print("  ✅ public/og-image.svg")

    # === 8. logo SVG 同步到 docs/public/ (VitePress 用) ===
    docs_public = ROOT / "docs" / "public"
    if docs_public.exists():
        print("\n📦 docs/public/*.svg (VitePress 用)")
        docs_public.mkdir(parents=True, exist_ok=True)
        shutil.copy(ASSETS_SVG / "logo.svg", docs_public / "logo.svg")
        shutil.copy(ASSETS_SVG / "logo-horizontal.svg", docs_public / "logo-horizontal.svg")
        shutil.copy(PUBLIC_SVG / "favicon.svg", docs_public / "favicon.svg")
        print("  ✅ docs/public/logo.svg")
        print("  ✅ docs/public/logo-horizontal.svg")
        print("  ✅ docs/public/favicon.svg")

    print("\n🎉 全部渲染完成！")
    return 0


if __name__ == "__main__":
    sys.exit(main())
