import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../config/theme';
import { useAuthStore } from '../../../store/authStore';
import { useConnectionStore, ConnectionStatusType } from '../../../store/connectionStore';
import {
  useGetUsersForCardsInfinite,
  useGetNearbyUsers,
  useToggleTravelingStatus,
} from '../hooks/home.hooks';
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
import { Users, Sparkles } from 'lucide-react-native';
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
  } = useGetNearbyUsers(50, isTraveling);

  const toggleTravelingMutation = useToggleTravelingStatus();
  const sendConnectionMutation = useSendConnectionRequest();
  const acceptConnectionMutation = useAcceptConnectionRequest();

  const relationships = useConnectionStore((s) => s.relationships);

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
        if (!seen.has(u.id)) {
          seen.add(u.id);
          list.push(u);
        }
      }
    }
    return list;
  }, [cardsPages]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    refetchProfile();
    refetchActiveTrip();
    refetchCards();
    if (isTraveling) {
      refetchNearby();
    }
  }, [refetchProfile, refetchActiveTrip, refetchCards, refetchNearby, isTraveling]);

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

  const hasNearbyTravelers = isTraveling && nearbyUsers.length > 0;
  const userLocationString =
    currentUserProfile?.city && currentUserProfile?.state
      ? `${currentUserProfile.city}, ${currentUserProfile.state}`
      : currentUserProfile?.state || currentUserProfile?.country || null;

  const tabBarHeight = 82 + insets.bottom;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <HomeHeader
        userName={currentUserProfile?.fullName || authUser?.fullName || 'Traveler'}
        avatarUrl={currentUserProfile?.avatarUrl || authUser?.avatarUrl}
        location={userLocationString}
        isTraveling={isTraveling}
        onToggleTraveling={handleToggleTraveling}
        isUpdatingStatus={toggleTravelingMutation.isPending}
        onAvatarPress={() => navigation.navigate('Main', { screen: 'ProfileTab' } as any)}
      />

      {!isLoading && !activeTrip && buddyUsers.length > 0 && (
        <PlanTripBanner onPlanTripPress={() => setIsCreateTripModalOpen(true)} />
      )}

      {hasNearbyTravelers && (
        <NearbyTravelersCarousel
          users={nearbyUsers}
          onUserPress={(user) => handleUserCardPress(user, true)}
          onConnectPress={handleConnectPress}
          onAcceptPress={handleAcceptPress}
          onMessagePress={handleMessagePress}
          connectionsMap={connectionsMap}
        />
      )}

      {buddyUsers.length > 0 && (
        <View style={styles.feedHeader}>
          <View style={styles.feedHeaderLeft}>
            <View style={styles.feedIconCircle}>
              <Users size={16} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.feedTitle}>Travelers Looking for Mates</Text>
              <Text style={styles.feedSubtitle}>
                Connect with solo travelers planning upcoming trips
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
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.footerLoaderText}>Loading more travelers...</Text>
        </View>
      );
    }

    if (!isLoading && !hasNextPage && buddyUsers.length > 0) {
      return (
        <View style={styles.caughtUpContainer}>
          <Sparkles size={13} color={theme.colors.primary} />
          <Text style={styles.caughtUpText}>You have seen all travelers for now</Text>
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
    <View style={styles.screen}>
      <FlatList
        data={buddyUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
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
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 8, paddingBottom: tabBarHeight + 24 },
        ]}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 4,
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
  },
  feedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  feedIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  feedSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  caughtUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  caughtUpText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
