import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../config/theme';
import { useAuthStore } from '../../../store/authStore';
import { useConnectionStore, ConnectionStatusType } from '../../../store/connectionStore';
import { useSafetyStore } from '../../../store/safetyStore';
import {
  useGetUsersForCardsInfinite,
  useGetNearbyUsers,
  useToggleTravelingStatus,
} from '../hooks/home.hooks';
import { useLiveLocation } from '../hooks/useLiveLocation';
import { useGetMe } from '../../profile/hooks/profile.hooks';
import { useGetActiveTrip } from '../../trips/hooks/trip.hooks';
import {
  useSendConnectionRequest,
  useAcceptConnectionRequest,
} from '../../connections/hooks/connection.hooks';
import { UserWithDetails } from '../types';
import { HomeHeader } from '../components/HomeHeader';
import { PlanTripBanner } from '../components/PlanTripBanner';
import { NearbyTravelersCarousel } from '../components/NearbyTravelersCarousel';
import { BuddyTravelerCard } from '../components/BuddyTravelerCard';
import { ConnectModal } from '../components/ConnectModal';
import { HomeSkeleton } from '../components/HomeSkeleton';
import { HomeEmptyState } from '../components/HomeEmptyState';
import { CreateTripModal } from '../../trips/components/CreateTripModal';
import { Users, Sparkles, MapPinOff, Compass } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import * as Haptics from 'expo-haptics';

