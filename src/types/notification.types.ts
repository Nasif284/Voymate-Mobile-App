export type NotificationType =
  | 'CONNECTION_REQUEST'
  | 'CONNECTION_ACCEPTED'
  | 'CHAT_MESSAGE'
  | 'TRIP_MATCH'
  | 'SYSTEM_ALERT';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface NotificationPaginationResult {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface RegisterDevicePayload {
  token: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  deviceId?: string;
}
