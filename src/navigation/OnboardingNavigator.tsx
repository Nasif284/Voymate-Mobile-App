import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from './types';
import { useAuthStore } from '../store/authStore';
import { ReferralSourceScreen } from '../features/onboarding/screens/ReferralSourceScreen';
import { ProfileDetailsScreen } from '../features/onboarding/screens/ProfileDetailsScreen';
import { TravelStyleScreen } from '../features/onboarding/screens/TravelStyleScreen';
import { InitialTripPlanScreen } from '../features/onboarding/screens/InitialTripPlanScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  const { onboarding } = useAuthStore();

  const getInitialRouteName = (): keyof OnboardingStackParamList => {
    switch (onboarding.step) {
      case 2:
        return 'ProfileDetails';
      case 3:
        return 'TravelStyle';
      case 4:
        return 'InitialTripPlan';
      case 1:
      default:
        return 'ReferralSource';
    }
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="ReferralSource" component={ReferralSourceScreen} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
      <Stack.Screen name="TravelStyle" component={TravelStyleScreen} />
      <Stack.Screen name="InitialTripPlan" component={InitialTripPlanScreen} />
    </Stack.Navigator>
  );
};
