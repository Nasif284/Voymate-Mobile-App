import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import {
  useGetConnections,
  useGetIncomingRequests,
  useGetSentRequests,
  useAcceptConnectionRequest,
  useRejectConnectionRequest,
  useWithdrawConnectionRequest,
  useDisconnectConnection,
} from '../hooks/connection.hooks';
import { ConnectionUser, IncomingRequest } from '../types';
import {
  ChevronLeft,
  Search,
  MessageSquare,
  UserX,
  Check,
  X,
  Users,
  Clock,
  MapPin,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { theme } from '../../../config/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Connections'>;

type MainTab = 'connections' | 'requests';
type RequestSubTab = 'incoming' | 'sent';

export const ConnectionsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { initialTab = 'connections', initialSubTab = 'incoming' } = route.params || {};

  const [activeTab, setActiveTab] = useState<MainTab>(initialTab);
  const [requestSubTab, setRequestSubTab] = useState<RequestSubTab>(initialSubTab);
  const [searchQuery, setSearchQuery] = useState('');

  // TanStack Query Hooks
  const {
    data: connections = [],
    isLoading: isLoadingConnections,
    isRefetching: isRefetchingConnections,
    refetch: refetchConnections,
  } = useGetConnections();

  const {
    data: incomingRequests = [],
    isLoading: isLoadingIncoming,
    isRefetching: isRefetchingIncoming,
    refetch: refetchIncoming,
  } = useGetIncomingRequests();

  const {
    data: sentRequests = [],
    isLoading: isLoadingSent,
    isRefetching: isRefetchingSent,
    refetch: refetchSent,
  } = useGetSentRequests();

  const acceptMutation = useAcceptConnectionRequest();
  const rejectMutation = useRejectConnectionRequest();
  const withdrawMutation = useWithdrawConnectionRequest();
  const disconnectMutation = useDisconnectConnection();

  const isLoading = isLoadingConnections || isLoadingIncoming || isLoadingSent;
  const isRefreshing =
    isRefetchingConnections || isRefetchingIncoming || isRefetchingSent;

  const onRefresh = useCallback(() => {
    refetchConnections();
    refetchIncoming();
    refetchSent();
  }, [refetchConnections, refetchIncoming, refetchSent]);

  // Accept incoming request
  const handleAccept = (request: IncomingRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    acceptMutation.mutate(
      {
        targetUserId: request.sender.id,
        requestId: request.id,
      },
      {
        onSuccess: () => {
          Alert.alert('Connected', `You and ${request.sender.fullName} are now connected.`);
        },
      }
    );
  };

  // Decline incoming request
  const handleReject = (requestId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const targetReq = incomingRequests.find((r) => r.id === requestId);
    rejectMutation.mutate({
      requestId,
      senderId: targetReq?.sender?.id,
    });
  };

  // Cancel sent request
  const handleCancelSent = (requestId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const targetReq = sentRequests.find((r) => r.id === requestId);
    withdrawMutation.mutate({
      requestId,
      receiverId: targetReq?.receiver?.id,
    });
  };

  // Remove connection
  const handleDisconnect = (conn: ConnectionUser) => {
    Alert.alert(
      'Remove Connection',
      `Remove ${conn.fullName} from your connections?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            disconnectMutation.mutate({
              connectionId: conn.id,
              userId: conn.userId,
            });
          },
        },
      ]
    );
  };

  // Filtered connections based on search query
  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connections;
    const q = searchQuery.toLowerCase();
    return connections.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q)
    );
  }, [connections, searchQuery]);

  // Navigate to Chat
  const handleMessage = (userId: string, name: string, avatarUrl?: string | null) => {
    navigation.navigate('ChatRoom', {
      targetUserId: userId,
      targetUserName: name,
      targetUserAvatar: avatarUrl || undefined,
    });
  };

  // Navigate to User Profile
  const handleViewProfile = (userId: string, name: string, avatarUrl?: string | null) => {
    navigation.navigate('UserProfile', {
      userId,
      variant: 'PUBLIC',
      initialName: name,
      initialAvatar: avatarUrl || undefined,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Network</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Upper Segment Tabs (Instagram Style) */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'connections' && styles.tabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('connections');
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'connections' && styles.tabTextActive,
            ]}
          >
            Connections ({connections.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'requests' && styles.tabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('requests');
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'requests' && styles.tabTextActive,
            ]}
          >
            Requests ({incomingRequests.length})
          </Text>
          {incomingRequests.length > 0 && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : activeTab === 'connections' ? (
        /* CONNECTIONS TAB */
        <View style={styles.tabContent}>
          {/* Search Bar */}
          <View style={styles.searchBox}>
            <Search size={16} color={theme.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or location..."
              placeholderTextColor={theme.colors.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredConnections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Users size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Travel Mates Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Send connection requests to travelers on Home or Matches to build your travel circle.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const location = [item.state, item.country].filter(Boolean).join(', ');
              return (
                <TouchableOpacity
                  style={styles.connectionCard}
                  activeOpacity={0.85}
                  onPress={() => handleViewProfile(item.userId, item.fullName, item.avatarUrl)}
                >
                  {/* Avatar */}
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>
                        {item.fullName?.charAt(0)?.toUpperCase() || 'V'}
                      </Text>
                    </View>
                  )}

                  {/* Name & Details */}
                  <View style={styles.connInfo}>
                    <Text style={styles.connName} numberOfLines={1}>
                      {item.fullName}
                    </Text>
                    {location ? (
                      <View style={styles.locationRow}>
                        <MapPin size={11} color={theme.colors.textSecondary} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {location}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Actions */}
                  <View style={styles.connActions}>
                    <TouchableOpacity
                      style={styles.messageBtn}
                      onPress={() => handleMessage(item.userId, item.fullName, item.avatarUrl)}
                    >
                      <MessageSquare size={14} color={theme.colors.primary} />
                      <Text style={styles.messageBtnText}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.disconnectBtn}
                      onPress={() => handleDisconnect(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <UserX size={15} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      ) : (
        /* REQUESTS TAB */
        <View style={styles.tabContent}>
          {/* Sub-tabs: Received vs Sent */}
          <View style={styles.subTabsRow}>
            <TouchableOpacity
              style={[
                styles.subTabPill,
                requestSubTab === 'incoming' && styles.subTabPillActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRequestSubTab('incoming');
              }}
            >
              <Text
                style={[
                  styles.subTabText,
                  requestSubTab === 'incoming' && styles.subTabTextActive,
                ]}
              >
                Received ({incomingRequests.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.subTabPill,
                requestSubTab === 'sent' && styles.subTabPillActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRequestSubTab('sent');
              }}
            >
              <Text
                style={[
                  styles.subTabText,
                  requestSubTab === 'sent' && styles.subTabTextActive,
                ]}
              >
                Sent ({sentRequests.length})
              </Text>
            </TouchableOpacity>
          </View>

          {requestSubTab === 'incoming' ? (
            /* Received Requests List */
            <FlatList
              data={incomingRequests}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Users size={32} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No Incoming Requests</Text>
                  <Text style={styles.emptySubtitle}>
                    Keep an active trip on your profile so travelers heading to your destination can find and connect with you.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const senderLocation = [item.sender.state, item.sender.country]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <View style={styles.requestCard}>
                    <TouchableOpacity
                      style={styles.requestHeader}
                      activeOpacity={0.8}
                      onPress={() =>
                        handleViewProfile(
                          item.sender.id,
                          item.sender.fullName,
                          item.sender.avatarUrl
                        )
                      }
                    >
                      {item.sender.avatarUrl ? (
                        <Image
                          source={{ uri: item.sender.avatarUrl }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarInitial}>
                            {item.sender.fullName?.charAt(0)?.toUpperCase() || 'V'}
                          </Text>
                        </View>
                      )}

                      <View style={styles.connInfo}>
                        <Text style={styles.connName}>{item.sender.fullName}</Text>
                        {senderLocation ? (
                          <View style={styles.locationRow}>
                            <MapPin size={11} color={theme.colors.textSecondary} />
                            <Text style={styles.locationText}>{senderLocation}</Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>

                    {/* Request Note */}
                    {item.message ? (
                      <View style={styles.messageBox}>
                        <Text style={styles.messageText}>"{item.message}"</Text>
                      </View>
                    ) : null}

                    {/* Accept / Decline Row */}
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleAccept(item)}
                      >
                        <Check size={14} color={theme.colors.white} strokeWidth={2.5} />
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => handleReject(item.id)}
                      >
                        <X size={14} color={theme.colors.textSecondary} />
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          ) : (
            /* Sent Requests List */
            <FlatList
              data={sentRequests}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Clock size={32} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No Sent Requests</Text>
                  <Text style={styles.emptySubtitle}>
                    Browse travelers on Home or Explore and send a request to plan a trip together.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const receiverLocation = [item.receiver.state, item.receiver.country]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <View style={styles.requestCard}>
                    <TouchableOpacity
                      style={styles.requestHeader}
                      activeOpacity={0.8}
                      onPress={() =>
                        handleViewProfile(
                          item.receiver.id,
                          item.receiver.fullName,
                          item.receiver.avatarUrl
                        )
                      }
                    >
                      {item.receiver.avatarUrl ? (
                        <Image
                          source={{ uri: item.receiver.avatarUrl }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarInitial}>
                            {item.receiver.fullName?.charAt(0)?.toUpperCase() || 'V'}
                          </Text>
                        </View>
                      )}

                      <View style={styles.connInfo}>
                        <Text style={styles.connName}>{item.receiver.fullName}</Text>
                        {receiverLocation ? (
                          <View style={styles.locationRow}>
                            <MapPin size={11} color={theme.colors.textSecondary} />
                            <Text style={styles.locationText}>{receiverLocation}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.pendingBadge}>
                        <Clock size={11} color={theme.colors.textSecondary} />
                        <Text style={styles.pendingText}>Pending</Text>
                      </View>
                    </TouchableOpacity>

                    {item.message ? (
                      <View style={styles.messageBox}>
                        <Text style={styles.messageText}>"{item.message}"</Text>
                      </View>
                    ) : null}

                    {/* Cancel Request Button */}
                    <TouchableOpacity
                      style={styles.cancelSentBtn}
                      onPress={() => handleCancelSent(item.id)}
                    >
                      <Text style={styles.cancelSentText}>Cancel Request</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  tabContent: {
    flex: 1,
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  connInfo: {
    flex: 1,
    gap: 2,
  },
  connName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  connActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryMist,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  messageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  disconnectBtn: {
    padding: 6,
  },
  subTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  subTabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subTabPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  subTabTextActive: {
    color: theme.colors.white,
  },
  requestCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  messageBox: {
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messageText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtnText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  declineBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  declineBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  cancelSentBtn: {
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSentText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  },
});
