import React from 'react';
import Svg, { Rect, G, Path, Circle } from 'react-native-svg';
import { theme } from '../../config/theme';

interface VoymateLogoProps {
  size?: number;
  withBackground?: boolean;
  borderRadius?: number;
}

export const VoymateLogo: React.FC<VoymateLogoProps> = ({
  size = 56,
  withBackground = true,
  borderRadius = 58,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      {withBackground && (
        <Rect width="256" height="256" rx={borderRadius} fill={theme.colors.primary} />
      )}
      <G transform="translate(129.69, 207.87) scale(1.1258)">
        <G transform="rotate(31.42)">
          <Path
            d="M0 0 L24.94 -84.65 A26 26 0 1 0 -24.94 -84.65 Z"
            fill={theme.colors.primaryLight}
          />
          <Circle cx="0" cy="-92" r="9" fill={withBackground ? theme.colors.primary : theme.colors.surface} />
        </G>
        <G transform="rotate(-20.18)">
          <Path
            d="M0 0 L32.65 -112.52 A34 34 0 1 0 -32.65 -112.52 Z"
            fill={theme.colors.white}
          />
          <Circle cx="0" cy="-122" r="12" fill={withBackground ? theme.colors.primary : theme.colors.surface} />
        </G>
      </G>
    </Svg>
  );
};
