import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  NotificationItem,
  NotificationPaginationResult,
  RegisterDevicePayload,
} from '../../../types/notification.types';

const normalizeNotificationItem = (
  item: NotificationItem & { props?: NotificationItem },
): NotificationItem => {
  if (item && typeof item === 'object' && 'props' in item && item.props) {
    return item.props;
  }
  return item;
};

export const notificationApi = {
  async registerDevice(payload: RegisterDevicePayload): Promise<void> {
    await apiClient.post(ENDPOINTS.NOTIFICATIONS.REGISTER_DEVICE, payload);
  },

  async unregisterDevice(token: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.NOTIFICATIONS.UNREGISTER_DEVICE, {
      data: { token },
    });
  },

  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationPaginationResult> {
    const res = await apiClient.get<{
      success: boolean;
      data: NotificationPaginationResult;
    }>(ENDPOINTS.NOTIFICATIONS.LIST, { params });

    const payload = res.data.data;
    return {
      ...payload,
      notifications: (payload?.notifications ?? []).map(
        normalizeNotificationItem,
      ),
    };
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<{
      success: boolean;
      data: { unreadCount: number };
    }>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    return res.data.data?.unreadCount ?? 0;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  },

  async markAllAsRead(): Promise<{ updatedCount: number }> {
    const res = await apiClient.patch<{
      success: boolean;
      data: { updatedCount: number };
    }>(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    return res.data.data;
  },
};
