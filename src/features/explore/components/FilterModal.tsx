import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { theme } from '../../../config/theme';
import { ExploreFilters, TRAVEL_STYLES, BUDGET_STYLES } from '../types';
import { X, RotateCcw, Compass, Wallet, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '../../../utils/cn';

interface FilterModalProps {
  visible: boolean;
  filters: ExploreFilters;
  onClose: () => void;
  onApply: (filters: ExploreFilters) => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState<ExploreFilters>(filters);
  const [activePicker, setActivePicker] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    setLocalFilters(filters);
    setActivePicker(null);
  }, [filters, visible]);

  const hasAnyFilter = Boolean(
    localFilters.travelStyle ||
      localFilters.budgetStyle ||
      localFilters.dateFrom ||
      localFilters.dateTo,
  );

  const handleSelectTravelStyle = (styleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters((prev) => ({
      ...prev,
      travelStyle: prev.travelStyle === styleId ? undefined : styleId,
    }));
  };

  const handleSelectBudgetStyle = (budgetId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters((prev) => ({
      ...prev,
      budgetStyle: prev.budgetStyle === budgetId ? undefined : budgetId,
    }));
  };

  const handleDateFromChange = (date: Date) => {
    const iso = date.toISOString().split('T')[0];
    setLocalFilters((prev) => {
      let newDateTo = prev.dateTo;
      if (newDateTo && new Date(newDateTo) < date) {
        const advanced = new Date(date);
        advanced.setDate(advanced.getDate() + 3);
        newDateTo = advanced.toISOString().split('T')[0];
      }
      return { ...prev, dateFrom: iso, dateTo: newDateTo };
    });
  };

  const handleDateToChange = (date: Date) => {
    const iso = date.toISOString().split('T')[0];
    setLocalFilters((prev) => ({
      ...prev,
      dateTo: iso,
    }));
  };

  const handleClearDates = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters((prev) => ({
      ...prev,
      dateFrom: undefined,
      dateTo: undefined,
    }));
    setActivePicker(null);
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return {
        dayMonth: d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        year: d.getFullYear(),
      };
    } catch {
      return null;
    }
  };

  const handleApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const cleared: ExploreFilters = {
      ...localFilters,
      travelStyle: undefined,
      budgetStyle: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    };
    setLocalFilters(cleared);
    setActivePicker(null);
    onReset();
    onClose();
  };

  const today = new Date();
  const minPickerDate =
    activePicker === 'from'
      ? today
      : localFilters.dateFrom
        ? new Date(localFilters.dateFrom)
        : today;
  const pickerValue =
    activePicker === 'from'
      ? localFilters.dateFrom
        ? new Date(localFilters.dateFrom)
        : today
      : localFilters.dateTo
        ? new Date(localFilters.dateTo)
        : localFilters.dateFrom
          ? new Date(localFilters.dateFrom)
          : today;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface rounded-t-[28px] max-h-[85%] pt-5 pb-8 shadow-floating">
            {/* Header */}
            <View className="flex-row justify-between items-center px-5 pb-4 border-b border-border">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-text-primary tracking-tight">
                  Filter Companions
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">
                  Refine results by travel dates, style & budget
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                {hasAnyFilter && (
                  <TouchableOpacity
                    className="flex-row items-center bg-error-light py-1.5 px-2.5 rounded-xl gap-1"
                    onPress={handleReset}
                    activeOpacity={0.7}
                  >
                    <RotateCcw size={12} color={theme.colors.error} />
                    <Text className="text-[11px] font-semibold text-error">
                      Reset
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  className="p-1.5 bg-surface-subtle rounded-full"
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 22,
                paddingTop: 16,
                paddingBottom: 20,
              }}
            >
              {/* Travel Dates Range */}
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-2.5">
                  <View className="flex-row items-center gap-1.5">
                    <Calendar size={13} color={theme.colors.primary} />
                    <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Travel Dates (Optional)
                    </Text>
                  </View>
                  {(localFilters.dateFrom || localFilters.dateTo) && (
                    <TouchableOpacity
                      onPress={handleClearDates}
                      className="flex-row items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-subtle"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <RotateCcw size={10} color={theme.colors.textMuted} />
                      <Text className="text-[10px] font-semibold text-text-muted">
                        Clear
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View className="flex-row gap-2.5">
                  {/* Departure Date Card */}
                  <TouchableOpacity
                    className={cn(
                      'flex-1 p-3 rounded-2xl bg-surface-subtle border border-transparent',
                      activePicker === 'from' && 'border-primary bg-surface',
                      localFilters.dateFrom && 'border-border',
                    )}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActivePicker(activePicker === 'from' ? null : 'from');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                      Departure
                    </Text>
                    <Text className="text-sm font-semibold text-text-primary mt-1">
                      {formatDateDisplay(localFilters.dateFrom)?.dayMonth ||
                        'Any Date'}
                    </Text>
                    <Text className="text-[10px] text-text-muted mt-0.5">
                      {formatDateDisplay(localFilters.dateFrom)?.year ||
                        'Flexible departure'}
                    </Text>
                  </TouchableOpacity>

                  {/* Return Date Card */}
                  <TouchableOpacity
                    className={cn(
                      'flex-1 p-3 rounded-2xl bg-surface-subtle border border-transparent',
                      activePicker === 'to' && 'border-primary bg-surface',
                      localFilters.dateTo && 'border-border',
                      !localFilters.dateFrom && 'opacity-60',
                    )}
                    onPress={() => {
                      if (!localFilters.dateFrom) {
                        setActivePicker('from');
                        return;
                      }
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActivePicker(activePicker === 'to' ? null : 'to');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                      Return
                    </Text>
                    <Text className="text-sm font-semibold text-text-primary mt-1">
                      {formatDateDisplay(localFilters.dateTo)?.dayMonth ||
                        'Any Date'}
                    </Text>
                    <Text className="text-[10px] text-text-muted mt-0.5">
                      {formatDateDisplay(localFilters.dateTo)?.year ||
                        'Flexible return'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* iOS Inline DateTimePicker */}
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
                        className="py-1 px-2.5 rounded-lg bg-surface border border-primary"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text className="text-xs font-semibold text-primary">
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={pickerValue}
                      mode="date"
                      display="inline"
                      minimumDate={minPickerDate}
                      themeVariant="light"
                      accentColor={theme.colors.primary}
                      onChange={(
                        _event: DateTimePickerEvent,
                        selectedDate?: Date,
                      ) => {
                        if (selectedDate) {
                          if (activePicker === 'from') {
                            handleDateFromChange(selectedDate);
                          } else {
                            handleDateToChange(selectedDate);
                          }
                        }
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Travel Style */}
              <View className="mb-5">
                <View className="flex-row items-center gap-1.5 mb-2.5">
                  <Compass size={13} color={theme.colors.primary} />
                  <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Travel Style
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {TRAVEL_STYLES.map((style) => {
                    const isSelected = localFilters.travelStyle === style.id;
                    return (
                      <TouchableOpacity
                        key={style.id}
                        className={cn(
                          'flex-row items-center bg-surface-subtle py-2 px-3 rounded-2xl border border-transparent gap-1.5',
                          isSelected && 'bg-surface border-primary',
                        )}
                        onPress={() => handleSelectTravelStyle(style.id)}
                        activeOpacity={0.7}
                      >
                        <Text className="text-sm">{style.icon}</Text>
                        <Text
                          className={cn(
                            'text-xs font-semibold text-text-secondary',
                            isSelected && 'text-primary',
                          )}
                        >
                          {style.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Budget Style */}
              <View className="mb-5">
                <View className="flex-row items-center gap-1.5 mb-2.5">
                  <Wallet size={13} color={theme.colors.primary} />
                  <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Budget Style
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {BUDGET_STYLES.map((b) => {
                    const isSelected = localFilters.budgetStyle === b.id;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        className={cn(
                          'flex-row items-center bg-surface-subtle py-2 px-3 rounded-2xl border border-transparent gap-1.5',
                          isSelected && 'bg-surface border-primary',
                        )}
                        onPress={() => handleSelectBudgetStyle(b.id)}
                        activeOpacity={0.7}
                      >
                        <Text className="text-sm">{b.icon}</Text>
                        <Text
                          className={cn(
                            'text-xs font-semibold text-text-secondary',
                            isSelected && 'text-primary',
                          )}
                        >
                          {b.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Apply Button */}
            <View className="px-5 pt-3">
              <TouchableOpacity
                className="bg-primary py-3.5 items-center justify-center rounded-2xl shadow-card"
                onPress={handleApply}
                activeOpacity={0.85}
              >
                <Text className="text-sm font-semibold text-white">
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* Android Native DatePicker Dialog */}
      {Platform.OS === 'android' && activePicker !== null && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          minimumDate={minPickerDate}
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            const target = activePicker;
            setActivePicker(null);
            if (event.type === 'set' && selectedDate) {
              if (target === 'from') {
                handleDateFromChange(selectedDate);
              } else {
                handleDateToChange(selectedDate);
              }
            }
          }}
        />
      )}
    </Modal>
  );
};
