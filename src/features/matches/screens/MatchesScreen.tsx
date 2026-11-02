import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
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
      <View className="px-5">
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
        <View className="px-5">
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
        <View className="px-5 mt-2.5">
          <View className="bg-surface rounded-3xl p-8 items-center border border-border shadow-subtle">
            <View className="w-[60px] h-[60px] rounded-full bg-primary-mist items-center justify-center mb-4">
              <Compass size={30} color={theme.colors.primary} />
            </View>
            <Text className="text-lg font-semibold text-text-primary mb-2 text-center">
              Create a Trip to See Your Matches
            </Text>
            <Text className="text-[13px] text-text-secondary text-center leading-5 max-w-[290px] mb-5">
              Add your destination and travel dates to see travelers going to the same place at the same time.
            </Text>
            <View className="flex-col w-full gap-2.5 items-center">
              <TouchableOpacity
                className="flex-row items-center justify-center bg-primary py-3.5 px-6 rounded-2xl w-full gap-2 shadow-card"
                onPress={() => setIsCreateTripModalOpen(true)}
                activeOpacity={0.85}
              >
                <Sparkles size={14} color={theme.colors.white} />
                <Text className="text-sm font-semibold text-white">Create Travel Plan</Text>
                <ArrowRight size={14} color={theme.colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center bg-surface py-2.5 px-4 rounded-xl gap-1.5 border border-primary"
                onPress={() => navigation.navigate('ExploreTab')}
                activeOpacity={0.85}
              >
                <Compass size={14} color={theme.colors.primary} />
                <Text className="text-xs font-semibold text-primary">Explore Destinations</Text>
                <ArrowRight size={13} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View className="px-5">
        <View className="bg-surface rounded-3xl p-8 items-center border border-border shadow-subtle">
          <View className="w-[60px] h-[60px] rounded-full bg-primary-mist items-center justify-center mb-4">
            <Compass size={28} color={theme.colors.primary} />
          </View>
          <Text className="text-lg font-semibold text-text-primary mb-2 text-center">
            No Matches for {destinationTitle || 'Your Trip'} Yet
          </Text>
          <Text className="text-[13px] text-text-secondary text-center leading-5 max-w-[290px] mb-5">
            No travelers match your exact dates yet. Your trip is visible to others, and new matches will appear here automatically.
          </Text>
          <View className="flex-col w-full gap-2.5 items-center">
            <TouchableOpacity
              className="flex-row items-center justify-center bg-primary py-3.5 px-6 rounded-2xl w-full gap-2 shadow-card"
              onPress={() => navigation.navigate('ExploreTab')}
              activeOpacity={0.85}
            >
              <Compass size={14} color={theme.colors.white} />
              <Text className="text-sm font-semibold text-white">Explore Other Destinations</Text>
              <ArrowRight size={14} color={theme.colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center bg-surface py-2.5 px-4 rounded-xl gap-1.5 border border-primary"
              onPress={() => navigation.navigate('Trips', { initialTab: 'active' })}
              activeOpacity={0.85}
            >
              <Luggage size={14} color={theme.colors.primary} />
              <Text className="text-xs font-semibold text-primary">View My Trips</Text>
              <ArrowRight size={13} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={!isLoading && activeTrip ? matches : []}
        keyExtractor={(item) => `${item.user.id}-${item.tripMatch?.id || ''}`}
        renderItem={renderMatchItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: tabBarHeight + 24,
        }}
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
