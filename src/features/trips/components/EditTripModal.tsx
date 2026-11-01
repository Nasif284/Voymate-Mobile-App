import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { UserTrip, EditTripPayload } from '../types';
import { useUpdateTripPlan } from '../hooks/trip.hooks';
import { TRAVEL_STYLES, BUDGET_STYLES } from './CreateTripModal';
import {
  X,
  MapPin,
  Calendar,
  Compass,
  Wallet,
  Check,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../../config/theme';

interface EditTripModalProps {
  visible: boolean;
  trip: UserTrip | null;
  onClose: () => void;
  onSuccess: () => void;
}

const formatDisplayDate = (date: Date) => {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
};

const getDurationDays = (start: Date, end: Date) => {
  const diffTime = end.getTime() - start.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 1;
};

export const EditTripModal: React.FC<EditTripModalProps> = ({
  visible,
  trip,
  onClose,
  onSuccess,
}) => {
  const [dateFrom, setDateFrom] = useState<Date>(new Date());
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [travelStyle, setTravelStyle] = useState('ADVENTURE');
  const [budgetStyle, setBudgetStyle] = useState('MODERATE');
  const [activePicker, setActivePicker] = useState<'from' | 'to' | null>(null);
  const updateTripMutation = useUpdateTripPlan();
  const isSubmitting = updateTripMutation.isPending;

  useEffect(() => {
    if (trip) {
      const from = trip.dateFrom ? new Date(trip.dateFrom) : new Date();
      const to = trip.dateTo ? new Date(trip.dateTo) : new Date(Date.now() + 7 * 86400000);
      setDateFrom(from);
      setDateTo(to);
      setTravelStyle(trip.travelStyleCode || 'ADVENTURE');
      setBudgetStyle(trip.budgetStyleCode || 'MODERATE');
      setActivePicker(null);
    }
  }, [trip, visible]);

  if (!trip) return null;

  const durationDays = getDurationDays(dateFrom, dateTo);

  const handleDateFromChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }
    if (selectedDate) {
      setDateFrom(selectedDate);
      if (selectedDate >= dateTo) {
        setDateTo(new Date(selectedDate.getTime() + 2 * 86400000));
      }
    }
  };

  const handleDateToChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }
    if (selectedDate) {
      if (selectedDate <= dateFrom) {
        setDateTo(new Date(dateFrom.getTime() + 1 * 86400000));
      } else {
        setDateTo(selectedDate);
      }
    }
  };

  const handleSave = () => {
    if (dateTo <= dateFrom) {
      Alert.alert('Invalid Dates', 'Return date must be after departure date.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const payload: EditTripPayload = {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      budgetStyleCode: budgetStyle,
      travelStyleCode: travelStyle,
    };

    updateTripMutation.mutate(
      { tripId: trip.id, payload },
      {
        onSuccess: () => {
          Alert.alert('Updated', 'Your trip plan has been updated.');
          onSuccess();
          onClose();
        },
      }
    );
  };

  const destinationName =
    trip.destination?.city && trip.destination?.country
      ? `${trip.destination.city}, ${trip.destination.country}`
      : trip.destination?.name || trip.name || 'Trip';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.sheetContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Edit Trip</Text>
                <View style={styles.destRow}>
                  <MapPin size={12} color={theme.colors.primary} />
                  <Text style={styles.destText} numberOfLines={1}>
                    {destinationName}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Date Selection Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Calendar size={16} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle}>Travel Dates</Text>
                  <View style={styles.durationPill}>
                    <Clock size={11} color={theme.colors.primary} />
                    <Text style={styles.durationText}>{durationDays} days</Text>
                  </View>
                </View>

                {/* Departure Card */}
                <TouchableOpacity
                  style={[
                    styles.dateCard,
                    activePicker === 'from' && styles.dateCardActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActivePicker(activePicker === 'from' ? null : 'from');
                  }}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.dateLabel}>DEPARTURE</Text>
                    <Text style={styles.dateValue}>{formatDisplayDate(dateFrom)}</Text>
                  </View>
                  <Calendar size={18} color={theme.colors.primary} />
                </TouchableOpacity>

                {activePicker === 'from' && (
                  <View style={styles.pickerBox}>
                    <DateTimePicker
                      value={dateFrom}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateFromChange}
                      minimumDate={new Date()}
                      textColor={theme.colors.textPrimary}
                    />
                  </View>
                )}

                {/* Return Card */}
                <TouchableOpacity
                  style={[
                    styles.dateCard,
                    activePicker === 'to' && styles.dateCardActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActivePicker(activePicker === 'to' ? null : 'to');
                  }}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={styles.dateLabel}>RETURN</Text>
                    <Text style={styles.dateValue}>{formatDisplayDate(dateTo)}</Text>
                  </View>
                  <Calendar size={18} color={theme.colors.primary} />
                </TouchableOpacity>

                {activePicker === 'to' && (
                  <View style={styles.pickerBox}>
                    <DateTimePicker
                      value={dateTo}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateToChange}
                      minimumDate={new Date(dateFrom.getTime() + 86400000)}
                      textColor={theme.colors.textPrimary}
                    />
                  </View>
                )}
              </View>

              {/* Travel Style Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Compass size={16} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle}>Travel Style</Text>
                </View>
                <View style={styles.chipsWrap}>
                  {TRAVEL_STYLES.map((style) => {
                    const isSelected = travelStyle === style.id;
                    return (
                      <TouchableOpacity
                        key={style.id}
                        style={[
                          styles.chip,
                          isSelected && styles.chipSelected,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setTravelStyle(style.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.chipIcon}>{style.icon}</Text>
                        <Text
                          style={[
                            styles.chipText,
                            isSelected && styles.chipTextSelected,
                          ]}
                        >
                          {style.label}
                        </Text>
                        {isSelected && <Check size={14} color={theme.colors.white} strokeWidth={3} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Budget Style Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Wallet size={16} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle}>Budget Style</Text>
                </View>
                <View style={styles.budgetGrid}>
                  {BUDGET_STYLES.map((b) => {
                    const isSelected = budgetStyle === b.id;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[
                          styles.budgetCard,
                          isSelected && styles.budgetCardSelected,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setBudgetStyle(b.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.budgetTopRow}>
                          <Text style={styles.budgetIcon}>{b.icon}</Text>
                          {isSelected && (
                            <View style={styles.selectedDot}>
                              <Check size={10} color={theme.colors.white} strokeWidth={3} />
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.budgetTitle,
                            isSelected && styles.budgetTitleSelected,
                          ]}
                        >
                          {b.label}
                        </Text>
                        <Text
                          style={[
                            styles.budgetDesc,
                            isSelected && styles.budgetDescSelected,
                          ]}
                        >
                          {b.description}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  destText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primaryMist,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryMist,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  pickerBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: theme.colors.white,
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  budgetCard: {
    width: '48.5%',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
  },
  budgetCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  budgetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgetIcon: {
    fontSize: 18,
  },
  selectedDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  budgetTitleSelected: {
    color: theme.colors.white,
  },
  budgetDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  budgetDescSelected: {
    color: theme.colors.primaryLight,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
