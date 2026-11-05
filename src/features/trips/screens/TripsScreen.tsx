import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import {
  useGetUpcomingTrips,
  useGetPastTrips,
  useDeleteTripPlan,
} from '../hooks/trip.hooks';
import { UserTrip } from '../types';
import { EditTripModal } from '../components/EditTripModal';
import { CreateTripModal } from '../components/CreateTripModal';
import {
  ChevronLeft,
  Search,
  Calendar,
  MapPin,
  Plus,
  Compass,
  Edit3,
  Trash2,
  Wallet,
  Clock,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { theme } from '../../../config/theme';
import { cn } from '../../../utils/cn';

type Props = NativeStackScreenProps<RootStackParamList, 'Trips'>;

type TripTab = 'active' | 'past';

const formatDateRange = (from?: string | Date, to?: string | Date) => {
  if (!from) return '';
  try {
    const dFrom = new Date(from);
    const fromStr = dFrom.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
    if (!to) return fromStr;
    const dTo = new Date(to);
    const toStr = dTo.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `${fromStr} - ${toStr}`;
  } catch {
    return '';
  }
};

export const TripsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { initialTab = 'active' } = route.params || {};

  const [activeTab, setActiveTab] = useState<TripTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editingTrip, setEditingTrip] = useState<UserTrip | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // TanStack Query Hooks
  const {
    data: activeTrips = [],
    isLoading: isLoadingActive,
    isRefetching: isRefetchingActive,
    refetch: refetchActive,
  } = useGetUpcomingTrips();

  const {
    data: pastTrips = [],
    isLoading: isLoadingPast,
    isRefetching: isRefetchingPast,
    refetch: refetchPast,
  } = useGetPastTrips();

  const deleteTripMutation = useDeleteTripPlan();

  const isLoading = isLoadingActive || isLoadingPast;
  const isRefreshing = isRefetchingActive || isRefetchingPast;

  const loadTrips = useCallback(() => {
    refetchActive();
    refetchPast();
  }, [refetchActive, refetchPast]);

  const onRefresh = useCallback(() => {
    loadTrips();
  }, [loadTrips]);

  // Filtered trips based on active tab and search query
  const displayedTrips = useMemo(() => {
    const list = activeTab === 'active' ? activeTrips : pastTrips;
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((t) => {
      const nameMatch = t.name?.toLowerCase().includes(q);
      const destMatch =
        t.destination?.name?.toLowerCase().includes(q) ||
        t.destination?.city?.toLowerCase().includes(q) ||
        t.destination?.country?.toLowerCase().includes(q);
      return nameMatch || destMatch;
    });
  }, [activeTab, activeTrips, pastTrips, searchQuery]);

  // Handle Delete Trip
  const handleDeleteTrip = (tripId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteTripMutation.mutate(tripId, {
              onSuccess: () => {
                Alert.alert('Deleted', 'Trip plan deleted.');
              },
            });
          },
        },
      ]
    );
  };

  // Trip Card
  const renderTripItem = ({ item }: { item: UserTrip }) => {
    const dateRange = formatDateRange(item.dateFrom, item.dateTo);
    const destName =
      item.destination?.city && item.destination?.country
        ? `${item.destination.city}, ${item.destination.country}`
        : item.destination?.name || item.name || 'Trip Destination';

    const isCurrentActive = activeTab === 'active';

    return (
      <View className="bg-surface rounded-2xl overflow-hidden border border-border shadow-subtle mb-4">
        {/* Cover Image Banner */}
        <View className="h-[140px] bg-surface-subtle relative">
          {item.destination?.coverUrl ? (
            <Image
              source={{ uri: item.destination.coverUrl }}
              className="w-full h-full"
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={`trip_card_${item.id}`}
              transition={150}
            />
          ) : (
            <View className="w-full h-full bg-primary-dark opacity-85" />
          )}
          <View className="absolute inset-0 bg-black/15" />

          {/* Status Badge */}
          <View
            className={cn(
              'absolute top-3 left-3 px-2.5 py-1 rounded-lg',
              isCurrentActive ? 'bg-primary' : 'bg-black/60'
            )}
          >
            <Text className="text-[11px] font-semibold text-white">
              {isCurrentActive ? 'Active' : 'Completed'}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View className="p-4 gap-2">
          <Text className="text-[17px] font-semibold text-text-primary" numberOfLines={1}>
            {item.name || destName}
          </Text>

          {/* Location row */}
          <View className="flex-row items-center gap-1.5">
            <MapPin size={13} color={theme.colors.primary} />
            <Text className="text-[13px] font-medium text-primary flex-1" numberOfLines={1}>
              {destName}
            </Text>
          </View>

          {/* Date range row */}
          {dateRange ? (
            <View className="flex-row items-center gap-1.5">
              <Calendar size={13} color={theme.colors.textSecondary} />
              <Text className="text-xs font-medium text-text-secondary">{dateRange}</Text>
            </View>
          ) : null}

          {/* Chips row */}
          <View className="flex-row items-center gap-2 mt-1">
            {item.travelStyle || item.travelStyleCode ? (
              <View className="flex-row items-center gap-1 bg-surface border border-primary px-2.5 py-1 rounded-lg">
                <Compass size={11} color={theme.colors.primary} />
                <Text className="text-[11px] font-semibold text-primary">
                  {item.travelStyle || item.travelStyleCode}
                </Text>
              </View>
            ) : null}

            {item.budgetStyle || item.budgetStyleCode ? (
              <View className="flex-row items-center gap-1 bg-surface-subtle px-2.5 py-1 rounded-lg">
                <Wallet size={11} color={theme.colors.textSecondary} />
                <Text className="text-[11px] font-semibold text-text-secondary">
                  {item.budgetStyle || item.budgetStyleCode}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Buttons for Active Trips */}
          {isCurrentActive && (
            <View className="flex-row items-center gap-2.5 mt-2.5 pt-3 border-t border-border">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center gap-1.5 bg-surface border border-primary py-2.5 rounded-xl"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditingTrip(item);
                }}
                activeOpacity={0.8}
              >
                <Edit3 size={14} color={theme.colors.primary} />
                <Text className="text-[13px] font-semibold text-primary">Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center gap-1.5 bg-error-light py-2.5 rounded-xl"
                onPress={() => handleDeleteTrip(item.id)}
                activeOpacity={0.8}
              >
                <Trash2 size={14} color={theme.colors.error} />
                <Text className="text-[13px] font-semibold text-error">Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render Empty State
  const renderEmptyState = () => {
    if (isLoading) return null;

    if (searchQuery.trim()) {
      return (
        <View className="py-14 items-center justify-center gap-2 px-6">
          <View className="w-16 h-16 rounded-full bg-surface-subtle items-center justify-center mb-2">
            <Search size={32} color={theme.colors.primary} />
          </View>
          <Text className="text-base font-semibold text-text-primary">No Trips Found</Text>
          <Text className="text-[13px] text-text-secondary text-center leading-[18px]">
            No trips match your search. Try another destination name.
          </Text>
        </View>
      );
    }

    if (activeTab === 'active') {
      return (
        <View className="py-14 items-center justify-center gap-2 px-6">
          <View className="w-16 h-16 rounded-full bg-surface-subtle items-center justify-center mb-2">
            <Compass size={32} color={theme.colors.primary} />
          </View>
          <Text className="text-base font-semibold text-text-primary">No Active Trips</Text>
          <Text className="text-[13px] text-text-secondary text-center leading-[18px]">
            Create a trip plan so we can match you with travelers going to the same destination.
          </Text>
          <TouchableOpacity
            className="flex-row items-center gap-1.5 bg-primary px-5 py-2.5 rounded-2xl mt-2.5 shadow-card"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreateModal(true);
            }}
            activeOpacity={0.85}
          >
            <Plus size={16} color={theme.colors.white} strokeWidth={2.5} />
            <Text className="text-white text-[13px] font-semibold">Create Trip Plan</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="py-14 items-center justify-center gap-2 px-6">
        <View className="w-16 h-16 rounded-full bg-surface-subtle items-center justify-center mb-2">
          <Clock size={32} color={theme.colors.primary} />
        </View>
        <Text className="text-base font-semibold text-text-primary">No Past Trips</Text>
        <Text className="text-[13px] text-text-secondary text-center leading-[18px]">
          Your completed trips will be saved here.
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View
        className="flex-row items-center justify-between px-4 pb-3 bg-surface border-b border-border"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TouchableOpacity
          className="w-9 h-9 items-center justify-center"
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-text-primary">My Trips</Text>
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-surface border border-primary items-center justify-center"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowCreateModal(true);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={22} color={theme.colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Upper Segment Tabs */}
      <View className="flex-row bg-surface border-b border-border">
        <TouchableOpacity
          className={cn(
            'flex-1 py-3.5 items-center justify-center flex-row gap-1.5 border-b-2 border-transparent',
            activeTab === 'active' && 'border-primary'
          )}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('active');
          }}
        >
          <Text
            className={cn(
              'text-sm font-semibold text-text-muted',
              activeTab === 'active' && 'text-primary'
            )}
          >
            Active ({activeTrips.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={cn(
            'flex-1 py-3.5 items-center justify-center flex-row gap-1.5 border-b-2 border-transparent',
            activeTab === 'past' && 'border-primary'
          )}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('past');
          }}
        >
          <Text
            className={cn(
              'text-sm font-semibold text-text-muted',
              activeTab === 'past' && 'text-primary'
            )}
          >
            Past ({pastTrips.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content Area */}
      <View className="flex-1">
        {/* Search Bar */}
        <View className="flex-row items-center bg-surface-subtle mx-4 mt-3.5 mb-2 px-3.5 h-11 rounded-2xl border border-border gap-2.5">
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            className="flex-1 text-sm text-text-primary font-medium p-0"
            placeholder="Search by destination or trip name..."
            placeholderTextColor={theme.colors.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Trips FlatList */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={displayedTrips}
            keyExtractor={(item) => item.id}
            renderItem={renderTripItem}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: insets.bottom + 24,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>

      {/* Edit Trip Modal */}
      <EditTripModal
        visible={Boolean(editingTrip)}
        trip={editingTrip}
        onClose={() => setEditingTrip(null)}
        onSuccess={loadTrips}
      />

      {/* Create Trip Modal */}
      <CreateTripModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTripCreated={loadTrips}
      />
    </View>
  );
};
