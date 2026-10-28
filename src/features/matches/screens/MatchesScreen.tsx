import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { useAuthStore } from '../../../store/authStore';
import { matchesService } from '../services/matches.service';
import { connectionService } from '../../connections/services/connection.service';
import { ActiveTrip, TripMatchItem } from '../types';
import { MatchesHeader } from '../components/MatchesHeader';
import { ActiveTripCapsule } from '../components/ActiveTripCapsule';
import { SelectTripModal } from '../components/SelectTripModal';
import { BuddiesOnTheRoadAlert } from '../components/BuddiesOnTheRoadAlert';
import { MatchCard } from '../components/MatchCard';
import { MatchesSkeleton } from '../components/MatchesSkeleton';
import { ConnectModal } from '../../home/components/ConnectModal';
import { CreateTripModal } from '../../trips/components/CreateTripModal';
import { Compass, ArrowRight, Luggage, Plus, Sparkles } from 'lucide-react-native';

type MatchesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'MatchesTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const MatchesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MatchesScreenNavigationProp>();
  const { user: authUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<ActiveTrip[]>([]);
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);

  const [matches, setMatches] = useState<TripMatchItem[]>([]);
  const [buddiesOnRoad, setBuddiesOnRoad] = useState<TripMatchItem[]>([]);
  const [connectionsMap, setConnectionsMap] = useState<
    Record<string, 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE'>
  >({});

  // Connect Modal state
  const [selectedMatchForConnect, setSelectedMatchForConnect] = useState<TripMatchItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 1. Fetch connection statuses
  const fetchConnections = async () => {
    try {
      const [connectionsRes, requestsRes] = await Promise.allSettled([
        connectionService.getConnections(),
        connectionService.getAllRequests(),
      ]);

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
      // Non-blocking
    }
  };

  // 2. Fetch matches for selected Trip
  const fetchTripMatches = async (tripId: string) => {
    try {
      const res = await matchesService.getTripMatches(tripId, 1, 15);
      setMatches(res.matches || []);
      setBuddiesOnRoad(res.buddiesOnRoad || []);
    } catch {
      setMatches([]);
      setBuddiesOnRoad([]);
    }
  };

  // Initial loading
  const loadData = async () => {
    setIsLoading(true);
    await fetchConnections();

    try {
      const [primaryTrip, userTrips] = await Promise.all([
        matchesService.getActiveTrip(),
        matchesService.getUserUpcomingTrips(),
      ]);

      setUpcomingTrips(userTrips);

      const targetTrip = primaryTrip?.id ? primaryTrip : userTrips[0] || null;
      setActiveTrip(targetTrip);

      if (targetTrip?.id) {
        await fetchTripMatches(targetTrip.id);
      } else {
        setMatches([]);
        setBuddiesOnRoad([]);
      }
    } catch {
      setActiveTrip(null);
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchConnections();

    try {
      const [primaryTrip, userTrips] = await Promise.all([
        matchesService.getActiveTrip(),
        matchesService.getUserUpcomingTrips(),
      ]);
      setUpcomingTrips(userTrips);

      const currentTripId = activeTrip?.id || primaryTrip?.id || userTrips[0]?.id;
      const targetTrip = userTrips.find((t) => t.id === currentTripId) || primaryTrip || userTrips[0] || null;
      setActiveTrip(targetTrip);

      if (targetTrip?.id) {
        await fetchTripMatches(targetTrip.id);
      } else {
        setMatches([]);
      }
    } catch {
      // Non-blocking
    }
    setIsRefreshing(false);
  }, [activeTrip]);

  // Handle switching active trip
  const handleSelectTrip = async (selected: ActiveTrip) => {
    setActiveTrip(selected);
    setIsLoading(true);
    await fetchTripMatches(selected.id);
    setIsLoading(false);
  };

  // Connect Handler
  const handleConnectPress = (item: TripMatchItem) => {
    setSelectedMatchForConnect(item);
    setModalVisible(true);
  };

  const handleSendConnection = async (message: string) => {
    if (!selectedMatchForConnect) return;
    const targetId = selectedMatchForConnect.user.id;

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

  // Accept Handler
  const handleAcceptPress = async (item: TripMatchItem) => {
    try {
      await connectionService.acceptRequest(item.user.id);
      setConnectionsMap((prev) => ({
        ...prev,
        [item.user.id]: 'CONNECTED',
      }));
    } catch {
      Alert.alert('Error', 'Could not accept connection request.');
    }
  };

  // Message Handler
  const handleMessagePress = (item: TripMatchItem) => {
    navigation.navigate('ChatRoom', {
      targetUserId: item.user.id,
      targetUserName: item.user.fullName,
      targetUserAvatar: item.user.avatarUrl || undefined,
    });
  };

  const handleMatchCardPress = (item: TripMatchItem) => {
    navigation.navigate('UserProfile', {
      userId: item.user.id,
      matchId: item.tripMatch.id,
      variant: 'MATCH',
      initialName: item.user.fullName,
      initialAvatar: item.user.avatarUrl || undefined,
    });
  };

  const tabBarHeight = 82 + insets.bottom;
  const destinationTitle = activeTrip?.destination?.name || activeTrip?.name;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: insets.top + 8, paddingBottom: tabBarHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <MatchesHeader activeTripDestination={destinationTitle} />

        {isLoading ? (
          <MatchesSkeleton />
        ) : !activeTrip ? (
          /* Empty state: No active trip scheduled */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Compass size={30} color={theme.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Where Will You Go Next?</Text>
              <Text style={styles.emptyText}>
                Plan your next trip to automatically discover and connect with companions heading to the same destination on overlapping dates.
              </Text>
              <View style={styles.emptyActionRow}>
                <TouchableOpacity
                  style={styles.planTripBtn}
                  onPress={() => setIsCreateTripModalOpen(true)}
                  activeOpacity={0.85}
                >
                  <Sparkles size={14} color="#FFFFFF" />
                  <Text style={styles.planTripBtnText}>Plan a Trip</Text>
                  <ArrowRight size={14} color="#FFFFFF" />
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
        ) : (
          <View style={styles.content}>
            {/* Active Trip Capsule with Switch Trip Button */}
            <ActiveTripCapsule
              trip={activeTrip}
              matchCount={matches.length}
              onChangeTrip={upcomingTrips.length > 1 ? () => setIsTripModalOpen(true) : undefined}
            />

            {/* Buddies on the road alert */}
            {buddiesOnRoad.length > 0 && (
              <BuddiesOnTheRoadAlert
                buddies={buddiesOnRoad}
                onMessagePress={handleMessagePress}
              />
            )}

            {/* Match Cards List */}
            {matches.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Compass size={28} color={theme.colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Matches Found Yet</Text>
                <Text style={styles.emptyText}>
                  We haven't found other travelers with overlapping dates to {destinationTitle || 'your destination'} just yet. Check back soon or search other destinations!
                </Text>
                <TouchableOpacity
                  style={styles.exploreBtnSecondary}
                  onPress={() => navigation.navigate('ExploreTab')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.exploreBtnSecondaryText}>Explore Other Destinations</Text>
                  <ArrowRight size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              matches.map((item) => (
                <MatchCard
                  key={`${item.user.id}-${item.tripMatch?.id || ''}`}
                  match={item}
                  connectionStatus={connectionsMap[item.user.id] || 'NONE'}
                  onPress={handleMatchCardPress}
                  onConnectPress={handleConnectPress}
                  onAcceptPress={handleAcceptPress}
                  onMessagePress={handleMessagePress}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

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
    backgroundColor: '#F8FAF8',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE9',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    color: '#FFFFFF',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  exploreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exploreBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8F4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(15, 110, 86, 0.2)',
  },
  exploreBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
