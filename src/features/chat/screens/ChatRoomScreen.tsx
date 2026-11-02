import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { QUERY_KEYS } from '../../../api/queryClient';
import { useGetDirectChat, useGetMessages } from '../hooks/chat.hooks';
import { socketService } from '../services/socket.service';
import { ChatMessage } from '../types';
import { useAuthStore } from '../../../store/authStore';
import {
  ChevronLeft,
  Send,
  Check,
  CheckCheck,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { cn } from '../../../utils/cn';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

const formatMessageTime = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const formatDateDivider = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

export const ChatRoomScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const {
    conversationId: initialConvId,
    targetUserId,
    targetUserName,
    targetUserAvatar,
  } = route.params;

  const [inputText, setInputText] = useState('');
  const [isTargetOnline, setIsTargetOnline] = useState(false);

  // TanStack Query Hooks
  const {
    data: resolvedConvId,
    isLoading: isLoadingDirectChat,
  } = useGetDirectChat(targetUserId, !initialConvId && Boolean(targetUserId));

  const conversationId = initialConvId || resolvedConvId || null;

  const {
    data: messages = [],
    isLoading: isLoadingMessages,
  } = useGetMessages(conversationId);

  const isLoading = isLoadingDirectChat || (Boolean(conversationId) && isLoadingMessages);

  useEffect(() => {
    let isMounted = true;
    let unsubMessage: (() => void) | undefined;
    let unsubRead: (() => void) | undefined;
    let unsubPresence: (() => void) | undefined;

    // Listen for incoming messages and update React Query cache
    const handleIncomingMessage = (newMsg: ChatMessage) => {
      const activeConvId = conversationId || newMsg.conversationId;
      if (
        newMsg.conversationId === conversationId ||
        (!conversationId && newMsg.senderId === targetUserId)
      ) {
        if (activeConvId) {
          queryClient.setQueryData<ChatMessage[]>(
            QUERY_KEYS.messages(activeConvId),
            (prev = []) => [newMsg, ...prev]
          );
          socketService.markAsRead(activeConvId);
        }
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations });
      }
    };

    // Listen for read receipts
    const handleMessagesRead = (data: { conversationId: string; readerId: string }) => {
      if (data.conversationId === conversationId && data.readerId !== currentUser?.id && conversationId) {
        queryClient.setQueryData<ChatMessage[]>(
          QUERY_KEYS.messages(conversationId),
          (prev = []) =>
            prev.map((m) =>
              m.senderId === currentUser?.id ? { ...m, status: 'READ' } : m
            )
        );
      }
    };

    // Listen for presence
    const handlePresence = (data: { userId: string; isOnline: boolean }) => {
      if (data.userId === targetUserId) {
        setIsTargetOnline(data.isOnline);
      }
    };

    socketService.connect().then(() => {
      if (!isMounted) return;
      unsubMessage = socketService.onMessage(handleIncomingMessage);
      unsubRead = socketService.onMessagesRead(handleMessagesRead);
      unsubPresence = socketService.onPresenceChange(handlePresence);

      if (conversationId) {
        socketService.joinConversation(conversationId);
        socketService.markAsRead(conversationId);
      }
    });

    return () => {
      isMounted = false;
      unsubMessage?.();
      unsubRead?.();
      unsubPresence?.();
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }
    };
  }, [conversationId, targetUserId, currentUser?.id, queryClient]);

  // Send Text Message
  const handleSendText = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');

    // Optimistic message in React Query cache
    if (conversationId) {
      const tempId = `temp_${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        conversationId,
        senderId: currentUser?.id || '',
        type: 'TEXT',
        content: trimmed,
        status: 'SENT',
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessage[]>(
        QUERY_KEYS.messages(conversationId),
        (prev = []) => [optimisticMsg, ...prev]
      );
    }

    socketService.sendMessage(
      {
        conversationId: conversationId || undefined,
        recipientId: !conversationId ? targetUserId : undefined,
      },
      trimmed
    );
  };

  const renderMessageItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isMe = item.senderId === currentUser?.id;
    const timeStr = formatMessageTime(item.createdAt);

    // Show date divider if previous message is from a different day
    const nextItem = messages[index + 1];
    const currentDate = new Date(item.createdAt).toDateString();
    const nextDate = nextItem ? new Date(nextItem.createdAt).toDateString() : null;
    const showDateDivider = currentDate !== nextDate;

    return (
      <View>
        {showDateDivider && (
          <View className="items-center my-3">
            <Text className="text-[11px] font-semibold text-text-muted bg-surface-subtle px-2.5 py-0.5 rounded-lg">
              {formatDateDivider(item.createdAt)}
            </Text>
          </View>
        )}

        <View
          className={cn(
            'flex-row my-0.5',
            isMe ? 'justify-end' : 'justify-start'
          )}
        >
          <View
            className={cn(
              'max-w-[78%] rounded-2xl px-3.5 py-2.5',
              isMe
                ? 'bg-primary rounded-br-sm'
                : 'bg-surface-subtle border border-border rounded-bl-sm'
            )}
          >
            {item.content ? (
              <Text
                className={cn(
                  'text-sm leading-5',
                  isMe ? 'text-white' : 'text-text-primary'
                )}
              >
                {item.content}
              </Text>
            ) : null}

            <View className="flex-row items-center justify-end gap-1 mt-1">
              <Text
                className={cn(
                  'text-[10px]',
                  isMe ? 'text-white/70' : 'text-text-muted'
                )}
              >
                {timeStr}
              </Text>

              {isMe && (
                <View className="ml-0.5">
                  {item.status === 'READ' ? (
                    <CheckCheck size={13} color={theme.colors.success} />
                  ) : (
                    <Check size={13} color="rgba(255, 255, 255, 0.7)" />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Top Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-3 bg-surface border-b border-border-subtle"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center flex-1 gap-2">
          <TouchableOpacity
            className="w-9 h-9 rounded-full items-center justify-center"
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center gap-2.5 flex-1"
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('UserProfile', {
                userId: targetUserId,
                variant: 'PUBLIC',
              })
            }
          >
            <View className="w-10 h-10 rounded-full relative">
              {targetUserAvatar ? (
                <Image source={{ uri: targetUserAvatar }} className="w-full h-full rounded-full" />
              ) : (
                <View className="w-full h-full rounded-full bg-primary items-center justify-center">
                  <Text className="text-base font-semibold text-white">
                    {targetUserName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              {isTargetOnline && (
                <View className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-white" />
              )}
            </View>

            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-text-primary" numberOfLines={1}>
                {targetUserName || 'Traveler'}
              </Text>
              <Text className="text-[11px] text-text-secondary mt-0.5">
                {isTargetOnline ? 'Active now' : 'Direct message'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages FlatList */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-base font-semibold text-text-primary text-center mb-1.5">
              Start planning with {targetUserName || 'your travel mate'}
            </Text>
            <Text className="text-[13px] text-text-secondary text-center leading-5">
              Say hello and share your travel dates or itinerary ideas.
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 8 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input Bar */}
        <View
          className="flex-row items-center bg-surface px-3 pt-2 border-t border-border-subtle gap-2"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <TextInput
            className="flex-1 bg-surface-subtle rounded-2xl border border-border px-3.5 py-2 text-sm text-text-primary max-h-[100px]"
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textPlaceholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            className={cn(
              'w-9 h-9 rounded-full items-center justify-center',
              inputText.trim() ? 'bg-primary' : 'bg-border'
            )}
            onPress={handleSendText}
            disabled={!inputText.trim()}
          >
            <Send size={16} color={theme.colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
