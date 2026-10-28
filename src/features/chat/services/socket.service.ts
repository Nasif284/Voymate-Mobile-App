import { io, Socket } from 'socket.io-client';
import { ENV } from '../../../config/env';
import { storageService } from '../../../services/storage/storage.service';
import { ChatMessage } from '../types';

let socket: Socket | null = null;

export const socketService = {
  getSocket: (): Socket | null => socket,

  connect: async (): Promise<Socket | null> => {
    if (socket?.connected) {
      return socket;
    }

    try {
      const token = await storageService.getAccessToken();

      socket = io(ENV.SOCKET_URL, {
        autoConnect: false,
        transports: ['websocket'],
        auth: {
          token: token || '',
        },
        extraHeaders: {
          Cookie: token ? `accessToken=${token}` : '',
        },
      });

      socket.connect();

      socket.on('connect', () => {
        console.log('[Socket] Connected to server, id:', socket?.id);
      });

      socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
      });

      return socket;
    } catch (err) {
      console.warn('[Socket] Init error:', err);
      return null;
    }
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  joinConversation: (conversationId: string) => {
    if (!socket?.connected) return;
    socket.emit('chat:join', conversationId);
  },

  leaveConversation: (conversationId: string) => {
    if (!socket?.connected) return;
    socket.emit('chat:leave', conversationId);
  },

  sendMessage: (
    target: { conversationId?: string; recipientId?: string },
    content: string
  ) => {
    if (!socket?.connected) return;
    socket.emit('chat:send', {
      ...(target.conversationId ? { conversationId: target.conversationId } : {}),
      ...(target.recipientId ? { recipientId: target.recipientId } : {}),
      type: 'TEXT',
      content,
    });
  },

  sendImageMessage: (
    target: { conversationId?: string; recipientId?: string },
    attachment: any
  ) => {
    if (!socket?.connected) return;
    socket.emit('chat:send', {
      ...(target.conversationId ? { conversationId: target.conversationId } : {}),
      ...(target.recipientId ? { recipientId: target.recipientId } : {}),
      type: 'IMAGE',
      attachment,
    });
  },

  markAsRead: (conversationId: string) => {
    if (!socket?.connected || !conversationId) return;
    socket.emit('chat:read', { conversationId });
  },

  onMessage: (callback: (message: ChatMessage) => void) => {
    if (!socket) return;
    socket.on('chat:message', callback);
  },

  offMessage: (callback: (message: ChatMessage) => void) => {
    if (!socket) return;
    socket.off('chat:message', callback);
  },

  onMessagesRead: (
    callback: (data: { conversationId: string; readerId: string; readAt: string }) => void
  ) => {
    if (!socket) return;
    socket.on('chat:messages_read', callback);
  },

  offMessagesRead: (callback: (data: any) => void) => {
    if (!socket) return;
    socket.off('chat:messages_read', callback);
  },

  onPresenceChange: (callback: (data: { userId: string; isOnline: boolean }) => void) => {
    if (!socket) return;
    socket.on('presence:user_online', (data: { userId: string }) => {
      callback({ userId: data.userId, isOnline: true });
    });
    socket.on('presence:user_offline', (data: { userId: string }) => {
      callback({ userId: data.userId, isOnline: false });
    });
  },
};
