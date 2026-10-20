# Kineo Changelog

All notable changes to Kineo (Kineo AI) will be documented in this file.

---

## [v0.0.3] - 2026-08-18 (Gemini Studio 2026 & Auto-Swarm Edition)

### 🚀 Major Highlights
- **Gemini Studio 2026 Cyber Midnight UI Unification**:
  - Refactored `StoryboardEditor.tsx`, `HeroSection.tsx`, and `MultiAgentStudio.tsx` to align 100% with the Gemini Studio 2026 design system (dark obsidian `#050810`, neon cyan `#00f5d4` accents, glassmorphism cards).
  - Integrated 16:9 4K Video Preview Canvas with **3D Camera Trajectory Overlay** (Hitchcock Zoom / FPV Fly vector lines with green/cyan glow).
  - Integrated **Character Consistency Cards** (`Eris`, `Kenji`) with active face lock indicators.
- **Auto-Swarm Multi-Agent Engine Upgrade**:
  - Upgraded `MasterDirectorAgent.ts` with `executeAgentWithRetry` automatic backoff and auto-correction loops for individual sub-agents.
  - Full support for 6 specialized sub-agents (`CHIEF`, `SCRIPT`, `DESIGNER`, `ARTIST`, `SOUND`, `VIDEO`) plus `CustomUserAgent` extensions.

### 🐛 Bug Fixes & Stability
- Resolved GitHub Issue #47 and Issue #48 (fixed Release build startup hang caused by `rollupOptions.external` bundling restriction, and added `localStorage` + Tauri folder picker persistence for `workingDir`).
- Passed all 60 Test Suites (859 unit tests) with 0 errors.

---

## [v0.0.2] - 2026-08-12

### Added
- Hub-and-Spoke Multi-Agent Architecture with `ProjectBlackboard` shared memory.
- 13 AI provider model adapters (DeepSeek-V4, Qwen 3.8-Max, Hunyuan Hy3, ERNIE 5.1, GPT-5.6, Kling 3.0 Omni, Seedance 2.5).
- Apple VideoToolbox / NVIDIA NVENC hardware acceleration support.
