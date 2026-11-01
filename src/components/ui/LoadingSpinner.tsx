import React from 'react';
import { View, ActivityIndicator, Text, ViewStyle } from 'react-native';
import { theme } from '../../config/theme';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
  style,
  className,
}) => {
  return (
    <View className={`p-5 items-center justify-center ${className || ''}`} style={style}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {message ? (
        <Text className="mt-3 text-[13px] text-textSecondary font-medium">{message}</Text>
      ) : null}
    </View>
  );
};
