import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
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

  const [filters, setFilters] = useState<ExploreFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Connect Modal state
  const [selectedMatchForConnect, setSelectedMatchForConnect] = useState<TripMatchItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const hasStrictFilters = Boolean(
    filters.travelStyle ||
      filters.budgetStyle ||
      filters.dateFrom ||
      filters.dateTo,
  );

  const hasActiveSearch = Boolean(appliedQuery.trim() || hasStrictFilters);

  const badgeMode = useMemo<
    'STRICT_MATCH' | 'LOCATION_DISCOVERY' | 'CATEGORY_BROWSING'
  >(() => {
    const hasDestination = Boolean(appliedQuery.trim());
    if (hasDestination && hasStrictFilters) return 'STRICT_MATCH';
    if (hasDestination && !hasStrictFilters) return 'LOCATION_DISCOVERY';
    return 'CATEGORY_BROWSING';
  }, [appliedQuery, hasStrictFilters]);

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
        variant: item.tripMatch?.id ? 'MATCH' : 'PUBLIC',
        initialName: item.user.fullName,
        initialAvatar: item.user.avatarUrl || undefined,
      });
    },
    [navigation]
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
