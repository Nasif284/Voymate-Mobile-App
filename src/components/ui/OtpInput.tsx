import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { theme } from '../../config/theme';
import { useHaptics } from '../../hooks/useHaptics';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = true,
}) => {
  const inputRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);
  const haptics = useHaptics();

  useEffect(() => {
    if (autoFocus && !disabled) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  const handlePress = () => {
    if (disabled) return;
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    // Only allow numeric characters and max length
    const numericText = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(numericText);
    haptics.selection();

    if (numericText.length === length && onComplete) {
      onComplete(numericText);
    }
  };

  const digits = value.split('');

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'ios' ? 'one-time-code' : 'sms-otp'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
        caretHidden
        editable={!disabled}
      />

      <View style={styles.cellsRow}>
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || '';
          const isCurrent = isFocused && index === digits.length;
          const isFilled = digit.length > 0;

          return (
            <View
              key={index}
              style={[
                styles.cell,
                isFilled && styles.cellFilled,
                isCurrent && styles.cellCurrent,
                error && styles.cellError,
              ]}
            >
              <Text
                style={[
                  styles.cellText,
                  isFilled && styles.cellTextFilled,
                  error && styles.cellTextError,
                ]}
              >
                {digit}
              </Text>
              {isCurrent && !isFilled && <View style={styles.cursor} />}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 18,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  cellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 350,
  },
  cell: {
    width: 45,
    height: 54,
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 84, 64, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  cellFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
  },
  cellCurrent: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  cellError: {
    borderColor: theme.colors.error,
    backgroundColor: '#FFFDFD',
  },
  cellText: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  cellTextFilled: {
    color: theme.colors.primary,
  },
  cellTextError: {
    color: theme.colors.error,
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 22,
    backgroundColor: theme.colors.primary,
    borderRadius: 1,
  },
});
