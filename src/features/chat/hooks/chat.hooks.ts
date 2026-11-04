import { useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../api/queryClient';
import { chatService } from '../services/chat.service';
import { ChatMessage, Conversation } from '../types';
import { socketService } from '../services/socket.service';

/**
 * Optimistically zeroes out the unreadCount for a conversation in the local React Query cache.
 */
export function markConversationAsReadInCache(
  queryClient: QueryClient,
  conversationId: string
): void {
  queryClient.setQueryData<Conversation[]>(QUERY_KEYS.conversations, (prev = []) => {
    let changed = false;
    const updated = prev.map((c) => {
      if (c.conversationId === conversationId && (c.unreadCount || 0) > 0) {
        changed = true;
        return { ...c, unreadCount: 0 };
      }
      return c;
    });
    return changed ? updated : prev;
  });
}

/**
 * In-memory update for QUERY_KEYS.conversations when a message is received or sent.
 * Completely eliminates redundant HTTP GET /conversations refetches and race conditions.
 */
export function updateConversationInCache(
  queryClient: QueryClient,
  newMsg: ChatMessage,
  currentUserId?: string
): void {
  const isViewingThisChat = socketService.getActiveConversationId() === newMsg.conversationId;

  queryClient.setQueryData<Conversation[]>(QUERY_KEYS.conversations, (prev = []) => {
    const existingIdx = prev.findIndex((c) => c.conversationId === newMsg.conversationId);
    if (existingIdx !== -1) {
      const updated = [...prev];
      const target = { ...updated[existingIdx] };
      target.lastMessage = {
        content: newMsg.content,
        createdAt: newMsg.createdAt,
        senderId: newMsg.senderId,
        type: newMsg.type,
        status: newMsg.status,
      };
      if (isViewingThisChat) {
        target.unreadCount = 0;
      } else if (newMsg.senderId !== currentUserId) {
        target.unreadCount = (target.unreadCount || 0) + 1;
      }
      updated.splice(existingIdx, 1);
      return [target, ...updated];
    } else {
      // If conversation is brand new and not yet in cache, fetch it from backend
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
      return prev;
    }
  });
}

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
