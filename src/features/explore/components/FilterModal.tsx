import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { theme } from '../../../config/theme';
import { ExploreFilters, TRAVEL_STYLES, BUDGET_STYLES } from '../types';
import { X, RotateCcw, Compass, Wallet } from 'lucide-react-native';
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

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, visible]);

  const hasAnyFilter = Boolean(
    localFilters.travelStyle || localFilters.budgetStyle
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

  const handleApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const cleared = {
      ...localFilters,
      travelStyle: undefined,
      budgetStyle: undefined,
    };
    setLocalFilters(cleared);
    onReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface rounded-t-[28px] max-h-[75%] pt-5 pb-8 shadow-floating">
            {/* Header */}
            <View className="flex-row justify-between items-center px-5 pb-4 border-b border-border">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-text-primary tracking-tight">
                  Filter Companions
                </Text>
                <Text className="text-xs text-text-muted mt-0.5">
                  Refine results by travel style & budget
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
                    <Text className="text-[11px] font-semibold text-error">Reset</Text>
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
              contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 20 }}
            >
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
                          isSelected && 'bg-surface border-primary'
                        )}
                        onPress={() => handleSelectTravelStyle(style.id)}
                        activeOpacity={0.7}
                      >
                        <Text className="text-sm">{style.icon}</Text>
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
                          isSelected && 'bg-surface border-primary'
                        )}
                        onPress={() => handleSelectBudgetStyle(b.id)}
                        activeOpacity={0.7}
                      >
                        <Text className="text-sm">{b.icon}</Text>
                        <Text
                          className={cn(
                            'text-xs font-semibold text-text-secondary',
                            isSelected && 'text-primary'
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
                <Text className="text-sm font-semibold text-white">Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
