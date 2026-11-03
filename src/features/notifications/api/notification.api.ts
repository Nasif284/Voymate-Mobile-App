import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  NotificationPaginationResult,
  RegisterDevicePayload,
} from '../../../types/notification.types';

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
    return res.data.data;
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
