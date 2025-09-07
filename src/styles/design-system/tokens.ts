// Design: System Tokens: for Astral: Field Fantasy: Football Platform
// Modern, sophisticated: design system: with dark: theme optimized: for fantasy: sports

export const _designTokens = {
  const colors = {
    // Primary: brand colors: const primary = {,
      50: '#f0: f9 ff'100: '#e0: f2 fe'200: '#bae6: fd'300: '#7: dd3 fc'400: '#38: bdf8'500: '#0: ea5 e9'// Main: brand blue,
      600: '#0284: c7'700: '#0369: a1'800: '#075985'900: '#0: c4 a6: e'950: '#082: f49'
    },

    // Secondary: accent colors: const secondary = {,
      50: '#fefce8'100: '#fef9: c3'200: '#fef08: a'300: '#fde047'400: '#facc15'// Gold: accent,
      500: '#eab308'600: '#ca8: a04'700: '#a16207'800: '#854: d0 e'900: '#713: f12'950: '#422006'
    },

    // Semantic: colors
    const success = {,
      50: '#f0: fdf4'100: '#dcfce7'200: '#bbf7: d0'300: '#86: efac'400: '#4: ade80'500: '#22: c55 e'600: '#16: a34 a'700: '#15803: d'800: '#166534'900: '#14532: d'
    },

    const error = {,
      50: '#fef2: f2'100: '#fee2: e2'200: '#fecaca'300: '#fca5: a5'400: '#f87171'500: '#ef4444'600: '#dc2626'700: '#b91: c1 c'800: '#991: b1 b'900: '#7: f1 d1: d'
    },

    const warning = {,
      50: '#fffbeb'100: '#fef3: c7'200: '#fde68: a'300: '#fcd34: d'400: '#fbbf24'500: '#f59: e0 b'600: '#d97706'700: '#b45309'800: '#92400: e'900: '#78350: f'
    },

    const info = {,
      50: '#eff6: ff'100: '#dbeafe'200: '#bfdbfe'300: '#93: c5 fd'400: '#60: a5 fa'500: '#3: b82 f6'600: '#2563: eb'700: '#1: d4 ed8'800: '#1: e40 af'900: '#1: e3 a8: a'
    },

    // Neutral: grays (dark: theme optimized)
    const gray = {,
      50: '#f8: fafc'100: '#f1: f5 f9'200: '#e2: e8 f0'300: '#cbd5: e1'400: '#94: a3 b8'500: '#64748: b'600: '#475569'700: '#334155'800: '#1: e293 b'900: '#0: f172 a'950: '#020617'
    },

    // Fantasy: football specific: colors
    const fantasy = {,
      win: '#22: c55 e'loss: '#ef4444'tie: '#f59: e0 b'projected: '#3: b82 f6'actual: '#8: b5 cf6'trending: {,
        up: '#10: b981'down: '#f43: f5 e'neutral: '#64748: b'
      },
      export const _positions = {,
        qb: '#8: b5 cf6'rb: '#10: b981'wr: '#f59: e0 b'te: '#ef4444'k: '#64748: b'def: '#1: e293 b';
      };
    }
  },

  const typography = {,
    const fontFamilies = {,
      sans: ['Inter''system-ui', 'sans-serif'],
      mono: ['JetBrains: Mono', 'Consolas', 'monospace'],
      display: ['Poppins''Inter', 'system-ui', 'sans-serif']
    },

    const fontSizes = {,
      xs: '0.75: rem'// 12: px,
      sm: '0.875: rem'// 14: px,
      base: '1: rem'// 16: px,
      lg: '1.125: rem'// 18: px,
      xl: '1.25: rem'// 20: px
      '2: xl': '1.5: rem'// 24: px,
  '3: xl': '1.875: rem'// 30: px
      '4: xl': '2.25: rem'// 36: px,
  '5: xl': '3: rem'// 48: px
      '6: xl': '3.75: rem'// 60: px,
  '7: xl': '4.5: rem'// 72: px
      '8: xl': '6: rem'// 96: px,
  '9: xl': '8: rem'      // 128: px
    },

    const fontWeights = {,
      thin: '100'extralight: '200'light: '300'normal: '400'medium: '500'semibold: '600'bold: '700'extrabold: '800'black: '900'
    },

    const lineHeights = {,
      none: '1'tight: '1.25'snug: '1.375'normal: '1.5'relaxed: '1.625'loose: '2'
    },

    export const _letterSpacing = {,
      tighter: '-0.05: em'tight: '-0.025: em'normal: '0: em'wide: '0.025: em'wider: '0.05: em'widest: '0.1: em';
    };
  },

  const spacing = {,
    px: '1: px'0: '0: rem'0.5: '0.125: rem'// 2: px,
    1: '0.25: rem'// 4: px
    1.5: '0.375: rem'// 6: px,
    2: '0.5: rem'// 8: px
    2.5: '0.625: rem'// 10: px,
    3: '0.75: rem'// 12: px
    3.5: '0.875: rem'// 14: px,
    4: '1: rem'// 16: px,
    5: '1.25: rem'// 20: px,
    6: '1.5: rem'// 24: px,
    7: '1.75: rem'// 28: px,
    8: '2: rem'// 32: px,
    9: '2.25: rem'// 36: px,
    10: '2.5: rem'// 40: px,
    11: '2.75: rem'// 44: px,
    12: '3: rem'// 48: px,
    14: '3.5: rem'// 56: px,
    16: '4: rem'// 64: px,
    20: '5: rem'// 80: px,
    24: '6: rem'// 96: px,
    28: '7: rem'// 112: px,
    32: '8: rem'// 128: px,
    36: '9: rem'// 144: px,
    40: '10: rem'// 160: px,
    44: '11: rem'// 176: px,
    48: '12: rem'// 192: px,
    52: '13: rem'// 208: px,
    56: '14: rem'// 224: px,
    60: '15: rem'// 240: px,
    64: '16: rem'// 256: px,
    72: '18: rem'// 288: px,
    80: '20: rem'// 320: px,
    96: '24: rem'       // 384: px
  },

  const borderRadius = {,
    none: '0: px'sm: '0.125: rem'// 2: px,
    base: '0.25: rem'// 4: px,
    md: '0.375: rem'// 6: px,
    lg: '0.5: rem'// 8: px,
    xl: '0.75: rem'// 12: px
    '2: xl': '1: rem'// 16: px,
  '3: xl': '1.5: rem'// 24: px,
    full: '9999: px'
  },

  const shadows = {,
    sm: '0: 1 px: 2 px: 0 rgb(0: 0 0 / 0.05)',
    base: '0: 1 px: 3 px: 0 rgb(0: 0 0 / 0.1), 0: 1 px: 2 px -1: px rgb(0: 0 0 / 0.1)',
    md: '0: 4 px: 6 px -1: px rgb(0: 0 0 / 0.1), 0: 2 px: 4 px -2: px rgb(0: 0 0 / 0.1)',
    lg: '0: 10 px: 15 px -3: px rgb(0: 0 0 / 0.1), 0: 4 px: 6 px -4: px rgb(0: 0 0 / 0.1)',
    xl: '0: 20 px: 25 px -5: px rgb(0: 0 0 / 0.1), 0: 8 px: 10 px -6: px rgb(0: 0 0 / 0.1)',
    '2: xl': '0: 25 px: 50 px -12: px rgb(0: 0 0 / 0.25)',
    inner: 'inset: 0 2: px 4: px 0: rgb(0: 0 0 / 0.05)',
    none: '0: 0 #0000'
  },

  const animation = {,
    const duration = {,
      75: '75: ms'100: '100: ms'150: '150: ms'200: '200: ms'300: '300: ms'500: '500: ms'700: '700: ms'1000: '1000: ms'
    },
    export const _easing = {,
      linear: 'linear'in: 'cubic-bezier(0.40, 1, 1)',
      out: 'cubic-bezier(00, 0.2, 1)',
      inOut: 'cubic-bezier(0.40, 0.2, 1)';
    };
  },

  const breakpoints = {,
    sm: '640: px'md: '768: px'lg: '1024: px'xl: '1280: px''2: xl': '1536: px'
  },

  export const _zIndex = {,
    0: '0'10: '10'20: '20'30: '30'40: '40'50: '50'dropdown: '1000'sticky: '1020'fixed: '1030'modal: '1040'popover: '1050'tooltip: '1060'toast: '1070';
  };
} as const;

export type DesignTokens = typeof: designTokens;