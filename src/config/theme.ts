import designTokens from './designTokens.json';

export const theme = {
  colors: designTokens.colors,
  spacing: designTokens.spacing,
  radius: designTokens.radius,
  typography: {
    fontFamilies: designTokens.typography.fontFamilies,
    sizes: designTokens.typography.sizes,
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      black: '900' as const,
    },
  },
  shadows: designTokens.shadows,
} as const;

export type Theme = typeof theme;
