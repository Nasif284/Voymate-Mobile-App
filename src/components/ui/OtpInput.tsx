import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
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
    const numericText = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(numericText);
    haptics.selection();

    if (numericText.length === length && onComplete) {
      onComplete(numericText);
    }
  };

  const digits = value.split('');

  return (
    <Pressable className="w-full items-center my-4" onPress={handlePress}>
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
        className="absolute top-0 left-0 right-0 bottom-0 opacity-0"
        caretHidden
        editable={!disabled}
      />

      <View className="flex-row justify-between w-full max-w-[350px]">
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || '';
          const isCurrent = isFocused && index === digits.length;
          const isFilled = digit.length > 0;

          const cellClasses = [
            'w-[45px] h-[54px] rounded-[13px] bg-surface items-center justify-center border-[1.2px]',
            error
              ? 'border-error bg-error-light'
              : isCurrent
              ? 'border-primary border-2 shadow-sm'
              : isFilled
              ? 'border-primary'
              : 'border-border shadow-sm',
          ].join(' ');

          const textClasses = [
            'text-xl font-bold text-center',
            error ? 'text-error' : isFilled ? 'text-primary' : 'text-textPrimary',
          ].join(' ');

          return (
            <View key={index} className={cellClasses}>
              <Text className={textClasses}>{digit}</Text>
              {isCurrent && !isFilled ? (
                <View className="w-[1.5px] h-5 bg-primary rounded-[1px]" />
              ) : null}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
};
