import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../../navigation/types';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/authStore';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'InitialTripPlan'>;

export const InitialTripPlanScreen: React.FC<Props> = () => {
  const setOnboarding = useAuthStore((state) => state.setOnboarding);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 p-6 justify-between">
        <View className="mt-5">
          <Text className="text-[13px] font-semibold text-primary mb-2">Step 4 of 4</Text>
          <Text className="text-[26px] font-medium text-textPrimary">Where are you headed?</Text>
          <Text className="text-sm text-textSecondary mt-2 leading-5">
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
