import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../api/queryClient';
import { chatService } from '../services/chat.service';
import { ChatMessage } from '../types';

export function useGetConversations(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: () => chatService.getConversations(),
    enabled,
  });
}

export function useGetDirectChat(targetUserId?: string, enabled = false) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: QUERY_KEYS.directChat(targetUserId || ''),
    queryFn: async () => {
      if (!targetUserId) return null;
      const convId = await chatService.getDirectChat(targetUserId);
      if (convId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
      }
      return convId;
    },
    enabled: Boolean(targetUserId) && enabled,
  });
}

export function useGetMessages(conversationId?: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.messages(conversationId || ''),
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!conversationId) return [];
      const msgs = await chatService.getMessages(conversationId);
      // Reverse for inverted FlatList (newest first)
      return [...msgs].reverse();
    },
    enabled: Boolean(conversationId),
  });
}
