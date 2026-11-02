import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../../store/authStore';
import { theme } from '../../../config/theme';
import { VoymateLogo } from '../../../components/ui/VoymateLogo';

export const SplashScreen: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.logoContainer}>
        <View style={styles.logoShadowWrapper}>
          <VoymateLogo size={88} variant="rose" withBackground />
        </View>
        <Text style={styles.brandTitle}>VOYMATE</Text>
        <Text style={styles.brandSubtitle}>Find Your Journey. Never Travel Alone.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoShadowWrapper: {
    marginBottom: theme.spacing.xl,
    ...theme.shadows.card,
  },
  brandTitle: {
    fontSize: theme.typography.sizes.display,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    letterSpacing: 4,
  },
  brandSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
    letterSpacing: 0.5,
  },
});
