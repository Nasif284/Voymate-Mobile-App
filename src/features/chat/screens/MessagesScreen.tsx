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
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { chatService } from '../services/chat.service';
import { socketService } from '../services/socket.service';
import { connectionService } from '../../connections/services/connection.service';
import { Conversation, ChatMessage } from '../types';
import { ConnectionUser } from '../../connections/types';
import {
  Search,
  MessageSquare,
  MessageSquarePlus,
  Users,
  Compass,
  Check,
  CheckCheck,
  ChevronRight,
  Image as ImageIcon,
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

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [connections, setConnections] = useState<ConnectionUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load conversations and connections
  const loadData = useCallback(async () => {
    try {
      const [convs, conns] = await Promise.all([
        chatService.getConversations().catch(() => []),
        connectionService.getConnections().catch(() => []),
      ]);

      setConversations(convs);
      setConnections(conns);
    } catch (err) {
      console.warn('Error loading messages data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    socketService.connect();

    // Listen for new messages in any conversation
    const handleNewMessage = (newMsg: ChatMessage) => {
      setConversations((prev) => {
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
          // If conversation isn't in list yet, reload data
          loadData();
          return prev;
        }
      });
    };

    socketService.onMessage(handleNewMessage);

    return () => {
      socketService.offMessage(handleNewMessage);
    };
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

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
              {item.lastMessage?.type === 'IMAGE' && (
                <ImageIcon size={13} color="#5C6B64" style={styles.msgTypeIcon} />
              )}
              <Text
                style={[
                  styles.lastMessageText,
                  hasUnread && styles.lastMessageTextUnread,
                ]}
                numberOfLines={1}
              >
                {item.lastMessage?.type === 'IMAGE'
                  ? 'Photo'
                  : item.lastMessage?.content || 'Started a conversation'}
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
          <Search size={36} color="#88978E" />
          <Text style={styles.emptyTitle}>No conversations found</Text>
          <Text style={styles.emptySubtitle}>Try searching for a different mate.</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <MessageSquare size={32} color="#005440" />
        </View>
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptySubtitle}>
          Connect with travel mates to plan trips and chat in real-time.
        </Text>
        <TouchableOpacity
          style={styles.emptyCta}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate('Connections', { initialTab: 'connections' });
          }}
          activeOpacity={0.8}
        >
          <Users size={16} color="#FFFFFF" />
          <Text style={styles.emptyCtaText}>View My Connections</Text>
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
            navigation.navigate('Connections', { initialTab: 'connections' });
          }}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MessageSquarePlus size={22} color="#005440" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Search size={16} color="#88978E" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages or mates..."
          placeholderTextColor="#88978E"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Conversations List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#005440" />
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
              tintColor="#005440"
              colors={['#005440']}
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
    backgroundColor: '#F8FAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#151D19',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#005440',
    marginTop: 2,
  },
  newChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#151D19',
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
    fontWeight: '800',
    color: '#5C6B64',
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
    borderColor: '#005440',
    padding: 2,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mateAvatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#005440',
  },
  mateName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#151D19',
    marginTop: 4,
    textAlign: 'center',
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF3F0',
    marginBottom: 10,
    gap: 12,
  },
  conversationRowUnread: {
    backgroundColor: '#F9FCFA',
    borderColor: '#CBE5D7',
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
    backgroundColor: '#005440',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    fontWeight: '700',
    color: '#151D19',
    flex: 1,
    marginRight: 8,
  },
  convNameUnread: {
    fontWeight: '900',
    color: '#151D19',
  },
  convTime: {
    fontSize: 11,
    color: '#88978E',
  },
  convTimeUnread: {
    color: '#005440',
    fontWeight: '700',
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
    color: '#5C6B64',
    flex: 1,
  },
  lastMessageTextUnread: {
    color: '#151D19',
    fontWeight: '700',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#005440',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
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
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#151D19',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#5C6B64',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#005440',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 12,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
