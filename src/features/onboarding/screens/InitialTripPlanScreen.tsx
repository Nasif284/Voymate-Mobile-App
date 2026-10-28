import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/authStore';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'InitialTripPlan'>;

export const InitialTripPlanScreen: React.FC<Props> = () => {
  const setOnboarding = useAuthStore((state) => state.setOnboarding);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.stepText}>Step 4 of 4</Text>
          <Text style={styles.title}>Where are you headed?</Text>
          <Text style={styles.subtitle}>
            Your travel plan will be shown to potential travel mates.
          </Text>
        </View>

        <Button
          title="Complete Onboarding"
          variant="primary"
          onPress={() => setOnboarding(4, true)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: 20,
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
});
