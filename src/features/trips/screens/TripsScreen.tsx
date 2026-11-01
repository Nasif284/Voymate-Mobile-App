import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
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

  // Original Card Design
  const renderTripItem = ({ item }: { item: UserTrip }) => {
    const dateRange = formatDateRange(item.dateFrom, item.dateTo);
    const destName =
      item.destination?.city && item.destination?.country
        ? `${item.destination.city}, ${item.destination.country}`
        : item.destination?.name || item.name || 'Trip Destination';

    const isCurrentActive = activeTab === 'active';

    return (
      <View style={styles.tripCard}>
        {/* Cover Image Banner */}
        <View style={styles.imageWrap}>
          {item.destination?.coverUrl ? (
            <Image
              source={{ uri: item.destination.coverUrl }}
              style={styles.tripCoverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.tripCoverFallback} />
          )}
          <View style={styles.imageOverlay} />

          {/* Status Badge */}
          <View
            style={[
              styles.statusPill,
              isCurrentActive ? styles.statusPillActive : styles.statusPillPast,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                isCurrentActive ? styles.statusPillTextActive : styles.statusPillTextPast,
              ]}
            >
              {isCurrentActive ? 'Active' : 'Completed'}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <Text style={styles.tripTitle} numberOfLines={1}>
            {item.name || destName}
          </Text>

          {/* Location row */}
          <View style={styles.metaRow}>
            <MapPin size={13} color={theme.colors.primary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {destName}
            </Text>
          </View>

          {/* Date range row */}
          {dateRange ? (
            <View style={styles.metaRow}>
              <Calendar size={13} color={theme.colors.textSecondary} />
              <Text style={styles.dateText}>{dateRange}</Text>
            </View>
          ) : null}

          {/* Chips row */}
          <View style={styles.badgesRow}>
            {item.travelStyle || item.travelStyleCode ? (
              <View style={styles.tagBadge}>
                <Compass size={11} color={theme.colors.primary} />
                <Text style={styles.tagText}>
                  {item.travelStyle || item.travelStyleCode}
                </Text>
              </View>
            ) : null}

            {item.budgetStyle || item.budgetStyleCode ? (
              <View style={[styles.tagBadge, styles.tagBadgeMuted]}>
                <Wallet size={11} color={theme.colors.textSecondary} />
                <Text style={[styles.tagText, styles.tagTextMuted]}>
                  {item.budgetStyle || item.budgetStyleCode}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Buttons for Active Trips */}
          {isCurrentActive && (
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditingTrip(item);
                }}
                activeOpacity={0.8}
              >
                <Edit3 size={14} color={theme.colors.primary} />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteTrip(item.id)}
                activeOpacity={0.8}
              >
                <Trash2 size={14} color={theme.colors.error} />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render Empty State matching connection listing template
  const renderEmptyState = () => {
    if (isLoading) return null;

    if (searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Search size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Trips Found</Text>
          <Text style={styles.emptySubtitle}>
            No trips match your search. Try another destination name.
          </Text>
        </View>
      );
    }

    if (activeTab === 'active') {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Compass size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Active Trips</Text>
          <Text style={styles.emptySubtitle}>
            Create a trip plan so we can match you with travelers going to the same destination.
          </Text>
          <TouchableOpacity
            style={styles.emptyCta}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreateModal(true);
            }}
            activeOpacity={0.85}
          >
            <Plus size={16} color={theme.colors.white} strokeWidth={2.5} />
            <Text style={styles.emptyCtaText}>Create Trip Plan</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Clock size={32} color={theme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>No Past Trips</Text>
        <Text style={styles.emptySubtitle}>Your completed trips will be saved here.</Text>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header Bar matching Connections Screen template */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trips</Text>
        <TouchableOpacity
          style={styles.headerRightBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowCreateModal(true);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={22} color={theme.colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Upper Segment Tabs (Instagram Style) matching Connections Screen */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('active');
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'active' && styles.tabTextActive,
            ]}
          >
            Active ({activeTrips.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'past' && styles.tabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('past');
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' && styles.tabTextActive,
            ]}
          >
            Past ({pastTrips.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content Area */}
      <View style={styles.tabContent}>
        {/* Search Bar matching Connections Screen */}
        <View style={styles.searchBox}>
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by destination or trip name..."
            placeholderTextColor={theme.colors.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Trips FlatList */}
        {isLoading ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={displayedTrips}
            keyExtractor={(item) => item.id}
            renderItem={renderTripItem}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 24 },
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  headerRightBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  tabContent: {
    flex: 1,
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  tripCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: {
    height: 140,
    backgroundColor: theme.colors.surfaceSubtle,
    position: 'relative',
  },
  tripCoverImage: {
    width: '100%',
    height: '100%',
  },
  tripCoverFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primaryDark,
    opacity: 0.85,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  statusPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillActive: {
    backgroundColor: theme.colors.primary,
  },
  statusPillPast: {
    backgroundColor: theme.colors.overlay,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusPillTextActive: {
    color: theme.colors.white,
  },
  statusPillTextPast: {
    color: theme.colors.white,
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  tripTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.primaryMist,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagBadgeMuted: {
    backgroundColor: theme.colors.surfaceSubtle,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  tagTextMuted: {
    color: theme.colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryMist,
    paddingVertical: 9,
    borderRadius: 12,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.errorLight,
    paddingVertical: 9,
    borderRadius: 12,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.error,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 10,
  },
  emptyCtaText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
