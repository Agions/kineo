import DefaultTheme from 'vitepress/theme';
import './style.css';

/**
 * Kineo v2.2.3 VitePress Theme
 *
 * Strategy: minimal custom components, max CSS-driven design.
 * Why: scene-fab experience showed that markdown containers and Vue SFCs
 * are the #1 source of silent homepage failures. Pure HTML + CSS in
 * markdown body is the most reliable pattern.
 *
 * All custom homepage sections (vp-why-grid, vp-workflow, vp-compare, etc.)
 * are defined in style.css and used directly via class names in index.md.
 */
export default {
  extends: DefaultTheme,
};
