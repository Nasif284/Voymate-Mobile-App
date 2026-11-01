import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
          <View style={styles.dateDivider}>
            <Text style={styles.dateDividerText}>
              {formatDateDivider(item.createdAt)}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.bubbleRow,
            isMe ? styles.bubbleRowMe : styles.bubbleRowOther,
          ]}
        >
          <View
            style={[
              styles.bubble,
              isMe ? styles.bubbleMe : styles.bubbleOther,
            ]}
          >
            {item.content ? (
              <Text
                style={[
                  styles.messageText,
                  isMe ? styles.messageTextMe : styles.messageTextOther,
                ]}
              >
                {item.content}
              </Text>
            ) : null}

            <View style={styles.timeStatusRow}>
              <Text
                style={[
                  styles.timeText,
                  isMe ? styles.timeTextMe : styles.timeTextOther,
                ]}
              >
                {timeStr}
              </Text>

              {isMe && (
                <View style={styles.statusTick}>
                  {item.status === 'READ' ? (
                    <CheckCheck size={13} color={theme.colors.success} />
                  ) : (
                    <Check size={13} color={theme.colors.onPrimaryMuted} />
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
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.userProfileLink}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('UserProfile', {
                userId: targetUserId,
                variant: 'PUBLIC',
              })
            }
          >
            <View style={styles.avatarWrap}>
              {targetUserAvatar ? (
                <Image source={{ uri: targetUserAvatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {targetUserName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              {isTargetOnline && <View style={styles.onlineDot} />}
            </View>

            <View style={styles.headerTextWrap}>
              <Text style={styles.headerName} numberOfLines={1}>
                {targetUserName || 'Traveler'}
              </Text>
              <Text style={styles.headerStatus}>
                {isTargetOnline ? 'Active now' : 'Direct message'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages FlatList */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {isLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyChatContainer}>
            <Text style={styles.emptyChatTitle}>
              Start planning with {targetUserName || 'your travel mate'}
            </Text>
            <Text style={styles.emptyChatSubtitle}>
              Say hello and share your travel dates or itinerary ideas.
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textPlaceholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              inputText.trim() ? styles.sendBtnActive : styles.sendBtnInactive,
            ]}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'relative',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  headerStatus: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  chatArea: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChatContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyChatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyChatSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  dateDivider: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateDividerText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  bubbleRowMe: {
    justifyContent: 'flex-end',
  },
  bubbleRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMe: {
    color: theme.colors.white,
  },
  messageTextOther: {
    color: theme.colors.textPrimary,
  },
  timeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
  },
  timeTextMe: {
    color: theme.colors.onPrimaryMuted,
  },
  timeTextOther: {
    color: theme.colors.textMuted,
  },
  statusTick: {
    marginLeft: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: theme.colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  sendBtnInactive: {
    backgroundColor: theme.colors.border,
  },
});
