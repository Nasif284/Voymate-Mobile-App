const tokens = require('./src/config/designTokens.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: tokens.colors.primary,
          dark: tokens.colors.primaryDark,
          container: tokens.colors.primaryContainer,
          mint: tokens.colors.primaryMint,
          light: tokens.colors.primaryLight,
          mist: tokens.colors.primaryMist,
          border: tokens.colors.primaryBorder,
        },
        background: tokens.colors.background,
        surface: {
          DEFAULT: tokens.colors.surface,
          subtle: tokens.colors.surfaceSubtle,
          container: tokens.colors.surfaceContainer,
          muted: tokens.colors.surfaceMuted,
          dim: tokens.colors.surfaceDim,
          border: tokens.colors.surfaceBorder,
        },
        textPrimary: tokens.colors.textPrimary,
        textSecondary: tokens.colors.textSecondary,
        textMuted: tokens.colors.textMuted,
        textPlaceholder: tokens.colors.textPlaceholder,
        border: {
          DEFAULT: tokens.colors.border,
          subtle: tokens.colors.borderSubtle,
        },
        accent: {
          warm: tokens.colors.accentWarm,
          terracotta: tokens.colors.accentTerracotta,
          gold: tokens.colors.accentGold,
          goldLight: tokens.colors.accentGoldLight,
        },
        success: {
          DEFAULT: tokens.colors.success,
          light: tokens.colors.successLight,
          text: tokens.colors.successText,
        },
        error: {
          DEFAULT: tokens.colors.error,
          light: tokens.colors.errorLight,
          text: tokens.colors.errorText,
        },
        warning: {
          DEFAULT: tokens.colors.warning,
          light: tokens.colors.warningLight,
        },
        info: {
          DEFAULT: tokens.colors.info,
          light: tokens.colors.infoLight,
        },
      },
      borderRadius: {
        xs: `${tokens.radius.xs}px`,
        sm: `${tokens.radius.sm}px`,
        md: `${tokens.radius.md}px`,
        lg: `${tokens.radius.lg}px`,
        xl: `${tokens.radius.xl}px`,
        '2xl': `${tokens.radius.xxl}px`,
        full: `${tokens.radius.full}px`,
      },
      spacing: {
        xs: `${tokens.spacing.xs}px`,
        sm: `${tokens.spacing.sm}px`,
        md: `${tokens.spacing.md}px`,
        lg: `${tokens.spacing.lg}px`,
        xl: `${tokens.spacing.xl}px`,
        xxl: `${tokens.spacing.xxl}px`,
        xxxl: `${tokens.spacing.xxxl}px`,
        huge: `${tokens.spacing.huge}px`,
      },
      fontSize: {
        display: [`${tokens.typography.sizes.display}px`, { lineHeight: '36px' }],
        hero: [`${tokens.typography.sizes.hero}px`, { lineHeight: '42px' }],
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0, 0, 0, 0.03)',
        card: '0 4px 14px rgba(24, 24, 27, 0.04)',
        floating: '0 8px 22px rgba(24, 24, 27, 0.08)',
      },
    },
  },
  plugins: [],
};
