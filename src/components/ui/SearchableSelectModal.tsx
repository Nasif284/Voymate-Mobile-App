import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { theme } from '../../config/theme';
import { Search, X, Check, Plus } from 'lucide-react-native';
import { useHaptics } from '../../hooks/useHaptics';

export interface SelectOption {
  label: string;
  value: string;
  sublabel?: string;
}

interface SearchableSelectModalProps {
  visible: boolean;
  title: string;
  placeholder?: string;
  items: SelectOption[];
  selectedValue?: string;
  allowCustom?: boolean;
  onSelect: (item: SelectOption) => void;
  onClose: () => void;
}

export const SearchableSelectModal: React.FC<SearchableSelectModalProps> = ({
  visible,
  title,
  placeholder = 'Search...',
  items,
  selectedValue,
  allowCustom = false,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const haptics = useHaptics();

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items.slice(0, 100);
    const q = searchQuery.toLowerCase().trim();
    return items
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          (item.sublabel && item.sublabel.toLowerCase().includes(q))
      )
      .slice(0, 100);
  }, [items, searchQuery]);

  const handleSelectItem = (item: SelectOption) => {
    haptics.selection();
    onSelect(item);
    setSearchQuery('');
    onClose();
  };

  const handleAddCustom = () => {
    if (!searchQuery.trim()) return;
    haptics.selection();
    onSelect({
      label: searchQuery.trim(),
      value: searchQuery.trim(),
    });
    setSearchQuery('');
    onClose();
  };

  const handleDismiss = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <SafeAreaView style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={18} color={theme.colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Custom option button if no exact match and allowCustom is true */}
          {allowCustom && searchQuery.trim().length > 1 && (
            <TouchableOpacity
              style={styles.customAddButton}
              onPress={handleAddCustom}
              activeOpacity={0.7}
            >
              <Plus size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.customAddText}>
                Use <Text style={{ fontWeight: '700' }}>"{searchQuery.trim()}"</Text>
              </Text>
            </TouchableOpacity>
          )}

          {/* Options List */}
          <FlatList
            data={filteredItems}
            keyExtractor={(item, index) => `${item.value}_${index}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = selectedValue === item.value || selectedValue === item.label;
              return (
                <TouchableOpacity
                  style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                  onPress={() => handleSelectItem(item)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.itemLabel,
                        isSelected && styles.itemLabelSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.sublabel ? (
                      <Text style={styles.itemSublabel}>{item.sublabel}</Text>
                    ) : null}
                  </View>

                  {isSelected && (
                    <Check size={18} color={theme.colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            }
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '60%',
    paddingBottom: 20,
    ...theme.shadows.card,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 84, 64, 0.08)',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 84, 64, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 84, 64, 0.05)',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  customAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primaryLight,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  customAddText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 84, 64, 0.05)',
  },
  itemRowSelected: {
    backgroundColor: 'rgba(0, 84, 64, 0.03)',
  },
  itemLabel: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  itemLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  itemSublabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
});
