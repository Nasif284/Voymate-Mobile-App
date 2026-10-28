import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { theme } from '../../config/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
}) => {
  const getCardStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          ...styles.base,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        };
      case 'flat':
        return {
          ...styles.base,
          backgroundColor: theme.colors.surfaceContainer,
        };
      case 'elevated':
      default:
        return {
          ...styles.base,
          ...theme.shadows.card,
        };
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={[getCardStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
  },
});
