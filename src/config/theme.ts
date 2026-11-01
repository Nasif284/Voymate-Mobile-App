export const theme = {
  colors: {
    // Brand & Primary (Sunset Rose-Coral)
    primary: '#E11D48',
    primaryDark: '#BE123C',
    primaryContainer: '#BE123C',
    primaryMint: '#FFE4E6',
    primaryLight: '#FFE4E6',
    primaryMist: '#FFF1F2',
    primaryBorder: 'rgba(225, 29, 72, 0.16)',
    onPrimary: '#FFFFFF',
    onPrimaryMuted: 'rgba(255, 255, 255, 0.7)',

    // Canvas & Surfaces (Pure White #FFFFFF Canvas)
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSubtle: '#F4F4F5',
    surfaceContainer: '#F4F4F5',
    surfaceMuted: '#FAFAFA',
    surfaceDim: '#E4E4E7',
    surfaceBorder: '#E4E4E7',
    white: '#FFFFFF',
    black: '#000000',

    // Text & Neutrals (Warm Zinc Scale)
    textPrimary: '#18181B',
    textSecondary: '#52525B',
    textMuted: '#71717A',
    textPlaceholder: '#A1A1AA',
    border: '#E4E4E7',
    borderSubtle: '#F4F4F5',

    // Accents & Semantic States
    accentWarm: '#F97316',
    accentTerracotta: '#E11D48',
    accentGold: '#F59E0B',
    accentGoldLight: '#FEF3C7',
    success: '#10B981',
    successLight: '#ECFDF5',
    successText: '#047857',
    error: '#EF4444',
    errorLight: '#FEF2F2',
    errorText: '#B91C1C',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    info: '#38BDF8',
    infoLight: '#F0F9FF',

    // Overlays & Ambient
    overlay: 'rgba(24, 24, 27, 0.45)',
    cardShadow: '#18181B',
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
      shadowOpacity: 0.03,
      shadowRadius: 3,
      elevation: 1,
    },
    card: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 14,
      elevation: 2,
    },
    floating: {
      shadowColor: '#18181B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 22,
      elevation: 6,
    },
  },
} as const;

export type Theme = typeof theme;
