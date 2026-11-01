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
          DEFAULT: '#E11D48',
          dark: '#BE123C',
          container: '#BE123C',
          mint: '#FFE4E6',
          light: '#FFE4E6',
          mist: '#FFF1F2',
          border: 'rgba(225, 29, 72, 0.16)',
        },
        background: '#FFFFFF',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F4F4F5',
          container: '#F4F4F5',
          muted: '#FAFAFA',
          dim: '#E4E4E7',
          border: '#E4E4E7',
        },
        textPrimary: '#18181B',
        textSecondary: '#52525B',
        textMuted: '#71717A',
        textPlaceholder: '#A1A1AA',
        border: {
          DEFAULT: '#E4E4E7',
          subtle: '#F4F4F5',
        },
        accent: {
          warm: '#F97316',
          terracotta: '#E11D48',
          gold: '#F59E0B',
          goldLight: '#FEF3C7',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#ECFDF5',
          text: '#047857',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEF2F2',
          text: '#B91C1C',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        info: {
          DEFAULT: '#38BDF8',
          light: '#F0F9FF',
        },
      },
    },
  },
  plugins: [],
};
