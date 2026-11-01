import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../config/theme';
import { useHaptics } from '../../hooks/useHaptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  className?: string;
  textClassName?: string;
  hapticFeedback?: boolean;
}

const SIZE_CONTAINER_CLASSES: Record<ButtonSize, string> = {
  sm: 'py-2 px-3.5 rounded-xl',
  md: 'py-3.5 px-5 rounded-2xl',
  lg: 'py-4 px-6 rounded-2xl',
};

const VARIANT_CONTAINER_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary shadow-sm',
  secondary: 'bg-surface-subtle border border-border-subtle',
  outline: 'bg-transparent border-[1.5px] border-primary',
  ghost: 'bg-transparent',
};

const SIZE_TEXT_CLASSES: Record<ButtonSize, string> = {
  sm: 'text-xs font-semibold',
  md: 'text-[15px] font-semibold',
  lg: 'text-base font-bold',
};

const VARIANT_TEXT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-textPrimary',
  outline: 'text-primary',
  ghost: 'text-primary',
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  className,
  textClassName,
  hapticFeedback = true,
}) => {
  const haptics = useHaptics();

  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticFeedback) {
      haptics.light();
    }
    onPress();
  };

  const containerClasses = [
    'flex-row items-center justify-center',
    SIZE_CONTAINER_CLASSES[size],
    VARIANT_CONTAINER_CLASSES[variant],
    disabled ? 'opacity-50' : '',
    className || '',
  ].filter(Boolean).join(' ');

  const textClasses = [
    SIZE_TEXT_CLASSES[size],
    disabled ? 'text-textMuted' : VARIANT_TEXT_CLASSES[variant],
    icon ? (iconPosition === 'left' ? 'ml-2' : 'mr-2') : '',
    textClassName || '',
  ].filter(Boolean).join(' ');

  const loaderColor = variant === 'primary' ? theme.colors.white : theme.colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      disabled={disabled || loading}
      className={containerClasses}
      style={style}
    >
      {loading ? (
        <ActivityIndicator size="small" color={loaderColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' ? icon : null}
          <Text className={textClasses} style={textStyle}>
            {title}
          </Text>
          {icon && iconPosition === 'right' ? icon : null}
        </>
      )}
    </TouchableOpacity>
  );
};
