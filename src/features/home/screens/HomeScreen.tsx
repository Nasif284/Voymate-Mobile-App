import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../config/theme';
import { useAuthStore } from '../../../store/authStore';
import { homeService } from '../services/home.service';
import { connectionService } from '../../connections/services/connection.service';
import { UserWithDetails } from '../types';
import { HomeHeader } from '../components/HomeHeader';
import { PlanTripBanner } from '../components/PlanTripBanner';
import { NearbyTravelersCarousel } from '../components/NearbyTravelersCarousel';
import { BuddyTravelerCard } from '../components/BuddyTravelerCard';
import { ConnectModal } from '../components/ConnectModal';
import { HomeSkeleton } from '../components/HomeSkeleton';
import { HomeEmptyState } from '../components/HomeEmptyState';
import { CreateTripModal } from '../../trips/components/CreateTripModal';
import { tripService } from '../../trips/services/trip.service';
import { Users, Compass, Sparkles } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import * as Haptics from 'expo-haptics';

const PAGE_SIZE = 8;

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: authUser, setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTraveling, setIsTraveling] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Pagination State for Infinite Reels-Style Scroll
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const isFetchingRef = useRef(false);

  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);

  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [nearbyUsers, setNearbyUsers] = useState<UserWithDetails[]>([]);
  const [buddyUsers, setBuddyUsers] = useState<UserWithDetails[]>([]);
  const [connectionsMap, setConnectionsMap] = useState<
    Record<string, 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE'>
  >({});

  // Connect Modal State
  const [selectedUserForConnect, setSelectedUserForConnect] = useState<UserWithDetails | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 1. Fetch user profile, active trip & connection statuses
  const fetchProfileAndConnections = async () => {
    try {
      const [profileRes, connectionsRes, requestsRes, activeTripRes] = await Promise.allSettled([
        homeService.getMyProfile(),
        connectionService.getConnections(),
        connectionService.getAllRequests(),
        tripService.getActiveTrip(),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value) {
        const p = profileRes.value;
        setCurrentUserProfile(p);
        setIsTraveling(Boolean(p.isTraveling));
      }

      if (activeTripRes.status === 'fulfilled') {
        setActiveTrip(activeTripRes.value);
      }

      const newMap: Record<string, 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE'> = {};

      if (connectionsRes.status === 'fulfilled' && Array.isArray(connectionsRes.value)) {
        connectionsRes.value.forEach((conn) => {
          const targetId = conn.userId || conn.id;
          if (targetId) newMap[targetId] = 'CONNECTED';
        });
      }

      if (requestsRes.status === 'fulfilled' && requestsRes.value?.requests) {
        const currentUserId = authUser?.id;
        requestsRes.value.requests.forEach((req: any) => {
          if (req.senderId === currentUserId) {
            newMap[req.receiverId] = 'REQUEST_SENT';
          } else if (req.receiverId === currentUserId) {
            newMap[req.senderId] = 'REQUEST_RECEIVED';
          }
        });
      }

      setConnectionsMap(newMap);
    } catch {
      // Non-blocking error
    }
  };

  // 2. Fetch travelers (Page 1) with includeAll=true for mobile
  const fetchInitialTravelers = async (travelingState: boolean) => {
    try {
      const promises: Promise<any>[] = [homeService.getUsersForCards(1, PAGE_SIZE, true)];

      if (travelingState) {
        promises.push(homeService.getNearbyUsers(1, 10, 50));
      }

      const results = await Promise.allSettled(promises);

      // Buddy users looking for companions across the platform
      if (results[0].status === 'fulfilled' && results[0].value?.users) {
        setBuddyUsers(results[0].value.users);
        setPage(1);
        setTotalPages(results[0].value.totalPages || 1);
      }

      // Nearby users (only when user is in traveling state)
      if (travelingState && results[1]?.status === 'fulfilled' && results[1].value?.users) {
        const activeNearby = results[1].value.users.filter(
          (u: UserWithDetails) => u.isTraveling !== false
        );
        setNearbyUsers(activeNearby);
      } else {
        setNearbyUsers([]);
      }
    } catch {
      // Non-blocking
    }
  };

  // Initial load
  const loadInitialData = async () => {
    setIsLoading(true);
    await fetchProfileAndConnections();
    try {
      const profile = await homeService.getMyProfile().catch(() => null);
      const traveling = Boolean(profile?.isTraveling);
      setIsTraveling(traveling);
      await fetchInitialTravelers(traveling);
    } catch {
      await fetchInitialTravelers(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Re-sync traveling status & profile whenever HomeScreen gains focus
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      homeService
        .getMyProfile()
        .then((profile) => {
          if (isMounted && profile) {
            setCurrentUserProfile(profile);
            const traveling = Boolean(profile.isTraveling);
            setIsTraveling(traveling);
            if (authUser && authUser.isTraveling !== traveling) {
              setUser({ ...authUser, isTraveling: traveling });
            }
          }
        })
        .catch(() => {});

      return () => {
        isMounted = false;
      };
    }, [authUser, setUser])
  );

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    await Promise.all([
      fetchProfileAndConnections(),
      fetchInitialTravelers(isTraveling),
    ]);
    setIsRefreshing(false);
  }, [isTraveling]);

  // Infinite Scroll Trigger (Reels-style continuous scroll)
  const handleLoadMore = async () => {
    if (
      isFetchingRef.current ||
      isFetchingNextPage ||
      page >= totalPages ||
      isLoading ||
      isRefreshing
    ) {
      return;
    }

    isFetchingRef.current = true;
    setIsFetchingNextPage(true);

    try {
      const nextPage = page + 1;
      const res = await homeService.getUsersForCards(nextPage, PAGE_SIZE, true);

      if (res?.users && res.users.length > 0) {
        setBuddyUsers((prev) => {
          const existingIds = new Set(prev.map((u) => u.id));
          const uniqueNew = res.users.filter((u) => !existingIds.has(u.id));
          return [...prev, ...uniqueNew];
        });
        setPage(nextPage);
        setTotalPages(res.totalPages || nextPage);
      } else {
        setTotalPages(page);
      }
    } catch {
      // Graceful fallback
    } finally {
      isFetchingRef.current = false;
      setIsFetchingNextPage(false);
    }
  };

  // Toggle traveling status from Header
  const handleToggleTraveling = async () => {
    if (isUpdatingStatus) return;
    const nextState = !isTraveling;
    const prevState = isTraveling;

    // Optimistic UI updates
    setIsTraveling(nextState);
    if (authUser) {
      setUser({ ...authUser, isTraveling: nextState });
    }
    setCurrentUserProfile((prev: any) => (prev ? { ...prev, isTraveling: nextState } : prev));
    setIsUpdatingStatus(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await homeService.updateTravelingStatus(nextState, currentUserProfile);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Refresh travelers feed in background without blocking or reverting status on feed error
      fetchInitialTravelers(nextState).catch(() => {});
    } catch (err: any) {
      // Revert on failure
      setIsTraveling(prevState);
      if (authUser) {
        setUser({ ...authUser, isTraveling: prevState });
      }
      setCurrentUserProfile((prev: any) => (prev ? { ...prev, isTraveling: prevState } : prev));
      Alert.alert(
        'Status Error',
        err?.response?.data?.message || 'Could not update traveling status right now. Please try again.'
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Open Connect Modal
  const handleConnectPress = (user: UserWithDetails) => {
    setSelectedUserForConnect(user);
    setModalVisible(true);
  };

  // Submit Connection Request
  const handleSendConnection = async (message: string) => {
    if (!selectedUserForConnect) return;
    const targetId = selectedUserForConnect.id;

    try {
      await connectionService.sendRequest({
        receiverId: targetId,
        message,
      });

      setConnectionsMap((prev) => ({
        ...prev,
        [targetId]: 'REQUEST_SENT',
      }));
    } catch (error: any) {
      Alert.alert(
        'Request Error',
        error?.response?.data?.message || 'Could not send request. Please try again.'
      );
    }
  };

  // Accept Connection Request
  const handleAcceptPress = async (user: UserWithDetails) => {
    try {
      await connectionService.acceptRequest(user.id);
      setConnectionsMap((prev) => ({
        ...prev,
        [user.id]: 'CONNECTED',
      }));
    } catch {
      Alert.alert('Error', 'Could not accept connection request.');
    }
  };

  // Message press
  const handleMessagePress = (user: UserWithDetails) => {
    navigation.navigate('ChatRoom', {
      targetUserId: user.id,
      targetUserName: user.fullName,
      targetUserAvatar: user.avatarUrl || undefined,
    });
  };

  const handleUserCardPress = (user: UserWithDetails, isNearby: boolean = false) => {
    navigation.navigate('UserProfile', {
      userId: user.id,
      tripId: user.activeTrip?.id,
      variant: isNearby ? 'NEARBY' : user.activeTrip ? 'COMPANION' : 'PUBLIC',
      distanceKm: user.distanceKm,
      initialName: user.fullName,
      initialAvatar: user.avatarUrl || undefined,
    });
  };

  const hasNearbyTravelers = isTraveling && nearbyUsers.length > 0;
  const userLocationString =
    currentUserProfile?.city && currentUserProfile?.state
      ? `${currentUserProfile.city}, ${currentUserProfile.state}`
      : currentUserProfile?.state || currentUserProfile?.country || null;

  const tabBarHeight = 82 + insets.bottom;

  // Render Header Above Feed
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* 1. Profile & Traveling Status Toggle Header */}
      <HomeHeader
        userName={currentUserProfile?.fullName || authUser?.fullName || 'Traveler'}
        avatarUrl={currentUserProfile?.avatarUrl || authUser?.avatarUrl}
        location={userLocationString}
        isTraveling={isTraveling}
        onToggleTraveling={handleToggleTraveling}
        isUpdatingStatus={isUpdatingStatus}
        onAvatarPress={() => navigation.navigate('Main', { screen: 'ProfileTab' } as any)}
      />

      {/* 2. Plan Trip Banner if user has no active trip AND feed is not empty */}
      {!isLoading && !activeTrip && buddyUsers.length > 0 && (
        <PlanTripBanner onPlanTripPress={() => setIsCreateTripModalOpen(true)} />
      )}

      {/* 3. Nearby Section: ONLY shown first when user is traveling */}
      {hasNearbyTravelers && (
        <NearbyTravelersCarousel
          users={nearbyUsers}
          onUserPress={(user) => handleUserCardPress(user, true)}
          onConnectPress={handleConnectPress}
          connectionsMap={connectionsMap}
        />
      )}

      {/* 4. Infinite Feed Section Title (Only shown when buddy users exist) */}
      {buddyUsers.length > 0 && (
        <View style={styles.feedHeader}>
          <View style={styles.feedHeaderLeft}>
            <View style={styles.feedIconCircle}>
              <Users size={16} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.feedTitle}>Looking for Travel Buddies</Text>
              <Text style={styles.feedSubtitle}>
                Solo travelers seeking companions for upcoming journeys
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // Render Bottom Footer: Spinner while fetching next page or "All caught up"
  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.footerLoaderText}>Finding more travelers...</Text>
        </View>
      );
    }

    if (!isLoading && page >= totalPages && buddyUsers.length > 0) {
      return (
        <View style={styles.caughtUpContainer}>
          <Sparkles size={13} color={theme.colors.primary} />
          <Text style={styles.caughtUpText}>You're all caught up with travelers</Text>
        </View>
      );
    }

    return null;
  };

  // Render Psychologically-Optimized Empty State
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
              connectionStatus={connectionsMap[item.id] || 'NONE'}
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
            refreshing={isRefreshing}
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
    backgroundColor: '#F8FAF8',
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
    backgroundColor: '#EEF8F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedTitle: {
    fontSize: 17,
    fontWeight: '800',
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
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
