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
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { connectionService } from '../services/connection.service';
import { ConnectionUser, IncomingRequest, SentRequest } from '../types';
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
  Send,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'Connections'>;

type MainTab = 'connections' | 'requests';
type RequestSubTab = 'incoming' | 'sent';

export const ConnectionsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { initialTab = 'connections', initialSubTab = 'incoming' } = route.params || {};

  const [activeTab, setActiveTab] = useState<MainTab>(initialTab);
  const [requestSubTab, setRequestSubTab] = useState<RequestSubTab>(initialSubTab);

  const [connections, setConnections] = useState<ConnectionUser[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load All Data
  const loadData = useCallback(async () => {
    try {
      const [connData, incData, sentData] = await Promise.all([
        connectionService.getConnections().catch(() => []),
        connectionService.getIncomingRequests().catch(() => []),
        connectionService.getSentRequests().catch(() => []),
      ]);

      setConnections(connData);
      setIncomingRequests(incData);
      setSentRequests(sentData);
    } catch (err) {
      console.warn('Error loading connections:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Accept incoming request
  const handleAccept = async (request: IncomingRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await connectionService.acceptRequest(request.id);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id));
      // Add to connections list
      setConnections((prev) => [
        {
          id: request.id,
          userId: request.sender.id,
          fullName: request.sender.fullName,
          avatarUrl: request.sender.avatarUrl,
          state: request.sender.state,
          country: request.sender.country,
        },
        ...prev,
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Connected', `You and ${request.sender.fullName} are now connected.`);
    } catch {
      Alert.alert('Error', 'Could not accept this request.');
    }
  };

  // Decline incoming request
  const handleReject = async (requestId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await connectionService.rejectRequest(requestId);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      Alert.alert('Error', 'Could not decline this request.');
    }
  };

  // Cancel sent request
  const handleCancelSent = async (requestId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await connectionService.withdrawRequest(requestId);
      setSentRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      Alert.alert('Error', 'Could not cancel this request.');
    }
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
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              await connectionService.disconnect(conn.id);
              setConnections((prev) => prev.filter((c) => c.id !== conn.id));
            } catch {
              Alert.alert('Error', 'Could not remove connection.');
            }
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
          <ChevronLeft size={24} color="#151D19" />
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
          <ActivityIndicator size="large" color="#005440" />
        </View>
      ) : activeTab === 'connections' ? (
        /* CONNECTIONS TAB */
        <View style={styles.tabContent}>
          {/* Search Bar */}
          <View style={styles.searchBox}>
            <Search size={16} color="#88978E" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or location..."
              placeholderTextColor="#88978E"
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
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#005440" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Users size={32} color="#005440" />
                </View>
                <Text style={styles.emptyTitle}>No connections yet</Text>
                <Text style={styles.emptySubtitle}>
                  Connect with other travelers on the Home or Matches tab.
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
                        <MapPin size={11} color="#5C6B64" />
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
                      <MessageSquare size={14} color="#005440" />
                      <Text style={styles.messageBtnText}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.disconnectBtn}
                      onPress={() => handleDisconnect(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <UserX size={15} color="#88978E" />
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
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#005440" />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Users size={32} color="#005440" />
                  </View>
                  <Text style={styles.emptyTitle}>No pending requests</Text>
                  <Text style={styles.emptySubtitle}>
                    When someone sends you a request, you will see it here.
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
                            <MapPin size={11} color="#5C6B64" />
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
                        <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => handleReject(item.id)}
                      >
                        <X size={14} color="#5C6B64" />
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
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#005440" />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Clock size={32} color="#005440" />
                  </View>
                  <Text style={styles.emptyTitle}>No sent requests</Text>
                  <Text style={styles.emptySubtitle}>
                    Requests you send to other travelers will appear here.
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
                            <MapPin size={11} color="#5C6B64" />
                            <Text style={styles.locationText}>{receiverLocation}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.pendingBadge}>
                        <Clock size={11} color="#5C6B64" />
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
    backgroundColor: '#F8FAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE9',
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
    fontWeight: '800',
    color: '#151D19',
  },
  headerRightPlaceholder: {
    width: 36,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE9',
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
    borderBottomColor: '#005440',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#88978E',
  },
  tabTextActive: {
    color: '#005440',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#005440',
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
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#151D19',
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
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5EE',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#005440',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  connInfo: {
    flex: 1,
    gap: 2,
  },
  connName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#151D19',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#5C6B64',
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
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  messageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005440',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EFE9',
  },
  subTabPillActive: {
    backgroundColor: '#005440',
    borderColor: '#005440',
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C6B64',
  },
  subTabTextActive: {
    color: '#FFFFFF',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6EFE9',
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
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C6B64',
  },
  messageBox: {
    backgroundColor: '#F8FAF8',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBF1ED',
  },
  messageText: {
    fontSize: 13,
    color: '#374151',
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
    backgroundColor: '#005440',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  declineBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  declineBtnText: {
    color: '#5C6B64',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelSentBtn: {
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E6EFE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C6B64',
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
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  },
});
