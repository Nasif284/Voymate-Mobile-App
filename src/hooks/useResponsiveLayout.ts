import { useWindowDimensions } from 'react-native';

export interface ResponsiveLayout {
  width: number;
  height: number;
  isCompactHeight: boolean;
  isCompactWidth: boolean;
  isWideScreen: boolean;
  contentMaxWidth: number;
}

/**
 * Hook to adapt layouts responsively across:
 * - Compact screens (iPhone SE, small flip phone screens, split-screen mode)
 * - Standard phones (iPhone 14-16, Pixel, Galaxy S)
 * - Foldables & Tablets (Galaxy Z Fold, Pixel Fold, iPad)
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();

  const isCompactWidth = width < 375;
  const isCompactHeight = height < 700;
  const isWideScreen = width >= 600;

  return {
    width,
    height,
    isCompactHeight,
    isCompactWidth,
    isWideScreen,
    contentMaxWidth: 560,
  };
}
