import React from 'react';
import { View, Image, Text, ViewStyle } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  isOnline?: boolean;
  isVerified?: boolean;
  style?: ViewStyle;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = 'Traveler',
  size = 48,
  isOnline,
  style,
  className,
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
    <View
      className={`relative ${className || ''}`}
      style={[{ width: size, height: size }, style]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="items-center justify-center bg-primary-mist"
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        >
          <Text
            className="font-bold text-primary"
            style={{ fontSize: size * 0.38 }}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}

      {isOnline !== undefined ? (
        <View
          className={`absolute border-2 border-white ${isOnline ? 'bg-success' : 'bg-textMuted'}`}
          style={{
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            bottom: 0,
            right: 0,
          }}
        />
      ) : null}
    </View>
  );
};
