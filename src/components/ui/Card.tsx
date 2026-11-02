import React from 'react';
import { View, ViewStyle, TouchableOpacity } from 'react-native';
import { theme } from '../../config/theme';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
}

const VARIANT_CLASSES: Record<'elevated' | 'outlined' | 'flat', string> = {
  elevated: 'shadow-card',
  outlined: 'border border-border-subtle',
  flat: 'bg-surface-container',
};

export const Card: React.FC<CardProps> = ({
  children,
  style,
  className,
  onPress,
  variant = 'elevated',
}) => {
  const cardClasses = cn(
    'bg-surface rounded-xl p-4',
    VARIANT_CLASSES[variant],
    className
  );

  const shadowFallback = variant === 'elevated' ? theme.shadows.card : undefined;

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        className={cardClasses}
        style={[shadowFallback, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={cardClasses} style={[shadowFallback, style]}>
      {children}
    </View>
  );
};
