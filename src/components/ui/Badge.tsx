import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'mint' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
  textClassName?: string;
}

const VARIANT_CONTAINER_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-success-light',
  warning: 'bg-warning-light',
  error: 'bg-error-light',
  neutral: 'bg-surface-container',
  mint: 'bg-surface border border-primary',
};

const VARIANT_TEXT_CLASSES: Record<BadgeVariant, string> = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  neutral: 'text-textSecondary',
  mint: 'text-primary',
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'mint',
  icon,
  style,
  textStyle,
  className,
  textClassName,
}) => {
  return (
    <View
      className={cn(
        'flex-row items-center px-2.5 py-1 rounded-full self-start',
        VARIANT_CONTAINER_CLASSES[variant],
        className
      )}
      style={style}
    >
      {icon ? <View className="mr-1">{icon}</View> : null}
      <Text
        className={cn(
          'text-[11px] font-semibold tracking-wide',
          VARIANT_TEXT_CLASSES[variant],
          textClassName
        )}
        style={textStyle}
      >
        {label}
      </Text>
    </View>
  );
};
