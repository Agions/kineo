
/**
 * kineo Tailwind Config
 *
 * Migrated from CJS module.exports to ESM in Phase 1 of kineo refactor.
 * Tailwind v4 (via @tailwindcss/vite plugin) handles base/components/utilities
 * automatically; this config only defines design tokens that extend the theme.
 */
const config = {
  darkMode: 'class',
  // Tailwind v4 auto-detects sources; content array is unused but kept for @config reference
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary, #3B82F6)',
          hover: 'var(--color-primary-hover, #2563EB)',
          active: 'var(--color-primary-active, #1D4ED8)',
          light: 'var(--color-primary-light, #EFF6FF)',
        },
        success: 'var(--color-success, #10B981)',
        'success-light': 'var(--color-success-light, #D1FAE5)',
        warning: 'var(--color-warning, #F59E0B)',
        'warning-light': 'var(--color-warning-light, #FEF3C7)',
        error: 'var(--color-error, #EF4444)',
        'error-light': 'var(--color-error-light, #FEE2E2)',
        info: 'var(--color-info, #6366F1)',
        'info-light': 'var(--color-info-light, #EEF2FF)',
        destructive: {
          DEFAULT: 'var(--destructive, #EF4444)',
          foreground: 'var(--destructive-foreground, #ffffff)',
        },
        border: 'var(--border, #e0e0e0)',
        input: 'var(--input, #e0e0e0)',
        ring: 'var(--ring, #3B82F6)',
      },
      borderRadius: {
        sm: '6px',
        base: '8px',
        DEFAULT: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-base)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        glow: 'var(--shadow-glow)',
        'glow-lg': 'var(--shadow-glow-lg)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
        spring: '400ms',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
        'gradient-primary-hover': 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-error': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        'gradient-surface':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
        'gradient-dark-surface':
          'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUpIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDownIn: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeftIn: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRightIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        zoomIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s cubic-bezier(0, 0, 0.2, 1) forwards',
        slideUp: 'slideUpIn 0.3s cubic-bezier(0.4, 0, 1, 1) forwards',
        slideDown: 'slideDownIn 0.3s cubic-bezier(0.4, 0, 1, 1) forwards',
        slideLeft: 'slideLeftIn 0.3s cubic-bezier(0.4, 0, 1, 1) forwards',
        slideRight: 'slideRightIn 0.3s cubic-bezier(0.4, 0, 1, 1) forwards',
        zoomIn: 'zoomIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        bounceIn: 'bounceIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
