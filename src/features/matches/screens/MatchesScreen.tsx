import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { useConnectionStore } from '../../../store/connectionStore';
import {
  useGetMatchesActiveTrip,
  useGetMatchesUpcomingTrips,
  useGetTripMatches,
} from '../hooks/matches.hooks';
import {
  useSendConnectionRequest,
  useAcceptConnectionRequest,
} from '../../connections/hooks/connection.hooks';
import { ActiveTrip, TripMatchItem } from '../types';
import { MatchesHeader } from '../components/MatchesHeader';
import { ActiveTripCapsule } from '../components/ActiveTripCapsule';
import { SelectTripModal } from '../components/SelectTripModal';
import { BuddiesOnTheRoadAlert } from '../components/BuddiesOnTheRoadAlert';
import { MatchCard } from '../components/MatchCard';
import { MatchesSkeleton } from '../components/MatchesSkeleton';
import { ConnectModal } from '../../home/components/ConnectModal';
import { CreateTripModal } from '../../trips/components/CreateTripModal';
import { Compass, ArrowRight, Luggage, Sparkles } from 'lucide-react-native';

type MatchesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'MatchesTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const MatchesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MatchesScreenNavigationProp>();

  const [selectedTripOverride, setSelectedTripOverride] = useState<ActiveTrip | null>(null);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);
  const [selectedMatchForConnect, setSelectedMatchForConnect] = useState<TripMatchItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // TanStack Query Hooks
  const {
    data: primaryTrip,
    isLoading: isLoadingPrimaryTrip,
    refetch: refetchPrimaryTrip,
  } = useGetMatchesActiveTrip();

  const {
    data: upcomingTrips = [],
    isLoading: isLoadingUpcomingTrips,
    refetch: refetchUpcomingTrips,
  } = useGetMatchesUpcomingTrips();

  // Derive active trip from override -> primaryTrip -> first upcoming trip
  const activeTrip = useMemo(() => {
    if (selectedTripOverride) {
      const updated = upcomingTrips.find((t) => t.id === selectedTripOverride.id);
      if (updated) return updated;
    }
    return primaryTrip?.id ? primaryTrip : upcomingTrips[0] || null;
  }, [selectedTripOverride, primaryTrip, upcomingTrips]);

  const {
    data: matchesResponse,
    isLoading: isLoadingMatches,
    isRefetching: isRefetchingMatches,
    refetch: refetchMatches,
  } = useGetTripMatches(activeTrip?.id, 1, 15);

  const sendConnectionMutation = useSendConnectionRequest();
  const acceptConnectionMutation = useAcceptConnectionRequest();

  const relationships = useConnectionStore((s) => s.relationships);

  const matches = matchesResponse?.matches || [];
  const buddiesOnRoad = matchesResponse?.buddiesOnRoad || [];
  const isLoading =
    isLoadingPrimaryTrip ||
    isLoadingUpcomingTrips ||
    (Boolean(activeTrip?.id) && isLoadingMatches);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    refetchPrimaryTrip();
    refetchUpcomingTrips();
    if (activeTrip?.id) {
      refetchMatches();
    }
  }, [refetchPrimaryTrip, refetchUpcomingTrips, refetchMatches, activeTrip?.id]);

  // Handle switching active trip
  const handleSelectTrip = (selected: ActiveTrip) => {
    setSelectedTripOverride(selected);
  };

  // Connect Handler
  const handleConnectPress = useCallback((item: TripMatchItem) => {
    setSelectedMatchForConnect(item);
    setModalVisible(true);
  }, []);

  const handleSendConnection = async (message: string) => {
    if (!selectedMatchForConnect) return;
    await sendConnectionMutation.mutateAsync({
      receiverId: selectedMatchForConnect.user.id,
      message,
    });
  };

  // Accept Handler
  const handleAcceptPress = useCallback(
    (item: TripMatchItem) => {
      acceptConnectionMutation.mutate({
        targetUserId: item.user.id,
        requestId: item.requestId || item.tripMatch?.requestId,
      });
    },
    [acceptConnectionMutation]
  );

  // Message Handler
  const handleMessagePress = useCallback(
    (item: TripMatchItem) => {
      navigation.navigate('ChatRoom', {
        targetUserId: item.user.id,
        targetUserName: item.user.fullName,
        targetUserAvatar: item.user.avatarUrl || undefined,
      });
    },
    [navigation]
  );

  const handleMatchCardPress = useCallback(
    (item: TripMatchItem) => {
      navigation.navigate('UserProfile', {
        userId: item.user.id,
        matchId: item.tripMatch.id,
        variant: 'MATCH',
        initialName: item.user.fullName,
        initialAvatar: item.user.avatarUrl || undefined,
      });
    },
    [navigation]
  );

  const tabBarHeight = 82 + insets.bottom;
  const destinationTitle = activeTrip?.destination?.name || activeTrip?.name;

  const renderMatchItem = useCallback(
    ({ item }: { item: TripMatchItem }) => (
      <View style={styles.cardWrapper}>
        <MatchCard
          match={item}
          connectionStatus={
            relationships[item.user.id]?.status ||
            item.connectionStatus ||
            item.tripMatch?.connectionStatus ||
            'NONE'
          }
          onPress={handleMatchCardPress}
          onConnectPress={handleConnectPress}
          onAcceptPress={handleAcceptPress}
          onMessagePress={handleMessagePress}
        />
      </View>
    ),
    [
      relationships,
      handleMatchCardPress,
      handleConnectPress,
      handleAcceptPress,
      handleMessagePress,
    ]
  );

  const renderHeader = () => (
    <>
      <MatchesHeader activeTripDestination={destinationTitle} />

      {!isLoading && activeTrip && (
        <View style={styles.content}>
          <ActiveTripCapsule
            trip={activeTrip}
            matchCount={matches.length}
            onChangeTrip={upcomingTrips.length > 1 ? () => setIsTripModalOpen(true) : undefined}
          />

          {buddiesOnRoad.length > 0 && (
            <BuddiesOnTheRoadAlert
              buddies={buddiesOnRoad}
              onMessagePress={handleMessagePress}
            />
          )}
        </View>
      )}
    </>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return <MatchesSkeleton />;
    }

    if (!activeTrip) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Compass size={30} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Create a Trip to See Your Matches</Text>
            <Text style={styles.emptyText}>
              Add your destination and travel dates to see travelers going to the same place at the same time.
            </Text>
            <View style={styles.emptyActionRow}>
              <TouchableOpacity
                style={styles.planTripBtn}
                onPress={() => setIsCreateTripModalOpen(true)}
                activeOpacity={0.85}
              >
                <Sparkles size={14} color={theme.colors.white} />
                <Text style={styles.planTripBtnText}>Create Travel Plan</Text>
                <ArrowRight size={14} color={theme.colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exploreBtnSecondary}
                onPress={() => navigation.navigate('ExploreTab')}
                activeOpacity={0.85}
              >
                <Compass size={14} color={theme.colors.primary} />
                <Text style={styles.exploreBtnSecondaryText}>Explore Destinations</Text>
                <ArrowRight size={13} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Compass size={28} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>
            No Matches for {destinationTitle || 'Your Trip'} Yet
          </Text>
          <Text style={styles.emptyText}>
            No travelers match your exact dates yet. Your trip is visible to others, and new matches will appear here automatically.
          </Text>
          <View style={styles.emptyActionRow}>
            <TouchableOpacity
              style={styles.planTripBtn}
              onPress={() => navigation.navigate('ExploreTab')}
              activeOpacity={0.85}
            >
              <Compass size={14} color={theme.colors.white} />
              <Text style={styles.planTripBtnText}>Explore Other Destinations</Text>
              <ArrowRight size={14} color={theme.colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exploreBtnSecondary}
              onPress={() => navigation.navigate('Trips', { initialTab: 'active' })}
              activeOpacity={0.85}
            >
              <Luggage size={14} color={theme.colors.primary} />
              <Text style={styles.exploreBtnSecondaryText}>View My Trips</Text>
              <ArrowRight size={13} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={!isLoading && activeTrip ? matches : []}
        keyExtractor={(item) => `${item.user.id}-${item.tripMatch?.id || ''}`}
        renderItem={renderMatchItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: insets.top + 8, paddingBottom: tabBarHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingMatches}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />

      {/* Select Trip Modal */}
      <SelectTripModal
        visible={isTripModalOpen}
        trips={upcomingTrips}
        selectedTripId={activeTrip?.id}
        onClose={() => setIsTripModalOpen(false)}
        onSelectTrip={handleSelectTrip}
        onPlanNewTrip={() => setIsCreateTripModalOpen(true)}
      />

      {/* Create Trip Modal */}
      <CreateTripModal
        visible={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        onTripCreated={onRefresh}
      />

      {/* Connect Modal */}
      <ConnectModal
        visible={modalVisible}
        recipientName={selectedMatchForConnect?.user.fullName || 'Traveler'}
        onClose={() => setModalVisible(false)}
        onSend={handleSendConnection}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 290,
    marginBottom: 20,
  },
  emptyActionRow: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  planTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  planTripBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.white,
  },
  exploreBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryMist,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  exploreBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
