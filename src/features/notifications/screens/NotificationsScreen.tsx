import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft,
  Bell,
  UserPlus,
  UserCheck,
  MessageSquare,
  Compass,
  CheckCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../../navigation/types';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../hooks/useNotifications';
import { NotificationItem, NotificationType } from '../../../types/notification.types';
import { theme } from '../../../config/theme';
import { cn } from '../../../utils/cn';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'CONNECTION_REQUEST':
      return <UserPlus size={18} color="#059669" />;
    case 'CONNECTION_ACCEPTED':
      return <UserCheck size={18} color="#059669" />;
    case 'CHAT_MESSAGE':
      return <MessageSquare size={18} color="#2563EB" />;
    case 'TRIP_MATCH':
      return <Compass size={18} color="#D97706" />;
    case 'SYSTEM_ALERT':
    default:
      return <Bell size={18} color="#6B7280" />;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

export const NotificationsScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data, isLoading, refetch, isRefetching } = useNotificationsQuery({
    page: 1,
    limit: 30,
  });

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleMarkAllAsRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    markAllReadMutation.mutate();
  };

  const handleNotificationPress = useCallback(
    (item: NotificationItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (!item.isRead) {
        markReadMutation.mutate(item.id);
      }

      const dataPayload = item.data as Record<string, unknown> | undefined;

      switch (item.type) {
        case 'CONNECTION_REQUEST':
          navigation.navigate('Connections', {
            initialTab: 'requests',
            initialSubTab: 'incoming',
          });
          break;
        case 'CONNECTION_ACCEPTED':
          navigation.navigate('Connections', {
            initialTab: 'connections',
          });
          break;
        case 'CHAT_MESSAGE':
          if (dataPayload?.senderId) {
            navigation.navigate('ChatRoom', {
              conversationId: dataPayload.conversationId as string | undefined,
              targetUserId: dataPayload.senderId as string,
              targetUserName: item.title || 'Chat',
            });
          }
          break;
        case 'TRIP_MATCH':
          if (dataPayload?.matchId) {
            navigation.navigate('UserProfile', {
              userId: (dataPayload.userId as string) || (dataPayload.senderId as string),
              matchId: dataPayload.matchId as string,
              variant: 'MATCH',
            });
          }
          break;
        default:
          break;
      }
    },
    [markReadMutation, navigation],
  );

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-surface-base" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-border bg-surface">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={handleBack}
            className="w-9 h-9 rounded-full bg-surface-subtle items-center justify-center"
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold text-text-primary tracking-tight">
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Text className="text-xs text-text-muted font-medium">
                {unreadCount} unread
              </Text>
            )}
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            disabled={markAllReadMutation.isPending}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-subtle"
            activeOpacity={0.7}
          >
            <CheckCheck size={14} color={theme.colors.primary} />
            <Text className="text-xs font-semibold text-primary">
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-surface-subtle items-center justify-center mb-4">
            <Bell size={28} color={theme.colors.textMuted} />
          </View>
          <Text className="text-base font-semibold text-text-primary text-center">
            All caught up!
          </Text>
          <Text className="text-sm text-text-muted text-center mt-1">
            No notifications yet. When you receive connection requests, chat messages, or trip matches, they will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.7}
              className={cn(
                'flex-row items-start px-5 py-3.5 border-b border-border/50 gap-3.5',
                !item.isRead ? 'bg-primary/5' : 'bg-surface',
              )}
            >
              {/* Icon Container */}
              <View className="w-10 h-10 rounded-full bg-surface-subtle items-center justify-center mt-0.5">
                {getNotificationIcon(item.type)}
              </View>

              {/* Text Body */}
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text
                    className={cn(
                      'text-sm',
                      !item.isRead
                        ? 'font-bold text-text-primary'
                        : 'font-semibold text-text-primary/90',
                    )}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text className="text-[11px] text-text-muted font-medium ml-2">
                    {formatTimeAgo(item.createdAt)}
                  </Text>
                </View>

                <Text
                  className="text-xs text-text-secondary mt-1 leading-relaxed"
                  numberOfLines={2}
                >
                  {item.body}
                </Text>
              </View>

              {/* Unread Dot */}
              {!item.isRead && (
                <View className="w-2.5 h-2.5 rounded-full bg-primary mt-2 self-start" />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};