const PAGE_SIZE = 8;

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: authUser } = useAuthStore();

  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);
  const [selectedUserForConnect, setSelectedUserForConnect] = useState<UserWithDetails | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // TanStack Query Hooks
  const {
    data: currentUserProfile,
    refetch: refetchProfile,
  } = useGetMe();

  const isTraveling = Boolean(currentUserProfile?.isTraveling ?? authUser?.isTraveling);

  const {
    liveLocation,
    isLocating,
    permissionDenied,
    openLocationSettings,
    refreshLiveLocation,
  } = useLiveLocation(isTraveling);

  const {
    data: activeTrip,
    refetch: refetchActiveTrip,
  } = useGetActiveTrip();

  const {
    data: cardsPages,
    isLoading,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchCards,
  } = useGetUsersForCardsInfinite(PAGE_SIZE);

  const {
    data: nearbyUsers = [],
    refetch: refetchNearby,
  } = useGetNearbyUsers(50, isTraveling && !permissionDenied);

  const toggleTravelingMutation = useToggleTravelingStatus();
  const sendConnectionMutation = useSendConnectionRequest();
  const acceptConnectionMutation = useAcceptConnectionRequest();

  const relationships = useConnectionStore((s) => s.relationships);
  const blockedUserIds = useSafetyStore((s) => s.blockedUserIds);

  const connectionsMap = useMemo(() => {
    const map: Record<string, ConnectionStatusType> = {};
    Object.entries(relationships).forEach(([uid, rel]) => {
      map[uid] = rel.status;
    });
    return map;
  }, [relationships]);

  // Flatten deduplicated paginated users from InfiniteQuery
  const buddyUsers = useMemo(() => {
    if (!cardsPages?.pages) return [];
    const seen = new Set<string>();
    const list: UserWithDetails[] = [];
    for (const page of cardsPages.pages) {
      for (const u of page.users) {
        if (!seen.has(u.id) && !blockedUserIds.includes(u.id)) {
          seen.add(u.id);
          list.push(u);
        }
      }
    }
    return list;
  }, [cardsPages, blockedUserIds]);

  const filteredNearbyUsers = useMemo(() => {
    return nearbyUsers.filter((u) => !blockedUserIds.includes(u.id));
  }, [nearbyUsers, blockedUserIds]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    refetchProfile();
    refetchActiveTrip();
    refetchCards();
    if (isTraveling && !permissionDenied) {
      void refreshLiveLocation();
      refetchNearby();
    }
  }, [refetchProfile, refetchActiveTrip, refetchCards, refetchNearby, refreshLiveLocation, isTraveling, permissionDenied]);

  // Infinite Scroll Trigger
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoading) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  // Toggle traveling status from Header
  const handleToggleTraveling = () => {
    if (toggleTravelingMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleTravelingMutation.mutate({
      isTraveling: !isTraveling,
      currentProfile: currentUserProfile,
    });
  };

  // Open Connect Modal
  const handleConnectPress = useCallback((user: UserWithDetails) => {
    setSelectedUserForConnect(user);
    setModalVisible(true);
  }, []);

  // Submit Connection Request
  const handleSendConnection = async (message: string) => {
    if (!selectedUserForConnect) return;
    await sendConnectionMutation.mutateAsync({
      receiverId: selectedUserForConnect.id,
      message,
    });
  };

  // Accept Connection Request
  const handleAcceptPress = useCallback(
    (user: UserWithDetails) => {
      acceptConnectionMutation.mutate({
        targetUserId: user.id,
        requestId: user.requestId,
      });
    },
    [acceptConnectionMutation]
  );

  // Message press
  const handleMessagePress = useCallback(
    (user: UserWithDetails) => {
      navigation.navigate('ChatRoom', {
        targetUserId: user.id,
        targetUserName: user.fullName,
        targetUserAvatar: user.avatarUrl || undefined,
      });
    },
    [navigation]
  );

  const handleUserCardPress = useCallback(
    (user: UserWithDetails, isNearby: boolean = false) => {
      navigation.navigate('UserProfile', {
        userId: user.id,
        tripId: user.activeTrip?.id,
        variant: isNearby ? 'NEARBY' : user.activeTrip ? 'COMPANION' : 'PUBLIC',
        distanceKm: user.distanceKm,
        initialName: user.fullName,
        initialAvatar: user.avatarUrl || undefined,
      });
    },
    [navigation]
  );

  const hasNearbyTravelers = isTraveling && filteredNearbyUsers.length > 0;

  const bottomNavPadding = 64 + Math.max(insets.bottom, 12) + 16;

  const renderHeader = () => (
    <View className="mb-1">
      <HomeHeader
        userName={currentUserProfile?.fullName || authUser?.fullName || 'Traveler'}
        avatarUrl={currentUserProfile?.avatarUrl || authUser?.avatarUrl}
        location={liveLocation}
        isLocating={isLocating}
        locationPermissionDenied={permissionDenied}
        onEnableLocationPress={openLocationSettings}
        isTraveling={isTraveling}
        onToggleTraveling={handleToggleTraveling}
        isUpdatingStatus={toggleTravelingMutation.isPending}
        onAvatarPress={() => navigation.navigate('Main', { screen: 'ProfileTab' } as any)}
        onNotificationsPress={() => navigation.navigate('Notifications')}
      />

      {!isLoading && !activeTrip && buddyUsers.length > 0 && (
        <PlanTripBanner onPlanTripPress={() => setIsCreateTripModalOpen(true)} />
      )}

      {isTraveling && permissionDenied && (
        <View className="mx-5 mb-5 bg-surface rounded-3xl border border-border p-4 shadow-subtle">
          <View className="flex-row items-start gap-3">
            <View className="w-10 h-10 rounded-2xl bg-surface-subtle items-center justify-center shrink-0 border border-border">
              <MapPinOff size={18} color={theme.colors.primary} />
            </View>
            <View className="flex-1 pr-1">
              <Text className="text-sm font-semibold text-text-primary tracking-tight">
                Location access is turned off
              </Text>
              <Text className="text-xs text-text-muted mt-1 leading-[18px]">
                Allow location access to see travelers within 50 km of your current route.
              </Text>
              <TouchableOpacity
                className="mt-3 self-start px-3.5 py-1.5 rounded-full bg-surface border border-primary flex-row items-center gap-1.5"
                onPress={openLocationSettings}
                activeOpacity={0.8}
              >
                <Compass size={13} color={theme.colors.primary} />
                <Text className="text-xs font-semibold text-primary">Enable Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {hasNearbyTravelers && (
        <NearbyTravelersCarousel
          users={filteredNearbyUsers}
          onUserPress={(user) => handleUserCardPress(user, true)}
          onConnectPress={handleConnectPress}
          onAcceptPress={handleAcceptPress}
          onMessagePress={handleMessagePress}
          connectionsMap={connectionsMap}
        />
      )}

      {buddyUsers.length > 0 && (
        <View className="flex-row justify-between items-center px-5 mt-2.5 mb-4">
          <View className="flex-row items-center gap-2.5 flex-1">
            <View className="w-9 h-9 rounded-full bg-surface-subtle items-center justify-center">
              <Users size={16} color={theme.colors.primary} />
            </View>
            <View>
              <Text className="text-[17px] font-semibold text-text-primary tracking-tight">
                Travelers Looking for Mates
              </Text>
              <Text className="text-xs text-text-muted mt-0.5">
                Connect with travelers planning upcoming trips
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View className="flex-row items-center justify-center py-4 gap-2">
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text className="text-xs font-semibold text-text-muted">Loading more travelers...</Text>
        </View>
      );
    }

    if (!isLoading && !hasNextPage && buddyUsers.length > 0) {
      return (
        <View className="flex-row items-center justify-center pt-3 pb-1 gap-1.5">
          <Sparkles size={13} color={theme.colors.primary} />
          <Text className="text-xs font-semibold text-primary">You have seen all travelers for now</Text>
        </View>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (isLoading) {
      return <HomeSkeleton />;
    }

    return (
      <HomeEmptyState
        activeTrip={activeTrip}
        onPlanTripPress={() => setIsCreateTripModalOpen(true)}
        onViewMatchesPress={() => navigation.navigate('Main', { screen: 'MatchesTab' } as any)}
        onViewTripsPress={() => navigation.navigate('Trips', { initialTab: 'active' })}
        onExplorePress={() => navigation.navigate('Main', { screen: 'ExploreTab' } as any)}
      />
    );
  };

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 w-full max-w-[560px] self-center">
        <FlatList
          data={buddyUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-5">
              <BuddyTravelerCard
                user={item}
                connectionStatus={connectionsMap[item.id] || item.connectionStatus || 'NONE'}
                onPress={handleUserCardPress}
                onConnectPress={handleConnectPress}
                onAcceptPress={handleAcceptPress}
                onMessagePress={handleMessagePress}
              />
            </View>
          )}
          ListHeaderComponent={renderHeader()}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={{
            paddingTop: insets.top + 8,
            paddingBottom: bottomNavPadding,
          }}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      </View>

      {/* Connect Modal Bottom Sheet */}
      <ConnectModal
        visible={modalVisible}
        recipientName={selectedUserForConnect?.fullName || 'Traveler'}
        onClose={() => setModalVisible(false)}
        onSend={handleSendConnection}
      />

      {/* Create Trip Modal */}
      <CreateTripModal
        visible={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        onTripCreated={onRefresh}
      />
    </View>
  );
};
