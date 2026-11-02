import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { theme } from '../../../config/theme';
import { ExploreFilters } from '../types';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '../../../utils/cn';

interface ExploreHeaderProps {
  filters: ExploreFilters;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSubmitSearch: () => void;
  onOpenFilter: () => void;
  onRemoveFilter: (key: keyof ExploreFilters) => void;
  onClearAllFilters: () => void;
}

export const ExploreHeader: React.FC<ExploreHeaderProps> = ({
  filters,
  searchQuery,
  onSearchChange,
  onSubmitSearch,
  onOpenFilter,
  onRemoveFilter,
  onClearAllFilters,
}) => {
  const activeFilterCount = [
    filters.travelStyle,
    filters.budgetStyle,
  ].filter(Boolean).length;

  const handleOpenFilter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenFilter();
  };

  return (
    <View className="px-5 pt-2 pb-3.5">
      {/* Page Title */}
      <View className="mb-3.5">
        <Text className="text-[22px] font-semibold text-text-primary tracking-tight">
          Explore Destinations
        </Text>
        <Text className="text-xs text-text-muted mt-0.5">
          Find solo travelers by city, travel dates, and budget
        </Text>
      </View>

      {/* Search Input & Filter Button */}
      <View className="flex-row items-center gap-2.5">
        <View className="flex-1 flex-row items-center bg-surface rounded-2xl border border-border px-3.5 h-12 gap-2 shadow-subtle">
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            className="flex-1 text-[13.5px] text-text-primary p-0"
            placeholder="Search destination (e.g. Manali, Goa)..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            onSubmitEditing={onSubmitSearch}
            autoCapitalize="words"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={15} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          className={cn(
            'w-12 h-12 rounded-2xl bg-surface border border-border items-center justify-center relative shadow-subtle',
            activeFilterCount > 0 && 'bg-primary border-primary shadow-card'
          )}
          onPress={handleOpenFilter}
          activeOpacity={0.8}
        >
          <SlidersHorizontal
            size={16}
            color={activeFilterCount > 0 ? theme.colors.white : theme.colors.textPrimary}
          />
          {activeFilterCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-primary-dark w-4.5 h-4.5 rounded-full items-center justify-center border-2 border-white">
              <Text className="text-[9px] font-semibold text-white">{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, marginTop: 10 }}
        >
          {filters.travelStyle && (
            <TouchableOpacity
              className="flex-row items-center bg-primary-mist py-1.5 px-3 rounded-xl border border-primary/20 gap-1.5"
              onPress={() => onRemoveFilter('travelStyle')}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-medium text-primary">
                🎒 {filters.travelStyle}
              </Text>
              <X size={12} color={theme.colors.primary} />
            </TouchableOpacity>
          )}

          {filters.budgetStyle && (
            <TouchableOpacity
              className="flex-row items-center bg-primary-mist py-1.5 px-3 rounded-xl border border-primary/20 gap-1.5"
              onPress={() => onRemoveFilter('budgetStyle')}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-medium text-primary">
                🪙 {filters.budgetStyle}
              </Text>
              <X size={12} color={theme.colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="flex-row items-center bg-surface-subtle py-1.5 px-3 rounded-xl border border-border"
            onPress={onClearAllFilters}
            activeOpacity={0.7}
          >
            <Text className="text-xs font-medium text-text-muted">Clear Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};
