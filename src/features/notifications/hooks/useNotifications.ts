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
import {
  NotificationItem,
  NotificationPaginationResult,
} from '../../../types/notification.types';

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
    staleTime: 1000 * 60, // 1 minute stale time (kept fresh via Socket.io)
  });
}

export function useUnreadNotificationCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // Kept live via Socket.io events
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onMutate: async (id: string) => {
      // Optimistically mark as read in cache
      queryClient.setQueriesData<NotificationPaginationResult>(
        { queryKey: ['notifications', 'list'] },
        (old) => {
          if (!old) return old;
          const target = old.notifications.find((n) => n.id === id);
          const wasUnread = target && !target.isRead;
          return {
            ...old,
            unreadCount: wasUnread
              ? Math.max(0, old.unreadCount - 1)
              : old.unreadCount,
            notifications: old.notifications.map((n) =>
              n.id === id ? { ...n, isRead: true } : n,
            ),
          };
        },
      );

      queryClient.setQueryData<number>(
        NOTIFICATION_QUERY_KEYS.unreadCount,
        (old) => (typeof old === 'number' ? Math.max(0, old - 1) : 0),
      );
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onMutate: async () => {
      queryClient.setQueriesData<NotificationPaginationResult>(
        { queryKey: ['notifications', 'list'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            unreadCount: 0,
            notifications: old.notifications.map((n) => ({
              ...n,
              isRead: true,
            })),
          };
        },
      );

      queryClient.setQueryData<number>(NOTIFICATION_QUERY_KEYS.unreadCount, 0);
    },
  });
}

/**
 * Hook to automatically register push token on auth and handle real-time socket events
 * with zero-refetch optimistic cache updates.
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

      const handleNewNotification = (
        rawPayload: NotificationItem & { props?: NotificationItem },
      ) => {
        const incoming: NotificationItem =
          rawPayload && 'props' in rawPayload && rawPayload.props
            ? rawPayload.props
            : rawPayload;

        if (!incoming?.id) return;

        let isCollapsedUpdate = false;

        // Optimistically update notification lists in memory
        queryClient.setQueriesData<NotificationPaginationResult>(
          { queryKey: ['notifications', 'list'] },
          (old) => {
            if (!old) return old;
            const existingIndex = old.notifications.findIndex(
              (n) => n.id === incoming.id,
            );

            if (existingIndex !== -1) {
              // Collapsed update for an existing unread chat notification
              isCollapsedUpdate = true;
              const wasRead = old.notifications[existingIndex].isRead;
              const filtered = old.notifications.filter(
                (n) => n.id !== incoming.id,
              );
              return {
                ...old,
                unreadCount: wasRead ? old.unreadCount + 1 : old.unreadCount,
                notifications: [incoming, ...filtered],
              };
            }

            return {
              ...old,
              total: old.total + 1,
              unreadCount: old.unreadCount + 1,
              notifications: [incoming, ...old.notifications],
            };
          },
        );

        // Optimistically increment badge count only if not an already-unread collapsed row
        if (!isCollapsedUpdate) {
          queryClient.setQueryData<number>(
            NOTIFICATION_QUERY_KEYS.unreadCount,
            (old) => (typeof old === 'number' ? old + 1 : 1),
          );
        }
      };

      const handleConversationRead = (payload: {
        conversationId: string;
        updatedCount: number;
      }) => {
        if (!payload?.conversationId) return;

        queryClient.setQueriesData<NotificationPaginationResult>(
          { queryKey: ['notifications', 'list'] },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              unreadCount: Math.max(
                0,
                old.unreadCount - (payload.updatedCount || 1),
              ),
              notifications: old.notifications.map((n) => {
                const convId = (n.data as Record<string, unknown> | null)
                  ?.conversationId;
                if (n.type === 'CHAT_MESSAGE' && convId === payload.conversationId) {
                  return { ...n, isRead: true };
                }
                return n;
              }),
            };
          },
        );

        queryClient.setQueryData<number>(
          NOTIFICATION_QUERY_KEYS.unreadCount,
          (old) =>
            typeof old === 'number'
              ? Math.max(0, old - (payload.updatedCount || 1))
              : 0,
        );
      };

      socket.on('notification:new', handleNewNotification);
      socket.on('notification:conversation_read', handleConversationRead);

      cleanupSocket = () => {
        socket.off('notification:new', handleNewNotification);
        socket.off('notification:conversation_read', handleConversationRead);
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
