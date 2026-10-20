/**
 * Kineo AI 设计系统
 * 统一的设计令牌和 Ant Design 主题配置
 */

export const theme = {
  // 品牌色
  colors: {
    primary: '#6366f1', // 主色 (靛蓝)
    primaryHover: '#4f46e5',
    primaryLight: '#e0e7ff',
    primaryDark: '#4338ca',
    secondary: '#ec4899', // 副色 (粉红)
    secondaryHover: '#db2777',
    secondaryLight: '#fce7f3',
    accent: '#14b8a6', // 强调色 (青色)
    accentHover: '#0d9488',
    accentLight: '#ccfbf1',

    // 语义色
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fee2e2',
    info: '#3b82f6',
    infoLight: '#dbeafe',

    // 中性色
    white: '#ffffff',
    black: '#000000',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },

  // 背景色
  backgrounds: {
    primary: '#6366f1',
    secondary: '#ec4899',
    card: '#ffffff',
    cardHover: '#f9fafb',
    page: '#f8fafc',
    pageDark: '#0f172a',
    header: '#ffffff',
    headerDark: '#1e293b',
    sidebar: '#1e293b',
    sidebarLight: '#f8fafc',
    sidebarHover: '#334155',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // 文字色
  text: {
    primary: '#1e293b',
    primaryDark: '#f1f5f9',
    secondary: '#64748b',
    secondaryDark: '#94a3b8',
    tertiary: '#94a3b8',
    tertiaryDark: '#64748b',
    inverse: '#ffffff',
    link: '#6366f1',
    linkHover: '#4f46e5',
    disabled: '#9ca3af',
  },

  // 边框
  borders: {
    light: '#e2e8f0',
    medium: '#cbd5e1',
    dark: '#94a3b8',
    focus: '#6366f1',
  },

  // 阴影
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    focus: '0 0 0 3px rgba(99, 102, 241, 0.3)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
  },

  // 圆角
  radius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  // 间距
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  // 字号
  fontSizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },

  // 行高
  lineHeights: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // 字体权重
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // 过渡
  transitions: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },

  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
};

// Ant Design 主题覆盖
export const antTheme = {
  token: {
    // 颜色
    colorPrimary: theme.colors.primary,
    colorSuccess: theme.colors.success,
    colorWarning: theme.colors.warning,
    colorError: theme.colors.error,
    colorInfo: theme.colors.info,

    // 圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    // 字体
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,

    // 间距
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,

    // 控制高度
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    // 阴影
    boxShadow: theme.shadows.md,
    boxShadowSecondary: theme.shadows.lg,
  },
  components: {
    Button: {
      primaryShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      borderRadius: 8,
      paddingContentHorizontal: 20,
    },
    Card: {
      paddingLG: 24,
      borderRadiusLG: 12,
      boxShadowTertiary: theme.shadows.sm,
    },
    Input: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      borderRadius: 8,
      activeBorderColor: theme.colors.primary,
      hoverBorderColor: theme.colors.primaryHover,
    },
    Select: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      borderRadius: 8,
    },
    Menu: {
      itemHeight: 44,
      itemMarginInline: 8,
      itemBorderRadius: 8,
      iconSize: 16,
      iconMarginInlineEnd: 8,
    },
    Table: {
      headerBg: theme.colors.gray[50],
      headerColor: theme.text.primary,
      rowHoverBg: theme.colors.gray[50],
      borderColor: theme.borders.light,
    },
    Modal: {
      borderRadiusLG: 16,
      titleFontSize: 18,
    },
    Drawer: {
      borderRadiusLG: 16,
    },
    Tooltip: {
      borderRadius: 8,
    },
    Popover: {
      borderRadiusLG: 12,
    },
    Message: {
      contentPadding: '12px 16px',
    },
    Notification: {
      borderRadiusLG: 12,
    },
  },
};

// 暗色主题配置
export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    primary: '#818cf8', // 暗色模式主色稍亮
  },
  backgrounds: {
    ...theme.backgrounds,
    card: '#1e293b',
    cardHover: '#334155',
    page: '#0f172a',
    header: '#1e293b',
    sidebar: '#0f172a',
    sidebarHover: '#1e293b',
  },
  text: {
    ...theme.text,
    primary: '#f1f5f9',
    secondary: '#94a3b8',
  },
  borders: {
    ...theme.borders,
    light: '#334155',
    medium: '#475569',
  },
};

// 暗色 Ant Design 主题
export const darkAntTheme = {
  ...antTheme,
  token: {
    ...antTheme.token,
    colorBgContainer: '#1e293b',
    colorBgElevated: '#1e293b',
    colorBgLayout: '#0f172a',
    colorBgSpotlight: '#334155',
    colorBorder: '#334155',
    colorBorderSecondary: '#1e293b',
    colorText: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
    colorTextTertiary: '#64748b',
  },
};

// 导出样式工具类
export const styles = {
  card: {
    background: theme.backgrounds.card,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadows.md,
    padding: theme.spacing.lg,
  },
  page: {
    background: theme.backgrounds.page,
    minHeight: '100vh',
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textEllipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    border: 0,
  },
};

export default theme;
