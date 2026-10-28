import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
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
  hapticFeedback?: boolean;
}

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

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      ...styles.base,
      ...styles[`size_${size}`],
    };

    switch (variant) {
      case 'secondary':
        return {
          ...base,
          backgroundColor: theme.colors.surfaceContainer,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
        };
      case 'primary':
      default:
        return {
          ...base,
          backgroundColor: theme.colors.primary,
          ...theme.shadows.subtle,
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return theme.colors.textMuted;
    switch (variant) {
      case 'secondary':
        return theme.colors.textPrimary;
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      case 'primary':
      default:
        return theme.colors.onPrimary;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        getContainerStyle(),
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? theme.colors.onPrimary : theme.colors.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' ? icon : null}
          <Text
            style={[
              styles.text,
              styles[`textSize_${size}`],
              { color: getTextColor() },
              icon ? (iconPosition === 'left' ? styles.iconLeftText : styles.iconRightText) : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' ? icon : null}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
  },
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
  },
  size_md: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.radius.lg,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 26,
    borderRadius: theme.radius.xl,
  },
  text: {
    fontWeight: theme.typography.weights.semibold,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  textSize_sm: {
    fontSize: theme.typography.sizes.sm,
  },
  textSize_md: {
    fontSize: theme.typography.sizes.base,
  },
  textSize_lg: {
    fontSize: theme.typography.sizes.md,
  },
  iconLeftText: {
    marginLeft: 8,
  },
  iconRightText: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});
