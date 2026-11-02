import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
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
    <View className="flex-1 bg-surface items-center justify-center">
      <StatusBar style="dark" />
      <View className="items-center">
        <View className="mb-5 shadow-card" style={theme.shadows.card}>
          <VoymateLogo size={88} variant="rose" withBackground />
        </View>
        <Text className="text-display font-bold text-textPrimary tracking-[4px]">
          VOYMATE
        </Text>
        <Text className="text-[13px] text-textMuted mt-2 tracking-[0.5px]">
          Find Your Journey. Never Travel Alone.
        </Text>
      </View>
    </View>
  );
};
