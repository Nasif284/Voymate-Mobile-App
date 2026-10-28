import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { theme } from '../../../config/theme';
import { ExploreFilters } from '../types';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

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
    <View style={styles.container}>
      {/* Page Title */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Explore Destinations</Text>
        <Text style={styles.subtitle}>
          Find travel companions heading to places on your bucket list
        </Text>
      </View>

      {/* Search Input & Filter Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
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
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={handleOpenFilter}
          activeOpacity={0.8}
        >
          <SlidersHorizontal
            size={16}
            color={activeFilterCount > 0 ? '#FFFFFF' : theme.colors.textPrimary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {filters.travelStyle && (
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => onRemoveFilter('travelStyle')}
              activeOpacity={0.7}
            >
              <Text style={styles.filterChipText}>
                🎒 {filters.travelStyle}
              </Text>
              <X size={12} color={theme.colors.primary} />
            </TouchableOpacity>
          )}

          {filters.budgetStyle && (
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => onRemoveFilter('budgetStyle')}
              activeOpacity={0.7}
            >
              <Text style={styles.filterChipText}>
                🪙 {filters.budgetStyle}
              </Text>
              <X size={12} color={theme.colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.clearAllChip}
            onPress={onClearAllFilters}
            activeOpacity={0.7}
          >
            <Text style={styles.clearAllText}>Clear Filters</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  titleRow: {
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textPrimary,
    padding: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8E4',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#BA1A1A',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8F4',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 110, 86, 0.2)',
    gap: 5,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'capitalize',
  },
  clearAllChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BA1A1A',
  },
});
