import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { theme } from '../../../config/theme';
import { ActiveTrip } from '../types';
import { X, Luggage, Calendar, Check, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface SelectTripModalProps {
  visible: boolean;
  trips: ActiveTrip[];
  selectedTripId?: string;
  onClose: () => void;
  onSelectTrip: (trip: ActiveTrip) => void;
  onPlanNewTrip?: () => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const SelectTripModal: React.FC<SelectTripModalProps> = ({
  visible,
  trips,
  selectedTripId,
  onClose,
  onSelectTrip,
  onPlanNewTrip,
}) => {
  const handleSelect = (trip: ActiveTrip) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectTrip(trip);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>Your Travel Plans</Text>
                  <Text style={styles.subtitle}>Select a trip to view matching companions</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Trips List */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {trips.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Luggage size={32} color={theme.colors.primary} />
                    <Text style={styles.emptyTitle}>No Trips Found</Text>
                    <Text style={styles.emptyText}>
                      You haven't scheduled any upcoming trips yet.
                    </Text>
                  </View>
                ) : (
                  trips.map((trip) => {
                    const isSelected = trip.id === selectedTripId;
                    const destinationName =
                      trip.destination?.name ||
                      trip.destination?.city ||
                      trip.name;
                    const dateStr =
                      trip.dateFrom && trip.dateTo
                        ? `${formatDate(trip.dateFrom)} - ${formatDate(trip.dateTo)}`
                        : '';

                    return (
                      <TouchableOpacity
                        key={trip.id}
                        style={[
                          styles.tripCard,
                          isSelected && styles.tripCardSelected,
                        ]}
                        onPress={() => handleSelect(trip)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.tripCardLeft}>
                          <View
                            style={[
                              styles.iconCircle,
                              isSelected && styles.iconCircleSelected,
                            ]}
                          >
                            <Luggage
                              size={16}
                              color={isSelected ? '#FFFFFF' : theme.colors.primary}
                            />
                          </View>
                          <View style={styles.tripInfo}>
                            <Text style={styles.tripName} numberOfLines={1}>
                              {trip.name || destinationName}
                            </Text>
                            <Text style={styles.tripDest} numberOfLines={1}>
                              📍 {destinationName}
                            </Text>
                            {dateStr ? (
                              <View style={styles.dateRow}>
                                <Calendar size={11} color={theme.colors.textMuted} />
                                <Text style={styles.dateText}>{dateStr}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        {isSelected && (
                          <View style={styles.selectedBadge}>
                            <Check size={13} color="#FFFFFF" />
                            <Text style={styles.selectedText}>Active</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Bottom Action: Plan New Trip */}
              {onPlanNewTrip && (
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={styles.planBtn}
                    onPress={() => {
                      onClose();
                      onPlanNewTrip();
                    }}
                    activeOpacity={0.85}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.planBtnText}>Plan a New Trip</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '75%',
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2EF',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F1F4F1',
    borderRadius: 18,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 10,
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E8ECE9',
    padding: 14,
  },
  tripCardSelected: {
    backgroundColor: '#EEF8F4',
    borderColor: theme.colors.primary,
  },
  tripCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF8F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSelected: {
    backgroundColor: theme.colors.primary,
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  tripDest: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 4,
  },
  selectedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    borderRadius: 16,
    gap: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  planBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
