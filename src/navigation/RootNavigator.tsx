import React, { useCallback } from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from './types';
import { useAuthStore } from '../store/authStore';
import { SplashScreen } from '../features/auth/screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { UserProfileScreen } from '../features/profile/screens/UserProfileScreen';
import { ConnectionsScreen } from '../features/connections/screens/ConnectionsScreen';
import { TripsScreen } from '../features/trips/screens/TripsScreen';
import { ChatRoomScreen } from '../features/chat/screens/ChatRoomScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { usePushNotificationSetup } from '../features/notifications/hooks/useNotifications';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isVerified, isLoading, onboarding, user } =
    useAuthStore();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleNotificationTap = useCallback(
    (data?: Record<string, unknown> | null) => {
      if (!data) return;

      if (data.type === 'CONNECTION_REQUEST') {
        navigation.navigate('Connections', {
          initialTab: 'requests',
          initialSubTab: 'incoming',
        });
      } else if (data.type === 'CONNECTION_ACCEPTED') {
        navigation.navigate('Connections', {
          initialTab: 'connections',
        });
      } else if (data.type === 'CHAT_MESSAGE' && data.senderId) {
        navigation.navigate('ChatRoom', {
          conversationId: data.conversationId as string | undefined,
          targetUserId: data.senderId as string,
          targetUserName: 'Chat',
        });
      }
    },
    [navigation],
  );

  usePushNotificationSetup(handleNotificationTap);

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
            name="Connections"
            component={ConnectionsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Trips"
            component={TripsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="ChatRoom"
            component={ChatRoomScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};
