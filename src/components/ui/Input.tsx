import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { theme } from '../../config/theme';
import { useHaptics } from '../../hooks/useHaptics';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  className?: string;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  className,
  isPassword = false,
  secureTextEntry,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hidePassword, setHidePassword] = useState(isPassword);
  const haptics = useHaptics();

  const togglePasswordVisibility = () => {
    haptics.light();
    setHidePassword((prev) => !prev);
  };

  const wrapperClasses = [
    'flex-row items-center bg-surface border rounded-2xl px-4 h-[54px]',
    error
      ? 'border-error bg-error-light'
      : isFocused
      ? 'border-primary border-[1.5px]'
      : 'border-border',
  ].join(' ');

  return (
    <View className={`w-full mb-4 ${className || ''}`} style={containerStyle}>
      {label ? (
        <Text className="text-[13px] font-semibold text-textSecondary mb-2 tracking-wide">
          {label}
        </Text>
      ) : null}

      <View className={wrapperClasses}>
        {leftIcon ? <View className="mr-2.5 justify-center items-center">{leftIcon}</View> : null}

        <TextInput
          placeholderTextColor={theme.colors.textPlaceholder}
          className="flex-1 h-full text-textPrimary text-[15px] py-0"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword ? hidePassword : secureTextEntry}
          selectionColor={theme.colors.primary}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            className="ml-2.5 justify-center items-center"
            onPress={togglePasswordVisibility}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            {hidePassword ? (
              <EyeOff size={19} color={theme.colors.textMuted} />
            ) : (
              <Eye size={19} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View className="ml-2.5 justify-center items-center">{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text className="text-xs text-error mt-1.5 ml-1 font-medium">{error}</Text>
      ) : null}
    </View>
  );
};
