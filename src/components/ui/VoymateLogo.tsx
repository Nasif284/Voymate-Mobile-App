import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';
import { theme } from '../../config/theme';
import { VOYMATE_V3_LEFT_PIN_PATH, VOYMATE_V3_RIGHT_PIN_PATH } from './logoPaths';

export type VoymateLogoVariant = 'rose' | 'soft' | 'ink';

export interface VoymateLogoProps {
  size?: number;
  variant?: VoymateLogoVariant;
  withBackground?: boolean;
  borderRadius?: number;
  rightPinColor?: string;
  leftPinColor?: string;
  backgroundColor?: string;
}

export const VoymateLogo: React.FC<VoymateLogoProps> = ({
  size = 56,
  variant = 'rose',
  withBackground = true,
  borderRadius = 64,
  rightPinColor,
  leftPinColor,
  backgroundColor,
}) => {
  let defaultBg: string = theme.colors.primary;
  let defaultStroke: string | undefined = undefined;
  let defaultLeftPin: string = theme.colors.white;
  let defaultRightPin: string = theme.colors.textPrimary;

  if (variant === 'soft') {
    defaultBg = theme.colors.surfaceSubtle;
    defaultStroke = theme.colors.borderSubtle;
    defaultLeftPin = theme.colors.textPrimary;
    defaultRightPin = theme.colors.primary;
  } else if (variant === 'ink') {
    defaultBg = theme.colors.textPrimary;
    defaultLeftPin = theme.colors.white;
    defaultRightPin = theme.colors.primary;
  } else {
    // variant === 'rose'
    if (!withBackground) {
      defaultLeftPin = theme.colors.textPrimary;
      defaultRightPin = theme.colors.primary;
    }
  }

  const resolvedBg = backgroundColor ?? defaultBg;
  const resolvedLeftPin = leftPinColor ?? defaultLeftPin;
  const resolvedRightPin = rightPinColor ?? defaultRightPin;

  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      {withBackground && (
        <Rect
          x={defaultStroke ? 1 : 0}
          y={defaultStroke ? 1 : 0}
          width={defaultStroke ? 254 : 256}
          height={defaultStroke ? 254 : 256}
          rx={borderRadius}
          fill={resolvedBg}
          stroke={defaultStroke}
          strokeWidth={defaultStroke ? 2 : 0}
        />
      )}
      <Path d={VOYMATE_V3_RIGHT_PIN_PATH} fill={resolvedRightPin} fillRule="evenodd" />
      <Path d={VOYMATE_V3_LEFT_PIN_PATH} fill={resolvedLeftPin} fillRule="evenodd" />
    </Svg>
  );
};
