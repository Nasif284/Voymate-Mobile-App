import { io, Socket } from 'socket.io-client';
import { ENV } from '../../../config/env';
import { storageService } from '../../../services/storage/storage.service';
import { ChatMessage } from '../types';

let socket: Socket | null = null;
let connectingPromise: Promise<Socket | null> | null = null;

export const socketService = {
  getSocket: (): Socket | null => socket,

  connect: async (): Promise<Socket | null> => {
    if (socket?.connected) {
      return socket;
    }

    if (connectingPromise) {
      return connectingPromise;
    }

    connectingPromise = (async () => {
      try {
        const token = await storageService.getAccessToken();
        if (!token) {
          return null;
        }

        if (!socket) {
          socket = io(ENV.SOCKET_URL, {
            autoConnect: false,
            transports: ['websocket'],
            auth: {
              token,
            },
            extraHeaders: {
              Cookie: `accessToken=${token}`,
            },
          });

          socket.on('connect_error', (err) => {
            if (__DEV__) {
              console.warn('[Socket] Connection error:', err.message);
            }
          });
        } else {
          socket.auth = { token };
        }

        if (!socket.connected) {
          socket.connect();
        }

        return socket;
      } catch (err) {
        if (__DEV__) {
          console.warn('[Socket] Init error:', err);
        }
        return null;
      } finally {
        connectingPromise = null;
      }
    })();

    return connectingPromise;
  },

  disconnect: () => {
    connectingPromise = null;
    if (socket) {
      socket.removeAllListeners();
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

  markAsRead: (conversationId: string) => {
    if (!socket?.connected || !conversationId) return;
    socket.emit('chat:read', { conversationId });
  },

  onMessage: (callback: (message: ChatMessage) => void): (() => void) => {
    if (!socket) return () => {};
    socket.on('chat:message', callback);
    return () => {
      socket?.off('chat:message', callback);
    };
  },

  offMessage: (callback: (message: ChatMessage) => void) => {
    socket?.off('chat:message', callback);
  },

  onMessagesRead: (
    callback: (data: { conversationId: string; readerId: string; readAt: string }) => void
  ): (() => void) => {
    if (!socket) return () => {};
    socket.on('chat:messages_read', callback);
    return () => {
      socket?.off('chat:messages_read', callback);
    };
  },

  offMessagesRead: (callback: (data: any) => void) => {
    socket?.off('chat:messages_read', callback);
  },

  onPresenceChange: (
    callback: (data: { userId: string; isOnline: boolean }) => void
  ): (() => void) => {
    if (!socket) return () => {};

    const handleOnline = (data: { userId: string }) => {
      callback({ userId: data.userId, isOnline: true });
    };
    const handleOffline = (data: { userId: string }) => {
      callback({ userId: data.userId, isOnline: false });
    };

    socket.on('presence:user_online', handleOnline);
    socket.on('presence:user_offline', handleOffline);

    return () => {
      socket?.off('presence:user_online', handleOnline);
      socket?.off('presence:user_offline', handleOffline);
    };
  },
};
