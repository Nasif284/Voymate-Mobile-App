import React, { useState } from 'react';
import {
  View,
  Text,
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
import { PlaceSuggestion, PlaceDetails } from '../../../services/places/places.service';
import {
  usePlacesAutocomplete,
  usePlaceDetailsMutation,
} from '../../../services/places/places.hooks';
import { useCreateTripPlan } from '../hooks/trip.hooks';
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
import { cn } from '../../../utils/cn';

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
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);

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

  // TanStack Query Hooks
  const {
    data: fetchedSuggestions = [],
    isFetching: isFetchingAutocomplete,
  } = usePlacesAutocomplete(destinationSearch, !selectedPlace);

  const placeDetailsMutation = usePlaceDetailsMutation();
  const createTripMutation = useCreateTripPlan();

  const suggestions = selectedPlace ? [] : fetchedSuggestions;
  const isSearchingPlaces = isFetchingAutocomplete || placeDetailsMutation.isPending;
  const isSubmitting = createTripMutation.isPending;

  // Formatted date values
  const fromFormatted = formatClassyDate(dateFrom);
  const toFormatted = formatClassyDate(dateTo);
  const durationDays = getTripDurationDays(dateFrom, dateTo);

  // Select place from suggestions
  const handleSelectPlace = (suggestion: PlaceSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    placeDetailsMutation.mutate(suggestion.placeId, {
      onSuccess: (details) => {
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
      },
      onError: () => {
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
      },
    });
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
  const handleSubmit = () => {
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

    const cityName =
      selectedPlace.city || selectedPlace.displayName.split(',')[0];
    const autoTripName = `${cityName} Trip`;

    createTripMutation.mutate(
      {
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
      },
      {
        onSuccess: () => {
          onTripCreated();
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/45 justify-end">
          <View className="bg-surface rounded-t-[28px] max-h-[90%] pt-5 pb-8 shadow-floating">
            {/* Header */}
            <View className="flex-row justify-between items-center px-5.5 pb-4 border-b border-border">
              <View>
                <Text className="text-lg font-semibold text-text-primary tracking-tight">
                  Plan a Trip
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">
                  Set your itinerary & find matching companions
                </Text>
              </View>
              <TouchableOpacity
                className="p-1.5 bg-surface-subtle rounded-full"
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Step 1: Destination */}
              <View className="mb-4.5">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <MapPin size={13} color={theme.colors.primary} />
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Destination
                  </Text>
                </View>

                {selectedPlace ? (
                  <View className="flex-row items-center justify-between bg-primary-mist rounded-2xl border border-primary/20 p-3">
                    <View className="flex-row items-center flex-1 pr-2.5 gap-2.5">
                      <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                        <Check size={14} color={theme.colors.white} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
                          {selectedPlace.displayName}
                        </Text>
                        <Text className="text-[11px] text-text-muted mt-0.5" numberOfLines={1}>
                          {selectedPlace.formattedAddress}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedPlace(null);
                        setDestinationSearch('');
                      }}
                      className="py-1 px-2 rounded-lg bg-surface border border-primary/20"
                    >
                      <Text className="text-[11px] font-semibold text-primary">Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View className="flex-row items-center bg-surface-subtle rounded-2xl border border-border px-3 py-2.5 gap-2">
                      <Search size={16} color={theme.colors.textMuted} />
                      <TextInput
                        className="flex-1 text-sm text-text-primary p-0"
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
                      <View className="bg-surface rounded-2xl border border-border mt-1.5 overflow-hidden shadow-card">
                        {suggestions.map((s) => (
                          <TouchableOpacity
                            key={s.placeId}
                            className="flex-row items-center py-2.5 px-3.5 border-b border-border gap-2.5"
                            onPress={() => handleSelectPlace(s)}
                            activeOpacity={0.7}
                          >
                            <MapPin size={13} color={theme.colors.primary} />
                            <Text
                              className="text-[13px] text-text-primary font-medium flex-1"
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
              <View className="mb-4.5">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Calendar size={13} color={theme.colors.primary} />
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Trip Dates
                  </Text>
                </View>

                {/* Symmetrical Journey Card */}
                <View className="flex-row items-center justify-between bg-surface-subtle rounded-2xl border border-border py-2.5 px-3 shadow-subtle">
                  {/* Departure Column */}
                  <TouchableOpacity
                    className={cn(
                      'flex-1 py-1.5 px-2 rounded-xl border border-transparent items-start',
                      activePicker === 'from' && 'bg-primary-mist border-primary'
                    )}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActivePicker((prev) => (prev === 'from' ? null : 'from'));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text className="text-[9.5px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">
                      DEPARTURE
                    </Text>
                    <Text className="text-[15px] font-semibold text-text-primary tracking-tight">
                      {fromFormatted.dayMonthStr}
                    </Text>
                    <Text className="text-[11px] text-text-muted font-medium mt-0.5">
                      {fromFormatted.yearStr}
                    </Text>
                  </TouchableOpacity>

                  {/* Center Duration Badge */}
                  <View className="items-center justify-center px-2 gap-1">
                    <View className="bg-primary-mist border border-primary/20 rounded-xl py-0.5 px-2">
                      <Text className="text-[10px] font-semibold text-primary">
                        {durationDays} {durationDays === 1 ? 'Day' : 'Days'}
                      </Text>
                    </View>
                    <ArrowRight size={12} color={theme.colors.primary} />
                  </View>

                  {/* Return Column */}
                  <TouchableOpacity
                    className={cn(
                      'flex-1 py-1.5 px-2 rounded-xl border border-transparent items-end',
                      activePicker === 'to' && 'bg-primary-mist border-primary'
                    )}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActivePicker((prev) => (prev === 'to' ? null : 'to'));
                    }}
                    activeOpacity={0.7}
                  >
                    <Text className="text-[9.5px] font-semibold uppercase tracking-wider text-text-muted mb-0.5 text-right">
                      RETURN
                    </Text>
                    <Text className="text-[15px] font-semibold text-text-primary tracking-tight text-right">
                      {toFormatted.dayMonthStr}
                    </Text>
                    <Text className="text-[11px] text-text-muted font-medium mt-0.5 text-right">
                      {toFormatted.yearStr}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* iOS Native Inline DatePicker */}
                {Platform.OS === 'ios' && activePicker !== null && (
                  <View className="bg-surface rounded-2xl border border-border p-3 mt-2.5 shadow-card">
                    <View className="flex-row justify-between items-center pb-2 border-b border-border mb-1">
                      <Text className="text-xs font-semibold text-text-primary">
                        {activePicker === 'from'
                          ? 'Select Departure Date'
                          : 'Select Return Date'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setActivePicker(null)}
                        className="py-1 px-2.5 rounded-lg bg-primary-mist"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text className="text-xs font-semibold text-primary">Done</Text>
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
                <View className="flex-row items-center justify-between gap-2 mt-3">
                  {[3, 5, 7, 14].map((days) => {
                    const isSelected = durationDays === days;
                    return (
                      <TouchableOpacity
                        key={days}
                        className={cn(
                          'flex-1 items-center justify-center bg-surface-subtle py-2 rounded-xl border border-transparent',
                          isSelected && 'bg-primary-mist border-primary'
                        )}
                        onPress={() => handleAddDuration(days)}
                        activeOpacity={0.75}
                      >
                        <Text
                          className={cn(
                            'text-[11px] font-semibold text-text-secondary',
                            isSelected && 'text-primary font-bold'
                          )}
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
              <View className="mb-4.5">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Compass size={13} color={theme.colors.primary} />
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Travel Style
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  {TRAVEL_STYLES.map((style) => {
                    const isSelected = travelStyle === style.id;
                    return (
                      <TouchableOpacity
                        key={style.id}
                        className={cn(
                          'flex-1 flex-row items-center justify-center bg-surface-subtle py-2.5 px-1.5 rounded-2xl border border-transparent gap-1.5',
                          isSelected && 'bg-primary-mist border-primary'
                        )}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setTravelStyle(style.id);
                        }}
                        activeOpacity={0.75}
                      >
                        <Text className="text-[13px]">{style.icon}</Text>
                        <Text
                          className={cn(
                            'text-xs font-semibold text-text-secondary',
                            isSelected && 'text-primary'
                          )}
                        >
                          {style.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Step 4: Budget Style (4 Verified Options) */}
              <View className="mb-4.5">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Wallet size={13} color={theme.colors.primary} />
                  <Text className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Budget Level
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {BUDGET_STYLES.map((b) => {
                    const isSelected = budgetStyle === b.id;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        className={cn(
                          'w-[48.5%] bg-surface-subtle py-2 px-2.5 rounded-2xl border border-transparent',
                          isSelected && 'bg-primary-mist border-primary'
                        )}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setBudgetStyle(b.id);
                        }}
                        activeOpacity={0.75}
                      >
                        <View className="flex-row items-center gap-1.5 mb-0.5">
                          <Text className="text-[13px]">{b.icon}</Text>
                          <Text
                            className={cn(
                              'text-xs font-semibold text-text-primary',
                              isSelected && 'text-primary'
                            )}
                          >
                            {b.label}
                          </Text>
                        </View>
                        <Text
                          className={cn(
                            'text-[10px] text-text-muted mt-0.5',
                            isSelected && 'text-primary'
                          )}
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
            <View className="px-5.5 pt-2.5">
              <TouchableOpacity
                className={cn(
                  'flex-row items-center justify-center bg-primary py-3.5 rounded-2xl gap-2 shadow-card',
                  isSubmitting && 'opacity-60'
                )}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <>
                    <Text className="text-sm font-semibold text-white">
                      Create Plan & Find Mates
                    </Text>
                    <ArrowRight size={16} color={theme.colors.white} />
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
