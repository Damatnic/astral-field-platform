// Theme Configuration for Astral Field Fantasy Football Platform
// Implements dark-first design optimized for fantasy sports data visualization

import { designTokens } from "./tokens";

export interface Theme {
  colors: {
  background: {
      primary: string;
    secondary: string;
      tertiary: string;
    elevated: string,
    }
    surface: {
  primary: string;
      secondary: string;
    tertiary: string;
      inverse: string,
    }
    text: {
  primary: string;
      secondary: string;
    tertiary: string;
      inverse: string;
    disabled: string,
    }
    border: {
  primary: string;
      secondary: string;
    focus: string;
      error: string;
    success: string,
    }
    interactive: {
  primary: {
        default: string;
    hover: string;
        active: string;
    disabled: string,
      }
      secondary: {
  default: string;
        hover: string;
    active: string;
        disabled: string,
      }
      tertiary: {
  default: string;
        hover: string;
    active: string;
        disabled: string,
      }
    }
    semantic: {
  success: string;
      error: string;
    warning: string;
      info: string,
    }
    fantasy: {
  win: string;
      loss: string;
    tie: string;
      projected: string;
    actual: string;
      trending: {
  up: string;
        down: string;
    neutral: string,
      }
      positions: {
  qb: string;
        rb: string;
    wr: string;
        te: string;
    k: string;
        def: string,
      }
    }
  }
  spacing: typeof designTokens.spacing,
    typography: typeof designTokens.typography;
  borderRadius: typeof designTokens.borderRadius,
    shadows: typeof designTokens.shadows;
  animation: typeof designTokens.animation,
    zIndex: typeof designTokens.zIndex,
}

// Dark theme (primary theme)
export const darkTheme: Theme = {
  colors: {
    background: {
  primary: designTokens.colors.gray[950],
  secondary: designTokens.colors.gray[900],
      tertiary: designTokens.colors.gray[800],
  elevated: designTokens.colors.gray[800]
},
    surface: {
  primary: designTokens.colors.gray[900],
  secondary: designTokens.colors.gray[800],
      tertiary: designTokens.colors.gray[700],
  inverse: designTokens.colors.gray[50]
},
    text: {
  primary: designTokens.colors.gray[50],
  secondary: designTokens.colors.gray[300],
      tertiary: designTokens.colors.gray[400],
  inverse: designTokens.colors.gray[900],
      disabled: designTokens.colors.gray[600]
},
    border: {
  primary: designTokens.colors.gray[700],
  secondary: designTokens.colors.gray[600],
      focus: designTokens.colors.primary[500],
  error: designTokens.colors.error[500],
      success: designTokens.colors.success[500]
},
    interactive: {
  primary: {
        default: designTokens.colors.primary[500],
  hover: designTokens.colors.primary[400],
        active: designTokens.colors.primary[600],
  disabled: designTokens.colors.gray[600]
},
      secondary: {
  default: designTokens.colors.secondary[500],
  hover: designTokens.colors.secondary[400],
        active: designTokens.colors.secondary[600],
  disabled: designTokens.colors.gray[600]
},
      tertiary: {
  default: "transparent",
  hover: designTokens.colors.gray[800],
        active: designTokens.colors.gray[700],
  disabled: designTokens.colors.gray[600]
}
},
    semantic: {
  success: designTokens.colors.success[500],
  error: designTokens.colors.error[500],
      warning: designTokens.colors.warning[500],
  info: designTokens.colors.info[500]
},
    fantasy: {
  win: designTokens.colors.fantasy.win,
  loss: designTokens.colors.fantasy.loss,
      tie: designTokens.colors.fantasy.tie,
  projected: designTokens.colors.fantasy.projected,
      actual: designTokens.colors.fantasy.actual,
  trending: designTokens.colors.fantasy.trending,
      positions: designTokens.colors.fantasy.positions
}
},
  spacing: designTokens.spacing,
  typography: designTokens.typography,
  borderRadius: designTokens.borderRadius,
  shadows: designTokens.shadows,
  animation: designTokens.animation,
  zIndex: designTokens.zIndex
}
// Light theme (alternative theme)
export const lightTheme: Theme = {
  colors: {
    background: {
  primary: designTokens.colors.gray[50],
  secondary: designTokens.colors.gray[100],
      tertiary: designTokens.colors.gray[200],
  elevated: designTokens.colors.gray[100]
},
    surface: {
  primary: "#ffffff",
  secondary: designTokens.colors.gray[50],
      tertiary: designTokens.colors.gray[100],
  inverse: designTokens.colors.gray[900]
},
    text: {
  primary: designTokens.colors.gray[900],
  secondary: designTokens.colors.gray[700],
      tertiary: designTokens.colors.gray[600],
  inverse: designTokens.colors.gray[50],
      disabled: designTokens.colors.gray[400]
},
    border: {
  primary: designTokens.colors.gray[300],
  secondary: designTokens.colors.gray[200],
      focus: designTokens.colors.primary[500],
  error: designTokens.colors.error[500],
      success: designTokens.colors.success[500]
},
    interactive: {
  primary: {
        default: designTokens.colors.primary[600],
  hover: designTokens.colors.primary[700],
        active: designTokens.colors.primary[800],
  disabled: designTokens.colors.gray[400]
},
      secondary: {
  default: designTokens.colors.secondary[600],
  hover: designTokens.colors.secondary[700],
        active: designTokens.colors.secondary[800],
  disabled: designTokens.colors.gray[400]
},
      tertiary: {
  default: "transparent",
  hover: designTokens.colors.gray[100],
        active: designTokens.colors.gray[200],
  disabled: designTokens.colors.gray[300]
}
},
    semantic: {
  success: designTokens.colors.success[600],
  error: designTokens.colors.error[600],
      warning: designTokens.colors.warning[600],
  info: designTokens.colors.info[600]
},
    fantasy: {
  win: designTokens.colors.fantasy.win,
  loss: designTokens.colors.fantasy.loss,
      tie: designTokens.colors.fantasy.tie,
  projected: designTokens.colors.fantasy.projected,
      actual: designTokens.colors.fantasy.actual,
  trending: designTokens.colors.fantasy.trending,
      positions: designTokens.colors.fantasy.positions
}
},
  spacing: designTokens.spacing,
  typography: designTokens.typography,
  borderRadius: designTokens.borderRadius,
  shadows: designTokens.shadows,
  animation: designTokens.animation,
  zIndex: designTokens.zIndex
}
// Theme utilities
export const getTheme = (isDark: boolean = true); Theme => {return isDark ? darkTheme : lightTheme;
 }
export const createCustomTheme = (overrides: Partial<Theme>); Theme => { return {
    ...darkTheme,
    ...overrides,
    colors: {
      ...darkTheme.colors,
      ...overrides.colors}
}
}