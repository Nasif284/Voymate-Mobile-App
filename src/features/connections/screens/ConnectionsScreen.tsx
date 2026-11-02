import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
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
import { cn } from '../../../utils/cn';

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
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View
        className="flex-row items-center justify-between px-4 pb-3 bg-surface border-b border-border"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          className="w-9 h-9 rounded-full items-center justify-center"
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold text-text-primary">Network</Text>
        <View className="w-9" />
      </View>

      {/* Upper Segment Tabs (Instagram Style) */}
      <View className="flex-row bg-surface border-b border-border">
        <TouchableOpacity
          className={cn(
            'flex-1 py-3.5 items-center justify-center flex-row gap-1.5 border-b-2 border-transparent',
            activeTab === 'connections' && 'border-b-primary'
          )}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('connections');
          }}
        >
          <Text
            className={cn(
              'text-sm font-semibold text-text-muted',
              activeTab === 'connections' && 'text-primary'
            )}
          >
            Connections ({connections.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={cn(
            'flex-1 py-3.5 items-center justify-center flex-row gap-1.5 border-b-2 border-transparent',
            activeTab === 'requests' && 'border-b-primary'
          )}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('requests');
          }}
        >
          <Text
            className={cn(
              'text-sm font-semibold text-text-muted',
              activeTab === 'requests' && 'text-primary'
            )}
          >
            Requests ({incomingRequests.length})
          </Text>
          {incomingRequests.length > 0 && <View className="w-1.5 h-1.5 rounded-full bg-primary" />}
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : activeTab === 'connections' ? (
        /* CONNECTIONS TAB */
        <View className="flex-1">
          {/* Search Bar */}
          <View className="flex-row items-center bg-surface-subtle mx-4 mt-3.5 mb-2 px-3.5 h-11 rounded-[14px] border border-border gap-2.5">
            <Search size={16} color={theme.colors.textMuted} />
            <TextInput
              className="flex-1 text-sm text-text-primary font-medium"
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
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
            }
            ListEmptyComponent={
              <View className="py-16 items-center justify-center gap-2 px-6">
                <View className="w-16 h-16 rounded-full bg-primary-mist items-center justify-center mb-2">
                  <Users size={32} color={theme.colors.primary} />
                </View>
                <Text className="text-base font-bold text-text-primary">No Travel Mates Yet</Text>
                <Text className="text-[13px] text-text-secondary text-center leading-[18px]">
                  Send connection requests to travelers on Home or Matches to build your travel circle.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const location = [item.state, item.country].filter(Boolean).join(', ');
              return (
                <TouchableOpacity
                  className="flex-row items-center bg-surface p-3.5 rounded-[18px] border border-border gap-3"
                  activeOpacity={0.85}
                  onPress={() => handleViewProfile(item.userId, item.fullName, item.avatarUrl)}
                >
                  {/* Avatar */}
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} className="w-12 h-12 rounded-full bg-surface-subtle" />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
                      <Text className="text-white text-lg font-semibold">
                        {item.fullName?.charAt(0)?.toUpperCase() || 'V'}
                      </Text>
                    </View>
                  )}

                  {/* Name & Details */}
                  <View className="flex-1 gap-0.5">
                    <Text className="text-[15px] font-semibold text-text-primary" numberOfLines={1}>
                      {item.fullName}
                    </Text>
                    {location ? (
                      <View className="flex-row items-center gap-1">
                        <MapPin size={11} color={theme.colors.textSecondary} />
                        <Text className="text-xs text-text-secondary font-medium" numberOfLines={1}>
                          {location}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      className="flex-row items-center gap-1.5 bg-surface border border-primary px-3 py-[7px] rounded-xl"
                      onPress={() => handleMessage(item.userId, item.fullName, item.avatarUrl)}
                    >
                      <MessageSquare size={14} color={theme.colors.primary} />
                      <Text className="text-xs font-semibold text-primary">Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="p-1.5"
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
        <View className="flex-1">
          {/* Sub-tabs: Received vs Sent */}
          <View className="flex-row px-4 pt-3.5 gap-2.5">
            <TouchableOpacity
              className={cn(
                'px-4 py-2 rounded-full bg-surface-subtle border border-border',
                requestSubTab === 'incoming' && 'bg-primary border-primary'
              )}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRequestSubTab('incoming');
              }}
            >
              <Text
                className={cn(
                  'text-xs font-semibold text-text-secondary',
                  requestSubTab === 'incoming' && 'text-white'
                )}
              >
                Received ({incomingRequests.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={cn(
                'px-4 py-2 rounded-full bg-surface-subtle border border-border',
                requestSubTab === 'sent' && 'bg-primary border-primary'
              )}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRequestSubTab('sent');
              }}
            >
              <Text
                className={cn(
                  'text-xs font-semibold text-text-secondary',
                  requestSubTab === 'sent' && 'text-white'
                )}
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
              contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
              }
              ListEmptyComponent={
                <View className="py-16 items-center justify-center gap-2 px-6">
                  <View className="w-16 h-16 rounded-full bg-primary-mist items-center justify-center mb-2">
                    <Users size={32} color={theme.colors.primary} />
                  </View>
                  <Text className="text-base font-bold text-text-primary">No Incoming Requests</Text>
                  <Text className="text-[13px] text-text-secondary text-center leading-[18px]">
                    Keep an active trip on your profile so travelers heading to your destination can find and connect with you.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const senderLocation = [item.sender.state, item.sender.country]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <View className="bg-surface p-4 rounded-[20px] border border-border gap-3">
                    <TouchableOpacity
                      className="flex-row items-center gap-3"
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
                          className="w-12 h-12 rounded-full bg-surface-subtle"
                        />
                      ) : (
                        <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
                          <Text className="text-white text-lg font-semibold">
                            {item.sender.fullName?.charAt(0)?.toUpperCase() || 'V'}
                          </Text>
                        </View>
                      )}

                      <View className="flex-1 gap-0.5">
                        <Text className="text-[15px] font-semibold text-text-primary">{item.sender.fullName}</Text>
                        {senderLocation ? (
                          <View className="flex-row items-center gap-1">
                            <MapPin size={11} color={theme.colors.textSecondary} />
                            <Text className="text-xs text-text-secondary font-medium">{senderLocation}</Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>

                    {/* Request Note */}
                    {item.message ? (
                      <View className="bg-surface-subtle p-3 rounded-xl border border-border">
                        <Text className="text-[13px] text-text-secondary leading-[18px] italic">"{item.message}"</Text>
                      </View>
                    ) : null}

                    {/* Accept / Decline Row */}
                    <View className="flex-row gap-2.5">
                      <TouchableOpacity
                        className="flex-1 h-10 rounded-xl bg-primary flex-row items-center justify-center gap-1.5"
                        onPress={() => handleAccept(item)}
                      >
                        <Check size={14} color={theme.colors.white} strokeWidth={2.5} />
                        <Text className="text-white text-[13px] font-semibold">Accept</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="flex-1 h-10 rounded-xl bg-surface-subtle flex-row items-center justify-center gap-1.5"
                        onPress={() => handleReject(item.id)}
                      >
                        <X size={14} color={theme.colors.textSecondary} />
                        <Text className="text-text-secondary text-[13px] font-semibold">Decline</Text>
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
              contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
              }
              ListEmptyComponent={
                <View className="py-16 items-center justify-center gap-2 px-6">
                  <View className="w-16 h-16 rounded-full bg-primary-mist items-center justify-center mb-2">
                    <Clock size={32} color={theme.colors.primary} />
                  </View>
                  <Text className="text-base font-bold text-text-primary">No Sent Requests</Text>
                  <Text className="text-[13px] text-text-secondary text-center leading-[18px]">
                    Browse travelers on Home or Explore and send a request to plan a trip together.
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const receiverLocation = [item.receiver.state, item.receiver.country]
                  .filter(Boolean)
                  .join(', ');

                return (
                  <View className="bg-surface p-4 rounded-[20px] border border-border gap-3">
                    <TouchableOpacity
                      className="flex-row items-center gap-3"
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
                          className="w-12 h-12 rounded-full bg-surface-subtle"
                        />
                      ) : (
                        <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
                          <Text className="text-white text-lg font-semibold">
                            {item.receiver.fullName?.charAt(0)?.toUpperCase() || 'V'}
                          </Text>
                        </View>
                      )}

                      <View className="flex-1 gap-0.5">
                        <Text className="text-[15px] font-semibold text-text-primary">{item.receiver.fullName}</Text>
                        {receiverLocation ? (
                          <View className="flex-row items-center gap-1">
                            <MapPin size={11} color={theme.colors.textSecondary} />
                            <Text className="text-xs text-text-secondary font-medium">{receiverLocation}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View className="flex-row items-center gap-1 bg-surface-subtle px-2 py-1 rounded-[10px]">
                        <Clock size={11} color={theme.colors.textSecondary} />
                        <Text className="text-[11px] font-semibold text-text-secondary">Pending</Text>
                      </View>
                    </TouchableOpacity>

                    {item.message ? (
                      <View className="bg-surface-subtle p-3 rounded-xl border border-border">
                        <Text className="text-[13px] text-text-secondary leading-[18px] italic">"{item.message}"</Text>
                      </View>
                    ) : null}

                    {/* Cancel Request Button */}
                    <TouchableOpacity
                      className="h-[38px] rounded-xl bg-surface-subtle border border-border items-center justify-center"
                      onPress={() => handleCancelSent(item.id)}
                    >
                      <Text className="text-[13px] font-semibold text-text-secondary">Cancel Request</Text>
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
