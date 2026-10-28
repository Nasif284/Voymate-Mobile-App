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
import { theme } from '../../../config/theme';
import { useAuthStore } from '../../../store/authStore';
import { matchesService } from '../../matches/services/matches.service';
import { connectionService } from '../../connections/services/connection.service';
import { TripMatchItem } from '../../matches/types';
import { ExploreFilters } from '../types';
import { ExploreHeader } from '../components/ExploreHeader';
import { FilterModal } from '../components/FilterModal';
import { MatchCard } from '../../matches/components/MatchCard';
import { MatchesSkeleton } from '../../matches/components/MatchesSkeleton';
import { ConnectModal } from '../../home/components/ConnectModal';
import { Compass, RotateCcw, Sparkles, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';

const POPULAR_DESTINATIONS = [
  { name: 'Manali', icon: '🏔️' },
  { name: 'Goa', icon: '🏖️' },
  { name: 'Munnar', icon: '🌲' },
  { name: 'Rajasthan', icon: '🏜️' },
  { name: 'Tokyo', icon: '🌸' },
  { name: 'Paris', icon: '🗼' },
];

export const ExploreScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: authUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filters, setFilters] = useState<ExploreFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [matches, setMatches] = useState<TripMatchItem[]>([]);
  const [connectionsMap, setConnectionsMap] = useState<
    Record<string, 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE'>
  >({});

  // Connect Modal state
  const [selectedMatchForConnect, setSelectedMatchForConnect] = useState<TripMatchItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const hasActiveSearch = Boolean(
    appliedQuery.trim() ||
    filters.travelStyle ||
    filters.budgetStyle
  );

  // 1. Fetch connection statuses in background
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

  // 2. Fetch matches ONLY when a search query or filter is active
  const fetchExploreResults = async (activeFilters: ExploreFilters, query: string) => {
    const destination = query.trim();
    const hasQueryOrFilter = Boolean(
      destination ||
      activeFilters.travelStyle ||
      activeFilters.budgetStyle
    );

    if (!hasQueryOrFilter) {
      setMatches([]);
      return;
    }

    try {
      const res = await matchesService.searchMatches({
        destinationName: destination || undefined,
        travelStyle: activeFilters.travelStyle || undefined,
        budgetStyle: activeFilters.budgetStyle || undefined,
        page: 1,
        limit: 15,
      });
      setMatches(res.matches || []);
    } catch {
      setMatches([]);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchConnections();
    if (hasActiveSearch) {
      await fetchExploreResults(filters, appliedQuery);
    }
    setIsRefreshing(false);
  }, [filters, appliedQuery, hasActiveSearch]);

  // Handle input text change
  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    // If user clears input and no filters are active, return to starter state
    if (!text.trim() && !filters.travelStyle && !filters.budgetStyle) {
      setAppliedQuery('');
      setMatches([]);
    }
  };

  // Search submit
  const handleSearchSubmit = async () => {
    const trimmed = searchQuery.trim();
    setAppliedQuery(trimmed);
    if (!trimmed && !filters.travelStyle && !filters.budgetStyle) {
      setMatches([]);
      return;
    }
    setIsLoading(true);
    await fetchExploreResults(filters, trimmed);
    setIsLoading(false);
  };

  // Tap quick destination chip
  const handleSelectQuickDestination = async (destName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery(destName);
    setAppliedQuery(destName);
    setIsLoading(true);
    await fetchExploreResults(filters, destName);
    setIsLoading(false);
  };

  // Apply filters from modal
  const handleApplyFilters = async (newFilters: ExploreFilters) => {
    const trimmed = searchQuery.trim();
    setFilters(newFilters);
    setAppliedQuery(trimmed);
    setIsLoading(true);
    await fetchExploreResults(newFilters, trimmed);
    setIsLoading(false);
  };

  // Reset filters & search
  const handleResetFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters({});
    setSearchQuery('');
    setAppliedQuery('');
    setMatches([]);
  };

  // Remove single filter chip
  const handleRemoveFilter = async (key: keyof ExploreFilters) => {
    const next = { ...filters };
    delete next[key];
    setFilters(next);

    const stillHasSearch = Boolean(
      appliedQuery.trim() ||
      next.travelStyle ||
      next.budgetStyle
    );

    if (!stillHasSearch) {
      setMatches([]);
      return;
    }

    setIsLoading(true);
    await fetchExploreResults(next, appliedQuery);
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
      matchId: item.tripMatch?.id,
      variant: item.tripMatch?.id ? 'MATCH' : 'PUBLIC',
      initialName: item.user.fullName,
      initialAvatar: item.user.avatarUrl || undefined,
    });
  };

  const tabBarHeight = 82 + insets.bottom;

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
        {/* Header with Search & Filter Trigger */}
        <ExploreHeader
          filters={filters}
          searchQuery={searchQuery}
          onSearchChange={handleSearchTextChange}
          onSubmitSearch={handleSearchSubmit}
          onOpenFilter={() => setIsFilterModalOpen(true)}
          onRemoveFilter={handleRemoveFilter}
          onClearAllFilters={handleResetFilters}
        />

        {isLoading ? (
          <MatchesSkeleton />
        ) : (
          <View style={styles.content}>
            {/* Default State: Creative & Inspiring Discovery Starter when no search/filter is active */}
            {!hasActiveSearch ? (
              <View style={styles.starterCard}>
                <View style={styles.starterIconCircle}>
                  <Compass size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.starterTitle}>Where will you wander next?</Text>
                <Text style={styles.starterText}>
                  Search any city or region above to discover solo travelers heading your way on the road.
                </Text>

                {/* Popular Inspiration Chips */}
                <View style={styles.startersHeader}>
                  <Sparkles size={12} color={theme.colors.primary} />
                  <Text style={styles.startersLabel}>Popular Destinations</Text>
                </View>
                <View style={styles.popularGrid}>
                  {POPULAR_DESTINATIONS.map((dest) => (
                    <TouchableOpacity
                      key={dest.name}
                      style={styles.popularChip}
                      onPress={() => handleSelectQuickDestination(dest.name)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.popularEmoji}>{dest.icon}</Text>
                      <Text style={styles.popularText}>{dest.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : matches.length === 0 ? (
              /* Active Search / Filter with 0 Results */
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Search size={26} color={theme.colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>
                  No matches for "{appliedQuery || 'selected filters'}"
                </Text>
                <Text style={styles.emptyText}>
                  No travelers are currently scheduled for this destination with your selected criteria. Try another city or clear filters.
                </Text>
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={handleResetFilters}
                  activeOpacity={0.85}
                >
                  <RotateCcw size={14} color="#FFFFFF" />
                  <Text style={styles.clearBtnText}>Clear Search & Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Active Search Results Feed */
              <>
                <View style={styles.resultsBar}>
                  <Text style={styles.resultsCount}>
                    {matches.length} companion{matches.length !== 1 ? 's' : ''} found
                  </Text>
                </View>
                {matches.map((item) => (
                  <MatchCard
                    key={`${item.user.id}-${item.tripMatch?.id || ''}`}
                    match={item}
                    connectionStatus={connectionsMap[item.user.id] || 'NONE'}
                    onPress={handleMatchCardPress}
                    onConnectPress={handleConnectPress}
                    onAcceptPress={handleAcceptPress}
                    onMessagePress={handleMessagePress}
                  />
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Filter Bottom Sheet Modal */}
      <FilterModal
        visible={isFilterModalOpen}
        filters={filters}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Connect Request Modal */}
      <ConnectModal
        visible={modalVisible}
        recipientName={selectedMatchForConnect?.user.fullName || 'Traveler'}
        onClose={() => {
          setModalVisible(false);
          setSelectedMatchForConnect(null);
        }}
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
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsBar: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Discovery Starter State (Initial Entry)
  starterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  starterIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EEF8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starterTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  starterText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  startersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 24,
    marginBottom: 12,
  },
  startersLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: theme.colors.primary,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7F5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8E4',
    gap: 6,
  },
  popularEmoji: {
    fontSize: 13,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  // No Results Found State
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 38,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginTop: 18,
    gap: 6,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
