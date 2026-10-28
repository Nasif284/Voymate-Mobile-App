import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../../../store/authStore';
import { theme } from '../../../config/theme';
import { Compass } from 'lucide-react-native';

export const SplashScreen: React.FC = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Slight pause to ensure pleasant splash brand transition
    const timer = setTimeout(() => {
      initializeAuth();
    }, 600);
    return () => clearTimeout(timer);
  }, [initializeAuth]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <Compass size={44} color={theme.colors.onPrimary} />
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
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  brandTitle: {
    fontSize: theme.typography.sizes.display,
    fontWeight: theme.typography.weights.black,
    color: theme.colors.onPrimary,
    letterSpacing: 4,
  },
  brandSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primaryLight,
    marginTop: theme.spacing.sm,
    letterSpacing: 0.5,
  },
});
