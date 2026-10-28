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
} from 'react-native';
import { theme } from '../../../config/theme';
import { ExploreFilters, TRAVEL_STYLES, BUDGET_STYLES } from '../types';
import { X, RotateCcw, Compass, Wallet } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

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
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>Filter Companions</Text>
                <Text style={styles.subtitle}>Refine results by travel style & budget</Text>
              </View>

              <View style={styles.headerRight}>
                {hasAnyFilter && (
                  <TouchableOpacity
                    style={styles.resetBtn}
                    onPress={handleReset}
                    activeOpacity={0.7}
                  >
                    <RotateCcw size={12} color="#BA1A1A" />
                    <Text style={styles.resetText}>Reset</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Travel Style */}
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Compass size={13} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle}>Travel Style</Text>
                </View>
                <View style={styles.chipsGrid}>
                  {TRAVEL_STYLES.map((style) => {
                    const isSelected = localFilters.travelStyle === style.id;
                    return (
                      <TouchableOpacity
                        key={style.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => handleSelectTravelStyle(style.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.chipEmoji}>{style.icon}</Text>
                        <Text
                          style={[styles.chipText, isSelected && styles.chipTextActive]}
                        >
                          {style.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Budget Style */}
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Wallet size={13} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle}>Budget Style</Text>
                </View>
                <View style={styles.chipsGrid}>
                  {BUDGET_STYLES.map((b) => {
                    const isSelected = localFilters.budgetStyle === b.id;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => handleSelectBudgetStyle(b.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.chipEmoji}>{b.icon}</Text>
                        <Text
                          style={[styles.chipText, isSelected && styles.chipTextActive]}
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
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handleApply}
                activeOpacity={0.85}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
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
  headerLeft: {
    flex: 1,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 4,
  },
  resetText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BA1A1A',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F1F4F1',
    borderRadius: 18,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.primary,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6F4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#EEF8F4',
    borderColor: theme.colors.primary,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  applyBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
