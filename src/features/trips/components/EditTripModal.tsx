import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { cn } from '../../../utils/cn';

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
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface rounded-t-[28px] max-h-[90%] pb-6">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-4 pb-3.5 border-b border-border">
              <View>
                <Text className="text-lg font-semibold text-text-primary tracking-tight">Edit Trip</Text>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <MapPin size={12} color={theme.colors.primary} />
                  <Text className="text-xs font-semibold text-primary" numberOfLines={1}>
                    {destinationName}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-surface-subtle items-center justify-center"
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-grow-0"
              contentContainerStyle={{ padding: 20, gap: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Date Selection Section */}
              <View className="gap-2.5">
                <View className="flex-row items-center gap-2">
                  <Calendar size={16} color={theme.colors.primary} />
                  <Text className="text-sm font-semibold text-text-primary flex-1">Travel Dates</Text>
                  <View className="flex-row items-center gap-1 bg-surface border border-primary px-2 py-0.5 rounded-lg">
                    <Clock size={11} color={theme.colors.primary} />
                    <Text className="text-[11px] font-semibold text-primary">{durationDays} days</Text>
                  </View>
                </View>

                {/* Departure Card */}
                <TouchableOpacity
                  className={cn(
                    'flex-row items-center justify-between bg-surface-subtle border border-border rounded-2xl px-4 py-3',
                    activePicker === 'from' && 'border-primary bg-surface'
                  )}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActivePicker(activePicker === 'from' ? null : 'from');
                  }}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                      DEPARTURE
                    </Text>
                    <Text className="text-sm font-semibold text-text-primary mt-0.5">
                      {formatDisplayDate(dateFrom)}
                    </Text>
                  </View>
                  <Calendar size={18} color={theme.colors.primary} />
                </TouchableOpacity>

                {activePicker === 'from' && (
                  <View className="bg-surface rounded-2xl border border-border mt-1 overflow-hidden">
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
                  className={cn(
                    'flex-row items-center justify-between bg-surface-subtle border border-border rounded-2xl px-4 py-3',
                    activePicker === 'to' && 'border-primary bg-surface'
                  )}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActivePicker(activePicker === 'to' ? null : 'to');
                  }}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                      RETURN
                    </Text>
                    <Text className="text-sm font-semibold text-text-primary mt-0.5">
                      {formatDisplayDate(dateTo)}
                    </Text>
                  </View>
                  <Calendar size={18} color={theme.colors.primary} />
                </TouchableOpacity>

                {activePicker === 'to' && (
                  <View className="bg-surface rounded-2xl border border-border mt-1 overflow-hidden">
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
              <View className="gap-2.5">
                <View className="flex-row items-center gap-2">
                  <Compass size={16} color={theme.colors.primary} />
                  <Text className="text-sm font-semibold text-text-primary">Travel Style</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {TRAVEL_STYLES.map((style) => {
                    const isSelected = travelStyle === style.id;
                    return (
                      <TouchableOpacity
                        key={style.id}
                        className={cn(
                          'flex-row items-center gap-1.5 bg-surface-subtle border border-border rounded-2xl px-3.5 py-2.5',
                          isSelected && 'bg-primary border-primary'
                        )}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setTravelStyle(style.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text className="text-sm">{style.icon}</Text>
                        <Text
                          className={cn(
                            'text-[13px] font-semibold text-text-secondary',
                            isSelected && 'text-white'
                          )}
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
              <View className="gap-2.5">
                <View className="flex-row items-center gap-2">
                  <Wallet size={16} color={theme.colors.primary} />
                  <Text className="text-sm font-semibold text-text-primary">Budget Style</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {BUDGET_STYLES.map((b) => {
                    const isSelected = budgetStyle === b.id;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        className={cn(
                          'w-[48.5%] bg-surface-subtle border border-border rounded-2xl p-3',
                          isSelected && 'bg-primary border-primary'
                        )}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setBudgetStyle(b.id);
                        }}
                        activeOpacity={0.8}
                      >
                        <View className="flex-row items-center justify-between mb-1.5">
                          <Text className="text-lg">{b.icon}</Text>
                          {isSelected && (
                            <View className="w-4 h-4 rounded-full bg-white items-center justify-center">
                              <Check size={10} color={theme.colors.primary} strokeWidth={3} />
                            </View>
                          )}
                        </View>
                        <Text
                          className={cn(
                            'text-[13px] font-semibold text-text-primary',
                            isSelected && 'text-white'
                          )}
                        >
                          {b.label}
                        </Text>
                        <Text
                          className={cn(
                            'text-[11px] text-text-secondary mt-0.5',
                            isSelected && 'text-primary'
                          )}
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
            <View className="flex-row gap-3 px-5 pt-3.5 border-t border-border">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-2xl bg-surface-subtle items-center justify-center border border-border"
                onPress={onClose}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                <Text className="text-sm font-semibold text-text-secondary">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-[2] py-3.5 rounded-2xl bg-primary items-center justify-center shadow-card"
                onPress={handleSave}
                activeOpacity={0.8}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text className="text-sm font-semibold text-white">Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
