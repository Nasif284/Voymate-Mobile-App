import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationApi } from '../api/notification.api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let registeredPushToken: string | null = null;

export const pushNotificationService = {
  async registerForPushNotificationsAsync(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#059669',
        });
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) {
          console.warn('[Push] Permission not granted for notifications');
        }
        return null;
      }

      if (!Device.isDevice) {
        return null;
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        if (__DEV__) {
          console.info(
            '[Push] Local notification permissions granted. Remote Expo token registration skipped (no EAS projectId configured).',
          );
        }
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const token = tokenData.data;

      if (token && token !== registeredPushToken) {
        registeredPushToken = token;
        const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
        await notificationApi.registerDevice({
          token,
          platform,
          deviceId: Device.modelName ?? undefined,
        });
      }

      return token;
    } catch (error) {
      if (__DEV__) {
        console.warn('[Push] Error registering push notifications:', error);
      }
      return null;
    }
  },

  async presentLocalNotification(payload: {
    title: string;
    body: string;
    data?: Record<string, unknown> | null;
  }): Promise<void> {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: (payload.data as Record<string, unknown>) ?? {},
          sound: 'default',
        },
        trigger: null,
      });
    } catch (err) {
      if (__DEV__) {
        console.warn('[Push] Failed to present local notification:', err);
      }
    }
  },

  async unregisterCurrentDevice(): Promise<void> {
    if (registeredPushToken) {
      try {
        await notificationApi.unregisterDevice(registeredPushToken);
      } catch (err) {
        if (__DEV__) {
          console.warn('[Push] Failed to unregister device token:', err);
        }
      } finally {
        registeredPushToken = null;
      }
    }
  },

  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void,
  ) {
    return Notifications.addNotificationReceivedListener(listener);
  },

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void,
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  },
};
