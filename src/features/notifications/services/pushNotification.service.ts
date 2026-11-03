import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import * as Device from 'expo-device';
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

    if (!Device.isDevice) {
      if (__DEV__) {
        console.log('[Push] Must use physical device for push notifications');
      }
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
          console.warn('[Push] Permission not granted for push notifications');
        }
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
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
