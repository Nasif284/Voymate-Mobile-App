import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { theme } from '../../../config/theme';
import { placesService, PlaceSuggestion, PlaceDetails } from '../../../services/places/places.service';
import { tripService } from '../services/trip.service';
import {
  X,
  MapPin,
  Calendar,
  Compass,
  Wallet,
  Check,
  Search,
  ArrowRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface CreateTripModalProps {
  visible: boolean;
  onClose: () => void;
  onTripCreated: () => void;
}

// Exact 3 travel styles from Next.js & Server
export const TRAVEL_STYLES = [
  { id: 'ADVENTURE', label: 'Adventure', icon: '🏔️' },
  { id: 'LEISURE', label: 'Leisure', icon: '🏖️' },
  { id: 'CULTURAL', label: 'Cultural', icon: '🏛️' },
];

// Exact 4 budget styles from Next.js & Server
export const BUDGET_STYLES = [
  { id: 'BUDGET', label: 'Budget', description: 'For saving money', icon: '🪙' },
  { id: 'MODERATE', label: 'Moderate', description: 'Balanced spending', icon: '⚖️' },
  { id: 'PREMIUM', label: 'Premium', description: 'Comfort-focused', icon: '🌟' },
  { id: 'LUXURY', label: 'Luxury', description: 'High-end experiences', icon: '✨' },
];

const formatClassyDate = (date: Date) => {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return {
    dayMonthStr: `${weekday}, ${day} ${month}`,
    yearStr: date.getFullYear().toString(),
  };
};

const getTripDurationDays = (start: Date, end: Date) => {
  const diffTime = end.getTime() - start.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 1;
};

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  visible,
  onClose,
  onTripCreated,
}) => {
  // Destination
  const [destinationSearch, setDestinationSearch] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  // Dates (Native Picker State)
  const today = new Date();
  const [dateFrom, setDateFrom] = useState<Date>(
    () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  );
  const [dateTo, setDateTo] = useState<Date>(
    () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  );
  const [activePicker, setActivePicker] = useState<'from' | 'to' | null>(null);

  // Style & Budget
  const [travelStyle, setTravelStyle] = useState('ADVENTURE');
  const [budgetStyle, setBudgetStyle] = useState('MODERATE');

  // Submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formatted date values
  const fromFormatted = formatClassyDate(dateFrom);
  const toFormatted = formatClassyDate(dateTo);
  const durationDays = getTripDurationDays(dateFrom, dateTo);

  // Debounced search for places
  useEffect(() => {
    if (!destinationSearch.trim() || selectedPlace) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPlaces(true);
      const results = await placesService.searchPlaces(destinationSearch);
      setSuggestions(results);
      setIsSearchingPlaces(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [destinationSearch, selectedPlace]);

  // Select place from suggestions
  const handleSelectPlace = async (suggestion: PlaceSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearchingPlaces(true);
    setSuggestions([]);

    const details = await placesService.getPlaceDetails(suggestion.placeId);
    setIsSearchingPlaces(false);

    if (details) {
      setSelectedPlace(details);
      setDestinationSearch(details.formattedAddress || details.displayName);
    } else {
      setSelectedPlace({
        placeId: suggestion.placeId,
        displayName: suggestion.displayName,
        formattedAddress: suggestion.displayName,
        city: suggestion.displayName.split(',')[0],
        state: null,
        country: null,
        countryCode: 'IN',
        latitude: null,
        longitude: null,
      });
      setDestinationSearch(suggestion.displayName);
    }
  };

  // Departure date change
  const handleDepartureChange = (newDate: Date) => {
    setDateFrom(newDate);
    if (newDate >= dateTo) {
      setDateTo(new Date(newDate.getTime() + 3 * 24 * 60 * 60 * 1000));
    }
  };

  // Return date change
  const handleReturnChange = (newDate: Date) => {
    if (newDate <= dateFrom) {
      setDateTo(new Date(dateFrom.getTime() + 1 * 24 * 60 * 60 * 1000));
    } else {
      setDateTo(newDate);
    }
  };

  // Quick duration helper
  const handleAddDuration = (days: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextDate = new Date(dateFrom.getTime() + days * 24 * 60 * 60 * 1000);
    setDateTo(nextDate);
  };

  // Submit
  const handleSubmit = async () => {
    if (!selectedPlace) {
      Alert.alert(
        'Destination Required',
        'Please search and select a destination from the suggestions.'
      );
      return;
    }

    if (dateFrom >= dateTo) {
      Alert.alert('Invalid Dates', 'Return date must be after departure date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cityName =
        selectedPlace.city || selectedPlace.displayName.split(',')[0];
      const autoTripName = `${cityName} Trip`;

      await tripService.createTrip({
        name: autoTripName,
        destinationName:
          selectedPlace.formattedAddress || selectedPlace.displayName,
        placeId: selectedPlace.placeId,
        city: selectedPlace.city,
        state: selectedPlace.state,
        countryCode: selectedPlace.countryCode || 'IN',
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        travelStyleCode: travelStyle.toLowerCase(),
        budgetStyle,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onTripCreated();
      onClose();
    } catch (error: any) {
      Alert.alert(
        'Could Not Create Trip',
        error?.response?.data?.message ||
          'Something went wrong. Please check your dates and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Plan a Trip</Text>
                <Text style={styles.subtitle}>
                  Set your itinerary & find matching companions
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Step 1: Destination */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MapPin size={13} color={theme.colors.primary} />
                  <Text style={styles.sectionLabel}>Destination</Text>
                </View>

                {selectedPlace ? (
                  <View style={styles.selectedDestinationCard}>
                    <View style={styles.selectedDestLeft}>
                      <View style={styles.checkCircle}>
                        <Check size={14} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.selectedDestName} numberOfLines={1}>
                          {selectedPlace.displayName}
                        </Text>
                        <Text style={styles.selectedDestFull} numberOfLines={1}>
                          {selectedPlace.formattedAddress}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedPlace(null);
                        setDestinationSearch('');
                      }}
                      style={styles.changeDestBtn}
                    >
                      <Text style={styles.changeDestText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View style={styles.inputBox}>
                      <Search size={16} color={theme.colors.textMuted} />
                      <TextInput
                        style={styles.input}
                        placeholder="Search city, region (e.g. Manali, Goa)..."
                        placeholderTextColor={theme.colors.textMuted}
                        value={destinationSearch}
                        onChangeText={(text) => {
                          setSelectedPlace(null);
                          setDestinationSearch(text);
                        }}
                        autoCapitalize="words"
                      />
                      {isSearchingPlaces && (
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.primary}
                        />
                      )}
                    </View>

                    {/* Suggestions list */}
                    {suggestions.length > 0 && (
                      <View style={styles.suggestionsContainer}>
                        {suggestions.map((s) => (
                          <TouchableOpacity
                            key={s.placeId}
                            style={styles.suggestionItem}
                            onPress={() => handleSelectPlace(s)}
                            activeOpacity={0.7}
                          >
                            <MapPin size={13} color={theme.colors.primary} />
                            <Text
                              style={styles.suggestionText}
                              numberOfLines={1}
                            >
                              {s.displayName}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Step 2: Trip Dates (Classy Symmetrical Itinerary Card) */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Calendar size={13} color={theme.colors.primary} />
                  <Text style={styles.sectionLabel}>Trip Dates</Text>
                </View>

                {/* Symmetrical Journey Card */}
                <View style={styles.journeyCard}>
                  {/* Departure Column (Left-Aligned) */}
                  <TouchableOpacity
                    style={[
                      styles.journeyCol,
                      styles.journeyColLeft,
                      activePicker === 'from' && styles.journeyColActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActivePicker((prev) => (prev === 'from' ? null : 'from'));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.journeyLabel}>DEPARTURE</Text>
                    <Text style={styles.journeyDateText}>
                      {fromFormatted.dayMonthStr}
                    </Text>
                    <Text style={styles.journeyYearText}>
                      {fromFormatted.yearStr}
                    </Text>
                  </TouchableOpacity>

                  {/* Center Flight / Duration Badge (Dead Center) */}
                  <View style={styles.journeyCenter}>
                    <View style={styles.journeyCenterBadge}>
                      <Text style={styles.journeyCenterBadgeText}>
                        {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                      </Text>
                    </View>
                    <ArrowRight size={12} color={theme.colors.primary} />
                  </View>

                  {/* Return Column (Right-Aligned) */}
                  <TouchableOpacity
                    style={[
                      styles.journeyCol,
                      styles.journeyColRight,
                      activePicker === 'to' && styles.journeyColActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActivePicker((prev) => (prev === 'to' ? null : 'to'));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.journeyLabel, styles.alignRight]}>
                      RETURN
                    </Text>
                    <Text style={[styles.journeyDateText, styles.alignRight]}>
                      {toFormatted.dayMonthStr}
                    </Text>
                    <Text style={[styles.journeyYearText, styles.alignRight]}>
                      {toFormatted.yearStr}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* iOS Native Inline DatePicker */}
                {Platform.OS === 'ios' && activePicker !== null && (
                  <View style={styles.iosInlinePickerContainer}>
                    <View style={styles.iosInlinePickerHeader}>
                      <Text style={styles.iosInlinePickerTitle}>
                        {activePicker === 'from'
                          ? 'Select Departure Date'
                          : 'Select Return Date'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setActivePicker(null)}
                        style={styles.iosInlineDoneBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.iosInlineDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={activePicker === 'from' ? dateFrom : dateTo}
                      mode="date"
                      display="inline"
                      minimumDate={activePicker === 'from' ? today : dateFrom}
                      themeVariant="light"
                      accentColor={theme.colors.primary}
                      onChange={(
                        _event: DateTimePickerEvent,
                        selectedDate?: Date
                      ) => {
                        if (selectedDate) {
                          if (activePicker === 'from') {
                            handleDepartureChange(selectedDate);
                          } else {
                            handleReturnChange(selectedDate);
                          }
                        }
                      }}
                    />
                  </View>
                )}

                {/* Quick Duration Shortcuts */}
                <View style={styles.durationPillsRow}>
                  {[3, 5, 7, 14].map((days) => {
                    const isSelected = durationDays === days;
                    return (
                      <TouchableOpacity
                        key={days}
                        style={[
                          styles.durationPill,
                          isSelected && styles.durationPillActive,
                        ]}
                        onPress={() => handleAddDuration(days)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.durationPillText,
                            isSelected && styles.durationPillTextActive,
                          ]}
                        >
                          {days === 7
                            ? '1 Week'
                            : days === 14
                            ? '2 Weeks'
                            : `+${days} Days`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Step 3: Travel Style (3 Verified Options) */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Compass size={13} color={theme.colors.primary} />
                  <Text style={styles.sectionLabel}>Travel Style</Text>
                </View>
                <View style={styles.travelRow}>
                  {TRAVEL_STYLES.map((style) => {
                    const isSelected = travelStyle === style.id;
                    return (
                      <TouchableOpacity
                        key={style.id}
                        style={[
                          styles.travelChip,
                          isSelected && styles.travelChipActive,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setTravelStyle(style.id);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.travelEmoji}>{style.icon}</Text>
                        <Text
                          style={[
                            styles.travelText,
                            isSelected && styles.travelTextActive,
                          ]}
                        >
                          {style.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Step 4: Budget Style (4 Verified Options) */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Wallet size={13} color={theme.colors.primary} />
                  <Text style={styles.sectionLabel}>Budget Level</Text>
                </View>
                <View style={styles.budgetGrid}>
                  {BUDGET_STYLES.map((b) => {
                    const isSelected = budgetStyle === b.id;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[
                          styles.budgetCard,
                          isSelected && styles.budgetCardActive,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setBudgetStyle(b.id);
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={styles.budgetCardTop}>
                          <Text style={styles.budgetEmoji}>{b.icon}</Text>
                          <Text
                            style={[
                              styles.budgetTitle,
                              isSelected && styles.budgetTitleActive,
                            ]}
                          >
                            {b.label}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.budgetDesc,
                            isSelected && styles.budgetDescActive,
                          ]}
                          numberOfLines={1}
                        >
                          {b.description}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Footer Submit */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  isSubmitting && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>
                      Create Plan & Find Mates
                    </Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Android Native DatePicker Dialog */}
      {Platform.OS === 'android' && activePicker !== null && (
        <DateTimePicker
          value={activePicker === 'from' ? dateFrom : dateTo}
          mode="date"
          display="default"
          minimumDate={activePicker === 'from' ? today : dateFrom}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            const target = activePicker;
            setActivePicker(null);
            if (event.type === 'set' && selectedDate) {
              if (target === 'from') {
                handleDepartureChange(selectedDate);
              } else {
                handleReturnChange(selectedDate);
              }
            }
          }}
        />
      )}
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
    maxHeight: '90%',
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
    fontSize: 19,
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
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.primary,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAF8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8E4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8E4',
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F1',
    gap: 10,
  },
  suggestionText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  selectedDestinationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF8F4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 110, 86, 0.25)',
    padding: 12,
  },
  selectedDestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
    gap: 10,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDestName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#181D1A',
  },
  selectedDestFull: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  changeDestBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 110, 86, 0.2)',
  },
  changeDestText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  // Symmetrical Journey Card
  journeyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAF8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8E4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  journeyCol: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  journeyColLeft: {
    alignItems: 'flex-start',
  },
  journeyColRight: {
    alignItems: 'flex-end',
  },
  journeyColActive: {
    backgroundColor: '#EEF8F4',
    borderColor: theme.colors.primary,
  },
  journeyLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  journeyDateText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#181D1A',
    letterSpacing: -0.3,
  },
  journeyYearText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  alignRight: {
    textAlign: 'right',
  },
  journeyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 3,
  },
  journeyCenterBadge: {
    backgroundColor: '#EEF8F4',
    borderWidth: 1,
    borderColor: 'rgba(0, 84, 64, 0.15)',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  journeyCenterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  // iOS Inline Calendar
  iosInlinePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8E4',
    padding: 12,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  iosInlinePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2EF',
    marginBottom: 4,
  },
  iosInlinePickerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  iosInlineDoneBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EEF8F4',
  },
  iosInlineDoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  durationPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  durationPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F6F4',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  durationPillActive: {
    backgroundColor: '#EEF8F4',
    borderColor: theme.colors.primary,
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  durationPillTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  travelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  travelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F6F4',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  travelChipActive: {
    backgroundColor: '#EEF8F4',
    borderColor: theme.colors.primary,
  },
  travelEmoji: {
    fontSize: 13,
  },
  travelText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  travelTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  budgetCard: {
    width: '48.5%',
    backgroundColor: '#F3F6F4',
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  budgetCardActive: {
    backgroundColor: '#EEF8F4',
    borderColor: theme.colors.primary,
  },
  budgetCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  budgetEmoji: {
    fontSize: 13,
  },
  budgetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  budgetTitleActive: {
    color: theme.colors.primary,
  },
  budgetDesc: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  budgetDescActive: {
    color: theme.colors.primary,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
