export const theme = {
  colors: {
    // Brand & Primary
    primary: '#005440',
    primaryContainer: '#0F6E56',
    primaryMint: '#A0F3D4',
    primaryLight: '#C9EADB',
    onPrimary: '#FFFFFF',

    // Canvas & Surfaces
    background: '#F7FAF6',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F4F1',
    surfaceContainer: '#EBF1ED',
    surfaceDim: '#D7DBD7',

    // Text & Neutrals
    textPrimary: '#181D1A',
    textSecondary: '#3F4944',
    textMuted: '#6F7A74',
    textPlaceholder: '#8A9791',
    border: '#E2E8F0',
    borderSubtle: '#E5E9E5',

    // Accents & Semantic States
    accentWarm: '#E07A5F',
    accentTerracotta: '#78352B',
    success: '#0F6E56',
    successLight: '#C9EADB',
    error: '#BA1A1A',
    errorLight: '#FFDAD6',
    warning: '#D97706',
    warningLight: '#FEF3C7',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },

  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  typography: {
    fontFamilies: {
      headline: 'System',
      body: 'System',
    },
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      display: 30,
      hero: 36,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      black: '900' as const,
    },
  },

  shadows: {
    subtle: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    card: {
      shadowColor: '#005440',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    floating: {
      shadowColor: '#002117',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
  },
} as const;

export type Theme = typeof theme;
