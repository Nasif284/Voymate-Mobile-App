import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
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
import { cn } from '../../utils/cn';

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
        className="flex-1 bg-black/45 justify-end"
      >
        <SafeAreaView className="bg-surface rounded-t-3xl max-h-[85%] min-h-[60%] pb-5 shadow-card">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-border-subtle">
            <Text className="text-lg font-semibold text-textPrimary">{title}</Text>
            <TouchableOpacity
              onPress={handleDismiss}
              className="w-9 h-9 rounded-full bg-surface-subtle items-center justify-center"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-surface-subtle mx-5 mt-3.5 mb-2 px-3.5 h-[46px] rounded-xl border border-border-subtle">
            <Search size={18} color={theme.colors.textMuted} className="mr-2.5" />
            <TextInput
              className="flex-1 text-[15px] text-textPrimary py-0"
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Custom option button if no exact match and allowCustom is true */}
          {allowCustom && searchQuery.trim().length > 1 && (
            <TouchableOpacity
              className="flex-row items-center py-3 px-5 bg-primary-light mx-5 rounded-xl mb-2"
              onPress={handleAddCustom}
              activeOpacity={0.7}
            >
              <Plus size={16} color={theme.colors.primary} className="mr-2" />
              <Text className="text-sm text-primary">
                Use <Text className="font-bold">"{searchQuery.trim()}"</Text>
              </Text>
            </TouchableOpacity>
          )}

          {/* Options List */}
          <FlatList
            data={filteredItems}
            keyExtractor={(item, index) => `${item.value}_${index}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
            renderItem={({ item }) => {
              const isSelected = selectedValue === item.value || selectedValue === item.label;
              return (
                <TouchableOpacity
                  className={cn(
                    'flex-row items-center justify-between py-3.5 px-2 border-b border-border-subtle',
                    isSelected && 'bg-primary-mist rounded-xl px-2'
                  )}
                  onPress={() => handleSelectItem(item)}
                  activeOpacity={0.7}
                >
                  <View className="flex-1">
                    <Text
                      className={cn(
                        'text-[15px] text-textPrimary font-medium',
                        isSelected && 'text-primary font-semibold'
                      )}
                    >
                      {item.label}
                    </Text>
                    {item.sublabel ? (
                      <Text className="text-xs text-textMuted mt-0.5">{item.sublabel}</Text>
                    ) : null}
                  </View>

                  {isSelected && (
                    <Check size={18} color={theme.colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View className="py-9 items-center">
                <Text className="text-sm text-textMuted">No results found</Text>
              </View>
            }
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
