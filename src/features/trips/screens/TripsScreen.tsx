import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { tripService } from '../services/trip.service';
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
  const [activeTrips, setActiveTrips] = useState<UserTrip[]>([]);
  const [pastTrips, setPastTrips] = useState<UserTrip[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [editingTrip, setEditingTrip] = useState<UserTrip | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch trips
  const loadTrips = useCallback(async () => {
    try {
      const [upcoming, past] = await Promise.all([
        tripService.getUpcomingTrips().catch(() => []),
        tripService.getPastTrips().catch(() => []),
      ]);

      setActiveTrips(upcoming);
      setPastTrips(past);
    } catch (err) {
      console.warn('Error fetching trips:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadTrips();
  };

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
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await tripService.deleteTrip(tripId);
              setActiveTrips((prev) => prev.filter((t) => t.id !== tripId));
              Alert.alert('Deleted', 'Trip plan deleted.');
            } catch {
              Alert.alert('Error', 'Could not delete trip plan.');
            }
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
            <MapPin size={13} color="#005440" />
            <Text style={styles.metaText} numberOfLines={1}>
              {destName}
            </Text>
          </View>

          {/* Date range row */}
          {dateRange ? (
            <View style={styles.metaRow}>
              <Calendar size={13} color="#5C6B64" />
              <Text style={styles.dateText}>{dateRange}</Text>
            </View>
          ) : null}

          {/* Chips row */}
          <View style={styles.badgesRow}>
            {item.travelStyle || item.travelStyleCode ? (
              <View style={styles.tagBadge}>
                <Compass size={11} color="#005440" />
                <Text style={styles.tagText}>
                  {item.travelStyle || item.travelStyleCode}
                </Text>
              </View>
            ) : null}

            {item.budgetStyle || item.budgetStyleCode ? (
              <View style={[styles.tagBadge, styles.tagBadgeMuted]}>
                <Wallet size={11} color="#5C6B64" />
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
                <Edit3 size={14} color="#005440" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteTrip(item.id)}
                activeOpacity={0.8}
              >
                <Trash2 size={14} color="#DC2626" />
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
            <Search size={32} color="#005440" />
          </View>
          <Text style={styles.emptyTitle}>No matching trips</Text>
          <Text style={styles.emptySubtitle}>Try searching for a different destination.</Text>
        </View>
      );
    }

    if (activeTab === 'active') {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Compass size={32} color="#005440" />
          </View>
          <Text style={styles.emptyTitle}>No active trip plans</Text>
          <Text style={styles.emptySubtitle}>
            Plan your next journey to find and connect with travel companions.
          </Text>
          <TouchableOpacity
            style={styles.emptyCta}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCreateModal(true);
            }}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.emptyCtaText}>Plan a Trip</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Clock size={32} color="#005440" />
        </View>
        <Text style={styles.emptyTitle}>No past trips</Text>
        <Text style={styles.emptySubtitle}>Trips you have completed will appear here.</Text>
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
          <ChevronLeft size={24} color="#151D19" />
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
          <Plus size={22} color="#005440" strokeWidth={2.5} />
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
          <Search size={16} color="#88978E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by destination or trip name..."
            placeholderTextColor="#88978E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Trips FlatList */}
        {isLoading ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color="#005440" />
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
                tintColor="#005440"
                colors={['#005440']}
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
    backgroundColor: '#F7FAF6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE9',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#151D19',
  },
  headerRightBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFE9',
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
    borderBottomColor: '#005440',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#88978E',
  },
  tabTextActive: {
    color: '#005440',
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
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#151D19',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6EFE9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: {
    height: 140,
    backgroundColor: '#E2EBE5',
    position: 'relative',
  },
  tripCoverImage: {
    width: '100%',
    height: '100%',
  },
  tripCoverFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#005440',
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
    backgroundColor: '#005440',
  },
  statusPillPast: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusPillTextActive: {
    color: '#FFFFFF',
  },
  statusPillTextPast: {
    color: '#FFFFFF',
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  tripTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#151D19',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#005440',
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5C6B64',
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
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagBadgeMuted: {
    backgroundColor: '#F3F6F4',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#005440',
  },
  tagTextMuted: {
    color: '#5C6B64',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F4F1',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E8F5EE',
    paddingVertical: 9,
    borderRadius: 12,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#005440',
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 9,
    borderRadius: 12,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
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
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#151D19',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#5C6B64',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#005440',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 10,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
