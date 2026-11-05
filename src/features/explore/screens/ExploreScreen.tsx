import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { theme } from '../../../config/theme';
import { useConnectionStore } from '../../../store/connectionStore';
import { useSearchTripMatches } from '../../matches/hooks/matches.hooks';
import {
  useSendConnectionRequest,
  useAcceptConnectionRequest,
} from '../../connections/hooks/connection.hooks';
import { TripMatchItem } from '../../matches/types';
import { ExploreFilters, TRAVEL_STYLES, BUDGET_STYLES } from '../types';
import { ExploreHeader } from '../components/ExploreHeader';
import { FilterModal } from '../components/FilterModal';
import { MatchCard } from '../../matches/components/MatchCard';
import { MatchesSkeleton } from '../../matches/components/MatchesSkeleton';
import { ConnectModal } from '../../home/components/ConnectModal';
import { Compass, RotateCcw, Sparkles, Search, Calendar } from 'lucide-react-native';
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
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<ExploreFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Connect Modal state
  const [selectedMatchForConnect, setSelectedMatchForConnect] = useState<TripMatchItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const hasDestination = Boolean(appliedQuery.trim());
  const hasDates = Boolean(filters.dateFrom || filters.dateTo);
  const hasStyle = Boolean(filters.travelStyle);
  const hasBudget = Boolean(filters.budgetStyle);

  const hasStrictFilters = Boolean(
    hasStyle || hasBudget || hasDates,
  );

  const hasActiveSearch = Boolean(hasDestination || hasStrictFilters);

  const activeCriteriaCount = [hasDestination, hasDates, hasStyle, hasBudget].filter(Boolean).length;

  const { badgeMode, filterLabel } = useMemo<{
    badgeMode:
      | 'STRICT_MATCH'
      | 'LOCATION_DISCOVERY'
      | 'DATES_DISCOVERY'
      | 'STYLE_DISCOVERY'
      | 'BUDGET_DISCOVERY'
      | 'INTENT_MATCH'
      | 'OPEN_BROWSING';
    filterLabel?: string;
  }>(() => {
    // 1. Destination IS specified (Anchor Present):
    if (hasDestination) {
      if (hasStrictFilters) {
        // Destination + at least one other filter (Dates, Style, or Budget) -> Mathematical match
        return { badgeMode: 'STRICT_MATCH' };
      }
      // Destination only -> Qualitative vibe
      return { badgeMode: 'LOCATION_DISCOVERY' };
    }

    // 2. Destination NOT specified (Open Discovery):
    // Multi-Criteria Intent Matching (2 or more filters without destination):
    if (activeCriteriaCount >= 2) {
      if (hasDates && hasStyle && hasBudget) {
        return { badgeMode: 'INTENT_MATCH', filterLabel: 'Schedule & Vibe Fit' };
      }
      if (hasDates && hasStyle) {
        return { badgeMode: 'INTENT_MATCH', filterLabel: 'Dates & Style Match' };
      }
      if (hasDates && hasBudget) {
        return { badgeMode: 'INTENT_MATCH', filterLabel: 'Dates & Budget Fit' };
      }
      if (hasStyle && hasBudget) {
        return { badgeMode: 'INTENT_MATCH', filterLabel: 'Style & Budget Fit' };
      }
    }

    // Single-Criterion Intent Matching (Exactly 1 filter without destination):
    if (hasDates) {
      return { badgeMode: 'DATES_DISCOVERY', filterLabel: 'Dates Match' };
    }
    if (hasStyle) {
      const styleObj = TRAVEL_STYLES.find((s) => s.id === filters.travelStyle);
      const label = styleObj ? `${styleObj.icon} ${styleObj.label} Match` : 'Style Match';
      return { badgeMode: 'STYLE_DISCOVERY', filterLabel: label };
    }
    if (hasBudget) {
      const budgetObj = BUDGET_STYLES.find((b) => b.id === filters.budgetStyle);
      const label = budgetObj ? `${budgetObj.icon} ${budgetObj.label} Budget` : 'Budget Fit';
      return { badgeMode: 'BUDGET_DISCOVERY', filterLabel: label };
    }

    // 0 criteria specified (Default open browsing):
    return { badgeMode: 'OPEN_BROWSING' };
  }, [
    activeCriteriaCount,
    hasDestination,
    hasStrictFilters,
    hasDates,
    hasStyle,
    hasBudget,
    filters.travelStyle,
    filters.budgetStyle,
  ]);

  const searchParams = useMemo(
    () => ({
      destinationName: appliedQuery.trim() || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      travelStyle: filters.travelStyle || undefined,
      budgetStyle: filters.budgetStyle || undefined,
      page: 1,
      limit: 15,
    }),
    [
      appliedQuery,
      filters.dateFrom,
      filters.dateTo,
      filters.travelStyle,
      filters.budgetStyle,
    ],
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
    if (!text.trim() && !hasStrictFilters) {
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
    queryClient.invalidateQueries({ queryKey: ['trip_match_profile'] });
    setFilters(newFilters);
    setAppliedQuery(searchQuery.trim());
  };

  // Reset filters & search
  const handleResetFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    queryClient.invalidateQueries({ queryKey: ['trip_match_profile'] });
    setFilters({});
    setSearchQuery('');
    setAppliedQuery('');
  };

  // Remove single filter chip
  const handleRemoveFilter = (key: keyof ExploreFilters) => {
    queryClient.invalidateQueries({ queryKey: ['trip_match_profile'] });
    const next = { ...filters };
    if (key === 'dateFrom' || key === 'dateTo') {
      delete next.dateFrom;
      delete next.dateTo;
    } else {
      delete next[key];
    }
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
        variant: 'PUBLIC',
        initialName: item.user.fullName,
        initialAvatar: item.user.avatarUrl || undefined,
        badgeMode,
        filterLabel,
        initialMatchScore: item.tripMatch?.totalPoints ?? undefined,
        initialReasons: item.tripMatch?.explanation?.reasons ?? undefined,
      });
    },
    [navigation, badgeMode, filterLabel]
  );

  const bottomNavPadding = 64 + Math.max(insets.bottom, 12) + 16;

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
          badgeMode={badgeMode}
          filterLabel={filterLabel}
          onPress={handleMatchCardPress}
          onConnectPress={handleConnectPress}
          onAcceptPress={handleAcceptPress}
          onMessagePress={handleMessagePress}
        />
      </View>
    ),
    [
      relationships,
      badgeMode,
      filterLabel,
      handleMatchCardPress,
      handleConnectPress,
      handleAcceptPress,
      handleMessagePress,
    ]
  );

  const renderSubHeader = () => (
    <>
      {badgeMode === 'LOCATION_DISCOVERY' && !isLoading && matches.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsFilterModalOpen(true);
          }}
          activeOpacity={0.8}
          className="mx-5 mb-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-2.5 flex-1 pr-2">
            <View className="w-8 h-8 rounded-full bg-primary/15 items-center justify-center">
              <Calendar size={15} color={theme.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-text-primary">
                Traveling to {appliedQuery}?
              </Text>
              <Text className="text-[11px] text-text-muted mt-0.5">
                Add travel dates to see exact companion overlap %
              </Text>
            </View>
          </View>
          <View className="bg-primary px-2.5 py-1.5 rounded-xl">
            <Text className="text-[11px] font-semibold text-white">Add Dates</Text>
          </View>
        </TouchableOpacity>
      )}

      {badgeMode === 'DATES_DISCOVERY' && !isLoading && matches.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsFilterModalOpen(true);
          }}
          activeOpacity={0.8}
          className="mx-5 mb-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-2.5 flex-1 pr-2">
            <View className="w-8 h-8 rounded-full bg-primary/15 items-center justify-center">
              <Compass size={15} color={theme.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-text-primary">
                Dates selected
              </Text>
              <Text className="text-[11px] text-text-muted mt-0.5">
                Add travel style or budget to unlock exact % match
              </Text>
            </View>
          </View>
          <View className="bg-primary px-2.5 py-1.5 rounded-xl">
            <Text className="text-[11px] font-semibold text-white">Add Style</Text>
          </View>
        </TouchableOpacity>
      )}

      {badgeMode === 'STYLE_DISCOVERY' && !isLoading && matches.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsFilterModalOpen(true);
          }}
          activeOpacity={0.8}
          className="mx-5 mb-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-2.5 flex-1 pr-2">
            <View className="w-8 h-8 rounded-full bg-primary/15 items-center justify-center">
              <Calendar size={15} color={theme.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-text-primary">
                {filterLabel || 'Style'} selected
              </Text>
              <Text className="text-[11px] text-text-muted mt-0.5">
                Add travel dates or destination to unlock exact % match
              </Text>
            </View>
          </View>
          <View className="bg-primary px-2.5 py-1.5 rounded-xl">
            <Text className="text-[11px] font-semibold text-white">Add Dates</Text>
          </View>
        </TouchableOpacity>
      )}

      {badgeMode === 'BUDGET_DISCOVERY' && !isLoading && matches.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsFilterModalOpen(true);
          }}
          activeOpacity={0.8}
          className="mx-5 mb-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-2.5 flex-1 pr-2">
            <View className="w-8 h-8 rounded-full bg-primary/15 items-center justify-center">
              <Calendar size={15} color={theme.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-text-primary">
                {filterLabel || 'Budget'} preference active
              </Text>
              <Text className="text-[11px] text-text-muted mt-0.5">
                Add travel dates or destination to unlock exact % match
              </Text>
            </View>
          </View>
          <View className="bg-primary px-2.5 py-1.5 rounded-xl">
            <Text className="text-[11px] font-semibold text-white">Add Dates</Text>
          </View>
        </TouchableOpacity>
      )}

      {badgeMode === 'INTENT_MATCH' && !isLoading && matches.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsFilterModalOpen(true);
          }}
          activeOpacity={0.8}
          className="mx-5 mb-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-2.5 flex-1 pr-2">
            <View className="w-8 h-8 rounded-full bg-primary/15 items-center justify-center">
              <Sparkles size={15} color={theme.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-text-primary">
                {filterLabel || 'Filters'} matched
              </Text>
              <Text className="text-[11px] text-text-muted mt-0.5">
                Add a destination to calculate exact companion match %
              </Text>
            </View>
          </View>
          <View className="bg-primary px-2.5 py-1.5 rounded-xl">
            <Text className="text-[11px] font-semibold text-white">Add City</Text>
          </View>
        </TouchableOpacity>
      )}
      {!isLoading && hasActiveSearch && matches.length > 0 && (
        <View className="mb-2.5 px-5">
          <Text className="text-xs font-semibold text-text-muted uppercase tracking-wider">
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
        <View className="flex-1 px-5">
          <View className="bg-surface rounded-3xl py-8 px-5 items-center border border-border mt-1.5 shadow-subtle">
            <View className="w-[68px] h-[68px] rounded-full bg-surface-subtle items-center justify-center mb-4">
              <Compass size={32} color={theme.colors.primary} />
            </View>
            <Text className="text-lg font-semibold text-text-primary text-center">
              Search by Destination
            </Text>
            <Text className="text-[13px] text-text-muted text-center mt-1.5 leading-5 px-2">
              Enter a city above or tap a popular destination below to see travelers going there.
            </Text>

            <View className="flex-row items-center gap-1.5 mt-6 mb-3">
              <Sparkles size={12} color={theme.colors.primary} />
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Popular Destinations
              </Text>
            </View>
            <View className="flex-row flex-wrap justify-center gap-2">
              {POPULAR_DESTINATIONS.map((dest) => (
                <TouchableOpacity
                  key={dest.name}
                  className="flex-row items-center bg-surface-subtle py-2 px-3.5 rounded-full border border-border gap-1.5"
                  onPress={() => handleSelectQuickDestination(dest.name)}
                  activeOpacity={0.75}
                >
                  <Text className="text-[13px]">{dest.icon}</Text>
                  <Text className="text-xs font-semibold text-text-primary">{dest.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View className="flex-1 px-5">
        <View className="bg-surface rounded-2xl py-9 px-6 items-center border border-border mt-1.5">
          <View className="w-[60px] h-[60px] rounded-full bg-surface-subtle items-center justify-center mb-3.5">
            <Search size={26} color={theme.colors.primary} />
          </View>
          <Text className="text-base font-semibold text-text-primary text-center">
            No Travelers Going to "{appliedQuery || 'Selected Filters'}" Yet
          </Text>
          <Text className="text-[13px] text-text-muted text-center mt-1.5 leading-5">
            No one has posted a trip here with these filters yet. Plan a trip here so other travelers can find you, or clear your filters.
          </Text>
          <TouchableOpacity
            className="flex-row items-center bg-primary py-2.5 px-5 rounded-2xl mt-4 gap-1.5 shadow-subtle"
            onPress={handleResetFilters}
            activeOpacity={0.85}
          >
            <RotateCcw size={14} color={theme.colors.white} />
            <Text className="text-xs font-semibold text-white">Clear Search & Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* 1. Permanent Sticky Header: Never unmounts on keystrokes */}
      <ExploreHeader
        filters={filters}
        searchQuery={searchQuery}
        onSearchChange={handleSearchTextChange}
        onSubmitSearch={handleSearchSubmit}
        onOpenFilter={() => setIsFilterModalOpen(true)}
        onRemoveFilter={handleRemoveFilter}
        onClearAllFilters={handleResetFilters}
      />

      {/* 2. Scrollable Results List */}
      <FlatList
        data={!isLoading && hasActiveSearch ? matches : []}
        keyExtractor={(item) => `${item.user.id}-${item.tripMatch?.id || ''}`}
        renderItem={renderMatchItem}
        ListHeaderComponent={renderSubHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          paddingTop: 8,
          paddingBottom: bottomNavPadding,
        }}
        keyboardShouldPersistTaps="handled"
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
