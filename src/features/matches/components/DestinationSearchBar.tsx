import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../../config/theme';
import { Search, X } from 'lucide-react-native';

interface DestinationSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  placeholder?: string;
}

export const DestinationSearchBar: React.FC<DestinationSearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  onClear,
  placeholder = 'Search by destination (e.g. Manali, Goa, Paris)...',
}) => {
  return (
    <View className="px-5 mb-4">
      <View className="flex-row items-center bg-surface-subtle border border-border rounded-2xl px-3.5 py-2.5 gap-2.5 shadow-subtle">
        <Search size={16} color={theme.colors.textMuted} />
        <TextInput
          className="flex-1 text-[13px] text-text-primary p-0"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          autoCapitalize="words"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
