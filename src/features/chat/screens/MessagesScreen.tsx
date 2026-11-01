import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { QUERY_KEYS } from '../../../api/queryClient';
import { useGetConversations } from '../hooks/chat.hooks';
import { useGetConnections } from '../../connections/hooks/connection.hooks';
import { socketService } from '../services/socket.service';
import { Conversation, ChatMessage } from '../types';
import {
  Search,
  MessageSquare,
  MessageSquarePlus,
  Users,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const formatConversationTime = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24 && d.getDate() === now.getDate()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.getDate() === yesterday.getDate()) {
      return 'Yesterday';
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const MessagesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');

  // TanStack Query Hooks
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    isRefetching: isRefetchingConversations,
    refetch: refetchConversations,
  } = useGetConversations();

  const {
    data: connections = [],
    isLoading: isLoadingConnections,
    isRefetching: isRefetchingConnections,
    refetch: refetchConnections,
  } = useGetConnections();

  const isLoading = isLoadingConversations || isLoadingConnections;
  const isRefreshing = isRefetchingConversations || isRefetchingConnections;

  const loadData = useCallback(() => {
    refetchConversations();
    refetchConnections();
  }, [refetchConversations, refetchConnections]);

  useEffect(() => {
    let isMounted = true;
    let unsubMessage: (() => void) | undefined;

    // Listen for new messages in any conversation and update React Query cache
    const handleNewMessage = (newMsg: ChatMessage) => {
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
          target.unreadCount = (target.unreadCount || 0) + 1;
          updated.splice(existingIdx, 1);
          return [target, ...updated];
        } else {
          refetchConversations();
          return prev;
        }
      });
    };

    socketService.connect().then(() => {
      if (isMounted) {
        unsubMessage = socketService.onMessage(handleNewMessage);
      }
    });

    return () => {
      isMounted = false;
      unsubMessage?.();
    };
  }, [queryClient, refetchConversations]);

  const onRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.user?.name?.toLowerCase().includes(q) ||
        c.lastMessage?.content?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  // Total unread count
  const totalUnread = useMemo(() => {
    return conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
  }, [conversations]);

  // Navigate to ChatRoom
  const handleOpenChat = (
    conversationId: string | undefined,
    targetUserId: string,
    targetUserName: string,
    targetUserAvatar?: string | null
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ChatRoom', {
      conversationId,
      targetUserId,
      targetUserName,
      targetUserAvatar: targetUserAvatar || undefined,
    });
  };

  // Render Horizontal Connected Mates Row
  const renderConnectionsBar = () => {
    if (connections.length === 0) return null;

    return (
      <View style={styles.connectionsSection}>
        <Text style={styles.sectionTitle}>Mates</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.connectionsScroll}
        >
          {connections.map((item) => (
            <TouchableOpacity
              key={item.userId}
              style={styles.connectionAvatarItem}
              onPress={() =>
                handleOpenChat(
                  undefined,
                  item.userId,
                  item.fullName,
                  item.avatarUrl
                )
              }
              activeOpacity={0.8}
            >
              <View style={styles.mateAvatarWrap}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={styles.mateAvatarImg} />
                ) : (
                  <View style={styles.mateAvatarFallback}>
                    <Text style={styles.mateAvatarInitial}>
                      {item.fullName?.charAt(0)?.toUpperCase() || 'M'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.mateName} numberOfLines={1}>
                {item.fullName.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const timeStr = formatConversationTime(item.lastMessage?.createdAt || item.updatedAt);
    const hasUnread = Boolean(item.unreadCount && item.unreadCount > 0);

    return (
      <TouchableOpacity
        style={[styles.conversationRow, hasUnread && styles.conversationRowUnread]}
        onPress={() =>
          handleOpenChat(
            item.conversationId,
            item.user.id,
            item.user.name,
            item.user.profileImage
          )
        }
        activeOpacity={0.7}
      >
        <View style={styles.convAvatarWrap}>
          {item.user?.profileImage ? (
            <Image source={{ uri: item.user.profileImage }} style={styles.convAvatarImg} />
          ) : (
            <View style={styles.convAvatarFallback}>
              <Text style={styles.convAvatarInitial}>
                {item.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          {item.user?.isOnline && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.convDetails}>
          <View style={styles.convTopRow}>
            <Text
              style={[styles.convName, hasUnread && styles.convNameUnread]}
              numberOfLines={1}
            >
              {item.user?.name || 'Traveler'}
            </Text>
            <Text
              style={[styles.convTime, hasUnread && styles.convTimeUnread]}
            >
              {timeStr}
            </Text>
          </View>

          <View style={styles.convBottomRow}>
            <View style={styles.lastMessageWrap}>
              <Text
                style={[
                  styles.lastMessageText,
                  hasUnread && styles.lastMessageTextUnread,
                ]}
                numberOfLines={1}
              >
                {item.lastMessage?.content || 'Started a conversation'}
              </Text>
            </View>

            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unreadCount! > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) return null;

    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Search size={36} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No Matching Chats</Text>
          <Text style={styles.emptySubtitle}>Check the spelling or search for another name.</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <MessageSquare size={32} color={theme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No Messages Yet</Text>
        <Text style={styles.emptySubtitle}>
          Once a travel mate accepts your connection request, you can chat and plan your trip here.
        </Text>
        <TouchableOpacity
          style={styles.emptyCta}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (connections.length > 0) { navigation.navigate('Connections', { initialTab: 'connections' }); } else { navigation.navigate('Main', { screen: 'HomeTab' } as any); }
          }}
          activeOpacity={0.8}
        >
          <Users size={16} color={theme.colors.white} />
          <Text style={styles.emptyCtaText}>{connections.length > 0 ? 'View My Connections' : 'Find Travel Mates'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const tabBarHeight = 82 + insets.bottom;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>
            {totalUnread > 0 ? `${totalUnread} new messages` : 'Direct chats'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (connections.length > 0) { navigation.navigate('Connections', { initialTab: 'connections' }); } else { navigation.navigate('Main', { screen: 'HomeTab' } as any); }
          }}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MessageSquarePlus size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Search size={16} color={theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages or mates..."
          placeholderTextColor={theme.colors.textPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Conversations List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.conversationId}
          renderItem={renderConversationItem}
          ListHeaderComponent={renderConnectionsBar}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
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
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 2,
  },
  newChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  connectionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  connectionsScroll: {
    gap: 14,
  },
  connectionAvatarItem: {
    alignItems: 'center',
    width: 58,
  },
  mateAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    padding: 2,
    backgroundColor: theme.colors.surface,
  },
  mateAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  mateAvatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mateAvatarInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  mateName: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 4,
    textAlign: 'center',
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
    gap: 12,
  },
  conversationRowUnread: {
    backgroundColor: theme.colors.primaryMist,
    borderColor: theme.colors.primaryBorder,
  },
  convAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    position: 'relative',
  },
  convAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  convAvatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.white,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  convDetails: {
    flex: 1,
    gap: 4,
  },
  convTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  convName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  convNameUnread: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  convTime: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  convTimeUnread: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  convBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessageWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  msgTypeIcon: {
    marginRight: 4,
  },
  lastMessageText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  lastMessageTextUnread: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.white,
  },
  emptyContainer: {
    paddingVertical: 70,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 12,
  },
  emptyCtaText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
