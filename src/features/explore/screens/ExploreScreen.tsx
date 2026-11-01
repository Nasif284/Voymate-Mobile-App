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
import { theme } from '../../../config/theme';
import { useConnectionStore } from '../../../store/connectionStore';
import { useSearchTripMatches } from '../../matches/hooks/matches.hooks';
import {
  useSendConnectionRequest,
  useAcceptConnectionRequest,
} from '../../connections/hooks/connection.hooks';
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

  const [filters, setFilters] = useState<ExploreFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Connect Modal state
  const [selectedMatchForConnect, setSelectedMatchForConnect] = useState<TripMatchItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const hasActiveSearch = Boolean(
    appliedQuery.trim() ||
    filters.travelStyle ||
    filters.budgetStyle
  );

  const searchParams = useMemo(
    () => ({
      destinationName: appliedQuery.trim() || undefined,
      travelStyle: filters.travelStyle || undefined,
      budgetStyle: filters.budgetStyle || undefined,
      page: 1,
      limit: 15,
    }),
    [appliedQuery, filters.travelStyle, filters.budgetStyle]
  );

  // TanStack Query Hooks
  const {
    data: searchRes,
    isLoading,
    isRefetching,
    refetch,
  } = useSearchTripMatches(searchParams, hasActiveSearch);

  const sendConnectionMutation = useSendConnectionRequest();
  const acceptConnectionMutation = useAcceptConnectionRequest();

  const relationships = useConnectionStore((s) => s.relationships);
  const matches = searchRes?.matches || [];

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    if (hasActiveSearch) {
      refetch();
    }
  }, [hasActiveSearch, refetch]);

  // Handle input text change
  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim() && !filters.travelStyle && !filters.budgetStyle) {
      setAppliedQuery('');
    }
  };

  // Search submit
  const handleSearchSubmit = () => {
    setAppliedQuery(searchQuery.trim());
  };

  // Tap quick destination chip
  const handleSelectQuickDestination = (destName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery(destName);
    setAppliedQuery(destName);
  };

  // Apply filters from modal
  const handleApplyFilters = (newFilters: ExploreFilters) => {
    setFilters(newFilters);
    setAppliedQuery(searchQuery.trim());
  };

  // Reset filters & search
  const handleResetFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters({});
    setSearchQuery('');
    setAppliedQuery('');
  };

  // Remove single filter chip
  const handleRemoveFilter = (key: keyof ExploreFilters) => {
    const next = { ...filters };
    delete next[key];
    setFilters(next);
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
        matchId: item.tripMatch?.id,
        variant: item.tripMatch?.id ? 'MATCH' : 'PUBLIC',
        initialName: item.user.fullName,
        initialAvatar: item.user.avatarUrl || undefined,
      });
    },
    [navigation]
  );

  const tabBarHeight = 82 + insets.bottom;

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
      <ExploreHeader
        filters={filters}
        searchQuery={searchQuery}
        onSearchChange={handleSearchTextChange}
        onSubmitSearch={handleSearchSubmit}
        onOpenFilter={() => setIsFilterModalOpen(true)}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleResetFilters}
      />
      {!isLoading && hasActiveSearch && matches.length > 0 && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsCount}>
            {matches.length} companion{matches.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}
    </>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return <MatchesSkeleton />;
    }

    if (!hasActiveSearch) {
      return (
        <View style={styles.content}>
          <View style={styles.starterCard}>
            <View style={styles.starterIconCircle}>
              <Compass size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.starterTitle}>Search by Destination</Text>
            <Text style={styles.starterText}>
              Enter a city above or tap a popular destination below to see travelers going there.
            </Text>

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
        </View>
      );
    }

    return (
      <View style={styles.content}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Search size={26} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>
            No Travelers Going to &quot;{appliedQuery || 'Selected Filters'}&quot; Yet
          </Text>
          <Text style={styles.emptyText}>
            No one has posted a trip here with these filters yet. Plan a trip here so other travelers can find you, or clear your filters.
          </Text>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleResetFilters}
            activeOpacity={0.85}
          >
            <RotateCcw size={14} color={theme.colors.white} />
            <Text style={styles.clearBtnText}>Clear Search &amp; Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={!isLoading && hasActiveSearch ? matches : []}
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
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />

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
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cardWrapper: {
    paddingHorizontal: 20,
  },
  resultsBar: {
    marginBottom: 10,
    paddingHorizontal: 22,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  starterCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 6,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  starterIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starterTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    fontWeight: '600',
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
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  popularEmoji: {
    fontSize: 13,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    paddingVertical: 38,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
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
    fontWeight: '600',
    color: theme.colors.white,
  },
});
