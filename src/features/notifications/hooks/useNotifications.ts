import { useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { notificationApi } from '../api/notification.api';
import { pushNotificationService } from '../services/pushNotification.service';
import { socketService } from '../../chat/services/socket.service';
import { useAuthStore } from '../../../store/authStore';

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export function useNotificationsQuery(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(params),
    queryFn: () => notificationApi.getNotifications(params),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useUnreadNotificationCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 1000 * 60, // Poll every minute as fallback
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_QUERY_KEYS.all,
      });
    },
  });
}

/**
 * Hook to automatically register push token on auth and handle real-time socket events
 */
export function usePushNotificationSetup(
  onNotificationTap?: (data?: Record<string, unknown> | null) => void,
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Register device token for push notifications
    pushNotificationService.registerForPushNotificationsAsync();

    // 2. Real-time socket event listener for in-app updates
    let cleanupSocket: (() => void) | undefined;
    socketService.connect().then((socket) => {
      if (!socket) return;

      const handleNewNotification = () => {
        // Invalidate queries so badges and notification lists update live
        queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.all,
        });
      };

      socket.on('notification:new', handleNewNotification);

      cleanupSocket = () => {
        socket.off('notification:new', handleNewNotification);
      };
    });

    // 3. Push notification response (tap) listener
    const responseSub =
      pushNotificationService.addNotificationResponseReceivedListener(
        (response) => {
          const rawData = response.notification.request.content.data;
          if (onNotificationTap) {
            onNotificationTap(rawData as Record<string, unknown>);
          }
        },
      );

    return () => {
      cleanupSocket?.();
      responseSub.remove();
    };
  }, [isAuthenticated, queryClient, onNotificationTap]);
}
