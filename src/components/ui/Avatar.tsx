import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../config/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  isOnline?: boolean;
  isVerified?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = 'Traveler',
  size = 48,
  isOnline,
  isVerified,
  style,
}) => {
  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const badgeSize = Math.max(12, Math.round(size * 0.28));

  return (
    <View style={[{ width: size, height: size }, styles.container, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: theme.colors.primaryLight,
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize: size * 0.38,
                color: theme.colors.primary,
              },
            ]}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}

      {isOnline !== undefined ? (
        <View
          style={[
            styles.onlineBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              backgroundColor: isOnline ? '#22C55E' : '#94A3B8',
              bottom: 0,
              right: 0,
            },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: theme.typography.weights.bold,
  },
  onlineBadge: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
