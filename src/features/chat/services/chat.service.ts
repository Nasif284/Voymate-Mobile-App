import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { Conversation, ChatMessage } from '../types';

export const chatService = {
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const res = await apiClient.get(ENDPOINTS.CHAT.CONVERSATIONS);
      const data = res.data?.data;
      if (Array.isArray(data?.conversations)) return data.conversations;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      console.warn('Error fetching conversations:', err);
      return [];
    }
  },

  getDirectChat: async (targetUserId: string): Promise<string | null> => {
    try {
      const res = await apiClient.get(ENDPOINTS.CHAT.DIRECT(targetUserId));
      return res.data?.data?.conversationId || null;
    } catch (err) {
      console.warn('Error getting direct conversation:', err);
      return null;
    }
  },

  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      const res = await apiClient.get(ENDPOINTS.CHAT.MESSAGES(conversationId));
      const data = res.data?.data;
      if (Array.isArray(data?.messages)) return data.messages;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      console.warn('Error getting messages:', err);
      return [];
    }
  },
};
