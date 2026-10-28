import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuthStore } from '../store/authStore';
import { SplashScreen } from '../features/auth/screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { UserProfileScreen } from '../features/profile/screens/UserProfileScreen';
import { ConnectionsScreen } from '../features/connections/screens/ConnectionsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isVerified, isLoading, onboarding, user } = useAuthStore();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !isVerified ? (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          initialParams={{
            screen: 'VerifyEmail',
            params: { email: user?.email || '' },
          }}
        />
      ) : !onboarding.isCompleted ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="TravelerDetail"
            component={UserProfileScreen as any}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Connections"
            component={ConnectionsScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
