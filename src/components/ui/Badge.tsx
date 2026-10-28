import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../config/theme';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'mint' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'mint',
  icon,
  style,
  textStyle,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: theme.colors.successLight,
          text: theme.colors.success,
        };
      case 'warning':
        return {
          bg: theme.colors.warningLight,
          text: theme.colors.warning,
        };
      case 'error':
        return {
          bg: theme.colors.errorLight,
          text: theme.colors.error,
        };
      case 'neutral':
        return {
          bg: theme.colors.surfaceContainer,
          text: theme.colors.textSecondary,
        };
      case 'mint':
      default:
        return {
          bg: theme.colors.primaryLight,
          text: theme.colors.primary,
        };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text style={[styles.label, { color: colors.text }, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.2,
  },
});
