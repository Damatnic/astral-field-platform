// Theme Configuration for Astral Field Fantasy Football Platform
// Implements dark-first design optimized for fantasy sports data visualization

import { designTokens } from './tokens';

export interface Theme {
  colors: {
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      elevated: string;
    };
    surface: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
      disabled: string;
    };
    border: {
      primary: string;
      secondary: string;
      focus: string;
      error: string;
      success: string;
    };
    interactive: {
      primary: {
        default: string;
        hover: string;
        active: string;
        disabled: string;
      };
      secondary: {
        default: string;
        hover: string;
        active: string;
        disabled: string;
      };
      tertiary: {
        default: string;
        hover: string;
        active: string;
        disabled: string;
      };
    };
    status: {
      success: string;
      error: string;
      warning: string;
      info: string;
    };
    fantasy: {
      win: string;
      loss: string;
      tie: string;
      projected: string;
      actual: string;
      trending: {
        up: string;
        down: string;
        neutral: string;
      };
      positions: {
        qb: string;
        rb: string;
        wr: string;
        te: string;
        k: string;
        def: string;
      };
    };
  };
  spacing: typeof designTokens.spacing;
  typography: typeof designTokens.typography;
  borderRadius: typeof designTokens.borderRadius;
  shadows: typeof designTokens.shadows;
  animation: typeof designTokens.animation;
  breakpoints: typeof designTokens.breakpoints;
  zIndex: typeof designTokens.zIndex;
}

export const darkTheme: Theme = {
  colors: {
    background: {
      primary: designTokens.colors.gray[950],      // Deep dark background
      secondary: designTokens.colors.gray[900],    // Card backgrounds
      tertiary: designTokens.colors.gray[800],     // Subtle backgrounds
      elevated: designTokens.colors.gray[800],     // Modal/dropdown backgrounds
    },
    surface: {
      primary: designTokens.colors.gray[900],      // Main surface color
      secondary: designTokens.colors.gray[800],    // Secondary surfaces
      tertiary: designTokens.colors.gray[700],     // Tertiary surfaces
      inverse: designTokens.colors.gray[50],       // Light surface for contrast
    },
    text: {
      primary: designTokens.colors.gray[50],       // Main text color
      secondary: designTokens.colors.gray[300],    // Secondary text
      tertiary: designTokens.colors.gray[500],     // Muted text
      inverse: designTokens.colors.gray[900],      // Dark text on light backgrounds
      disabled: designTokens.colors.gray[600],     // Disabled text
    },
    border: {
      primary: designTokens.colors.gray[700],      // Main border color
      secondary: designTokens.colors.gray[600],    // Subtle borders
      focus: designTokens.colors.primary[400],     // Focus indicator
      error: designTokens.colors.error[500],       // Error borders
      success: designTokens.colors.success[500],   // Success borders
    },
    interactive: {
      primary: {
        default: designTokens.colors.primary[500],
        hover: designTokens.colors.primary[400],
        active: designTokens.colors.primary[600],
        disabled: designTokens.colors.gray[700],
      },
      secondary: {
        default: designTokens.colors.secondary[400],
        hover: designTokens.colors.secondary[300],
        active: designTokens.colors.secondary[500],
        disabled: designTokens.colors.gray[700],
      },
      tertiary: {
        default: 'transparent',
        hover: designTokens.colors.gray[800],
        active: designTokens.colors.gray[700],
        disabled: 'transparent',
      },
    },
    status: {
      success: designTokens.colors.success[500],
      error: designTokens.colors.error[500],
      warning: designTokens.colors.warning[500],
      info: designTokens.colors.info[500],
    },
    fantasy: {
      win: designTokens.colors.fantasy.win,
      loss: designTokens.colors.fantasy.loss,
      tie: designTokens.colors.fantasy.tie,
      projected: designTokens.colors.fantasy.projected,
      actual: designTokens.colors.fantasy.actual,
      trending: designTokens.colors.fantasy.trending,
      positions: designTokens.colors.fantasy.positions,
    },
  },
  spacing: designTokens.spacing,
  typography: designTokens.typography,
  borderRadius: designTokens.borderRadius,
  shadows: designTokens.shadows,
  animation: designTokens.animation,
  breakpoints: designTokens.breakpoints,
  zIndex: designTokens.zIndex,
};

export const lightTheme: Theme = {
  colors: {
    background: {
      primary: designTokens.colors.gray[50],       // Light background
      secondary: designTokens.colors.gray[100],    // Card backgrounds
      tertiary: designTokens.colors.gray[200],     // Subtle backgrounds
      elevated: designTokens.colors.gray[100],     // Modal/dropdown backgrounds
    },
    surface: {
      primary: designTokens.colors.gray[100],      // Main surface color
      secondary: designTokens.colors.gray[200],    // Secondary surfaces
      tertiary: designTokens.colors.gray[300],     // Tertiary surfaces
      inverse: designTokens.colors.gray[900],      // Dark surface for contrast
    },
    text: {
      primary: designTokens.colors.gray[900],      // Main text color
      secondary: designTokens.colors.gray[700],    // Secondary text
      tertiary: designTokens.colors.gray[500],     // Muted text
      inverse: designTokens.colors.gray[50],       // Light text on dark backgrounds
      disabled: designTokens.colors.gray[400],     // Disabled text
    },
    border: {
      primary: designTokens.colors.gray[300],      // Main border color
      secondary: designTokens.colors.gray[200],    // Subtle borders
      focus: designTokens.colors.primary[500],     // Focus indicator
      error: designTokens.colors.error[500],       // Error borders
      success: designTokens.colors.success[500],   // Success borders
    },
    interactive: {
      primary: {
        default: designTokens.colors.primary[500],
        hover: designTokens.colors.primary[600],
        active: designTokens.colors.primary[700],
        disabled: designTokens.colors.gray[300],
      },
      secondary: {
        default: designTokens.colors.secondary[500],
        hover: designTokens.colors.secondary[600],
        active: designTokens.colors.secondary[700],
        disabled: designTokens.colors.gray[300],
      },
      tertiary: {
        default: 'transparent',
        hover: designTokens.colors.gray[100],
        active: designTokens.colors.gray[200],
        disabled: 'transparent',
      },
    },
    status: {
      success: designTokens.colors.success[600],
      error: designTokens.colors.error[600],
      warning: designTokens.colors.warning[600],
      info: designTokens.colors.info[600],
    },
    fantasy: {
      win: designTokens.colors.fantasy.win,
      loss: designTokens.colors.fantasy.loss,
      tie: designTokens.colors.fantasy.tie,
      projected: designTokens.colors.fantasy.projected,
      actual: designTokens.colors.fantasy.actual,
      trending: designTokens.colors.fantasy.trending,
      positions: designTokens.colors.fantasy.positions,
    },
  },
  spacing: designTokens.spacing,
  typography: designTokens.typography,
  borderRadius: designTokens.borderRadius,
  shadows: designTokens.shadows,
  animation: designTokens.animation,
  breakpoints: designTokens.breakpoints,
  zIndex: designTokens.zIndex,
};

// Theme utilities
export const getTheme = (isDark: boolean = true): Theme => {
  return isDark ? darkTheme : lightTheme;
};

export const createCustomTheme = (overrides: Partial<Theme>): Theme => {
  return {
    ...darkTheme,
    ...overrides,
    colors: {
      ...darkTheme.colors,
      ...overrides.colors,
    },
  };
};

export type ThemeMode = 'dark' | 'light' | 'system';

export default darkTheme;