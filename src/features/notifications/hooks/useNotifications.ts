import { useEffect } from 'react';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  InfiniteData,
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
  infinite: (params?: { limit?: number; unreadOnly?: boolean }) =>
    ['notifications', 'infinite', params] as const,
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
    staleTime: 1000 * 60,
  });
}

export function useInfiniteNotificationsQuery(params?: {
  limit?: number;
  unreadOnly?: boolean;
}) {
  const limit = params?.limit ?? 20;
  return useInfiniteQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.infinite(params),
    queryFn: ({ pageParam = 1 }) =>
      notificationApi.getNotifications({
        page: pageParam,
        limit,
        unreadOnly: params?.unreadOnly,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
    staleTime: 1000 * 60,
  });
}

export function useUnreadNotificationCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    queryFn: () => notificationApi.getUnreadCount(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onMutate: async (id: string) => {
      // 1. Update infinite query pages optimistically
      queryClient.setQueriesData<InfiniteData<NotificationPaginationResult>>(
        { queryKey: ['notifications', 'infinite'] },
        (old) => {
          if (!old) return old;
          let wasUnread = false;
          for (const page of old.pages) {
            const target = page.notifications.find((n) => n.id === id);
            if (target && !target.isRead) {
              wasUnread = true;
              break;
            }
          }
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              unreadCount: wasUnread
                ? Math.max(0, page.unreadCount - 1)
                : page.unreadCount,
              notifications: page.notifications.map((n) =>
                n.id === id ? { ...n, isRead: true } : n,
              ),
            })),
          };
        },
      );

      // 2. Update standard list query optimistically
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

      // 3. Decrement unread count badge
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
      queryClient.setQueriesData<InfiniteData<NotificationPaginationResult>>(
        { queryKey: ['notifications', 'infinite'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              unreadCount: 0,
              notifications: page.notifications.map((n) => ({
                ...n,
                isRead: true,
              })),
            })),
          };
        },
      );

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
 * with zero-refetch optimistic cache updates and foreground local banner presentation.
 */
export function usePushNotificationSetup(
  onNotificationTap?: (data?: Record<string, unknown> | null) => void,
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Register device token & permissions
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

        // Present native drop-down banner for incoming real-time notification
        pushNotificationService.presentLocalNotification({
          title: incoming.title,
          body: incoming.body,
          data: incoming.data ?? null,
        });

        // Optimistically update infinite query pages
        queryClient.setQueriesData<InfiniteData<NotificationPaginationResult>>(
          { queryKey: ['notifications', 'infinite'] },
          (old) => {
            if (!old || old.pages.length === 0) return old;

            let wasFound = false;
            let wasPreviouslyRead = false;

            const strippedPages = old.pages.map((page) => {
              const match = page.notifications.find(
                (n) => n.id === incoming.id,
              );
              if (match) {
                wasFound = true;
                wasPreviouslyRead = match.isRead;
              }
              return {
                ...page,
                notifications: page.notifications.filter(
                  (n) => n.id !== incoming.id,
                ),
              };
            });

            if (wasFound) {
              isCollapsedUpdate = true;
            }

            return {
              ...old,
              pages: strippedPages.map((page, index) => {
                const nextUnread = wasFound
                  ? wasPreviouslyRead
                    ? page.unreadCount + 1
                    : page.unreadCount
                  : page.unreadCount + 1;
                const nextTotal = wasFound ? page.total : page.total + 1;

                if (index === 0) {
                  return {
                    ...page,
                    total: nextTotal,
                    unreadCount: nextUnread,
                    notifications: [incoming, ...page.notifications],
                  };
                }
                return {
                  ...page,
                  total: nextTotal,
                  unreadCount: nextUnread,
                };
              }),
            };
          },
        );

        // Optimistically update standard list queries
        queryClient.setQueriesData<NotificationPaginationResult>(
          { queryKey: ['notifications', 'list'] },
          (old) => {
            if (!old) return old;
            const existingIndex = old.notifications.findIndex(
              (n) => n.id === incoming.id,
            );

            if (existingIndex !== -1) {
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

        queryClient.setQueriesData<InfiniteData<NotificationPaginationResult>>(
          { queryKey: ['notifications', 'infinite'] },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                unreadCount: Math.max(
                  0,
                  page.unreadCount - (payload.updatedCount || 1),
                ),
                notifications: page.notifications.map((n) => {
                  const convId = (n.data as Record<string, unknown> | null)
                    ?.conversationId;
                  if (
                    n.type === 'CHAT_MESSAGE' &&
                    convId === payload.conversationId
                  ) {
                    return { ...n, isRead: true };
                  }
                  return n;
                }),
              })),
            };
          },
        );

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
                if (
                  n.type === 'CHAT_MESSAGE' &&
                  convId === payload.conversationId
                ) {
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
