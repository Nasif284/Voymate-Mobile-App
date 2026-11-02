import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
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
import { useAuthStore } from '../../../store/authStore';
import {
  Search,
  MessageSquare,
  MessageSquarePlus,
  Users,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { cn } from '../../../utils/cn';

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
  const { user: currentUser } = useAuthStore();

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
          if (newMsg.senderId !== currentUser?.id) {
            target.unreadCount = (target.unreadCount || 0) + 1;
          }
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
  }, [queryClient, refetchConversations, currentUser?.id]);

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
      <View className="mb-4">
        <Text className="text-[13px] font-semibold text-text-secondary mb-2.5 tracking-wide">
          Mates
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 14 }}
        >
          {connections.map((item) => (
            <TouchableOpacity
              key={item.userId}
              className="items-center w-[58px]"
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
              <View className="w-[52px] h-[52px] rounded-full border-2 border-primary p-0.5 bg-surface">
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} className="w-full h-full rounded-full" />
                ) : (
                  <View className="w-full h-full rounded-full bg-primary-mist items-center justify-center">
                    <Text className="text-lg font-semibold text-primary">
                      {item.fullName?.charAt(0)?.toUpperCase() || 'M'}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-[11px] font-semibold text-text-primary mt-1 text-center" numberOfLines={1}>
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
        className={cn(
          'flex-row items-center bg-surface p-3.5 rounded-2xl border border-border mb-2.5 gap-3 shadow-subtle',
          hasUnread && 'bg-primary-mist border-primary/20'
        )}
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
        <View className="w-12 h-12 rounded-full relative">
          {item.user?.profileImage ? (
            <Image source={{ uri: item.user.profileImage }} className="w-full h-full rounded-full" />
          ) : (
            <View className="w-full h-full rounded-full bg-primary items-center justify-center">
              <Text className="text-lg font-semibold text-white">
                {item.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          {item.user?.isOnline && (
            <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-white" />
          )}
        </View>

        <View className="flex-1 gap-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={cn(
                'text-[15px] font-semibold text-text-primary flex-1 mr-2',
                hasUnread && 'font-bold'
              )}
              numberOfLines={1}
            >
              {item.user?.name || 'Traveler'}
            </Text>
            <Text
              className={cn(
                'text-[11px] text-text-muted',
                hasUnread && 'text-primary font-semibold'
              )}
            >
              {timeStr}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2.5">
              <Text
                className={cn(
                  'text-[13px] text-text-secondary flex-1',
                  hasUnread && 'text-text-primary font-semibold'
                )}
                numberOfLines={1}
              >
                {item.lastMessage?.content || 'Started a conversation'}
              </Text>
            </View>

            {hasUnread && (
              <View className="min-w-[20px] h-5 rounded-full bg-primary items-center justify-center px-1.5">
                <Text className="text-[10px] font-bold text-white">
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
        <View className="py-16 px-5 items-center justify-center gap-2.5">
          <Search size={36} color={theme.colors.textMuted} />
          <Text className="text-base font-semibold text-text-primary">No Matching Chats</Text>
          <Text className="text-[13px] text-text-secondary text-center">
            Check the spelling or search for another name.
          </Text>
        </View>
      );
    }

    return (
      <View className="py-16 px-5 items-center justify-center gap-2.5">
        <View className="w-16 h-16 rounded-full bg-primary-mist items-center justify-center mb-1">
          <MessageSquare size={32} color={theme.colors.primary} />
        </View>
        <Text className="text-base font-semibold text-text-primary">No Messages Yet</Text>
        <Text className="text-[13px] text-text-secondary text-center leading-[18px] max-w-[260px]">
          Once a travel mate accepts your connection request, you can chat and plan your trip here.
        </Text>
        <TouchableOpacity
          className="flex-row items-center gap-2 bg-primary px-5 py-2.5 rounded-2xl mt-3 shadow-card"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (connections.length > 0) {
              navigation.navigate('Connections', { initialTab: 'connections' });
            } else {
              navigation.navigate('Main', { screen: 'HomeTab' } as any);
            }
          }}
          activeOpacity={0.8}
        >
          <Users size={16} color={theme.colors.white} />
          <Text className="text-white text-[13px] font-semibold">
            {connections.length > 0 ? 'View My Connections' : 'Find Travel Mates'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const tabBarHeight = 82 + insets.bottom;

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header matching other primary tab pages (px-5, pt-2, pb-3.5) */}
      <View
        className="px-5 pt-2 pb-3.5 bg-background"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[22px] font-semibold text-text-primary tracking-tight">Messages</Text>
            <Text className="text-xs text-text-muted mt-0.5">
              {totalUnread > 0 ? (
                <Text className="text-primary font-semibold">
                  {totalUnread} new message{totalUnread !== 1 ? 's' : ''}
                </Text>
              ) : (
                'Direct chats with your travel mates'
              )}
            </Text>
          </View>

          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-primary-mist items-center justify-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (connections.length > 0) {
                navigation.navigate('Connections', { initialTab: 'connections' });
              } else {
                navigation.navigate('Main', { screen: 'HomeTab' } as any);
              }
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MessageSquarePlus size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar matching Explore screen (mx-5, h-12, rounded-2xl) */}
      <View className="flex-row items-center bg-surface mx-5 mb-3 px-3.5 h-12 rounded-2xl border border-border gap-2.5 shadow-subtle">
        <Search size={16} color={theme.colors.textMuted} />
        <TextInput
          className="flex-1 text-sm text-text-primary p-0"
          placeholder="Search messages or mates..."
          placeholderTextColor={theme.colors.textPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Conversations List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.conversationId}
          renderItem={renderConversationItem}
          ListHeaderComponent={renderConnectionsBar}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: tabBarHeight + 24,
          }}
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
