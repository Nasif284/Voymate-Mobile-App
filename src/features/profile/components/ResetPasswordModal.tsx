import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { X, Lock, Eye, EyeOff } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useProfileResetPassword } from '../hooks/profile.hooks';
import { theme } from '../../../config/theme';
import { cn } from '../../../utils/cn';

interface ResetPasswordModalProps {
  visible: boolean;
  userEmail: string;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  visible,
  userEmail,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const resetPasswordMutation = useProfileResetPassword();
  const isSubmitting = resetPasswordMutation.isPending;

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isLengthValid = newPassword.length >= 8;
  const hasComplexity = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword);

  const handleSubmit = () => {
    if (!isLengthValid) {
      Alert.alert('Password too short', 'Password must be at least 8 characters long.');
      return;
    }
    if (!hasComplexity) {
      Alert.alert(
        'Weak Password',
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
      );
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Passwords mismatch', 'New password and confirmation do not match.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    resetPasswordMutation.mutate(
      { password: newPassword, email: userEmail },
      {
        onSuccess: () => {
          Alert.alert('Password Updated', 'Your password has been changed successfully.');
          setNewPassword('');
          setConfirmPassword('');
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="w-full items-center"
          >
            <View className="w-full max-w-[400px] bg-surface rounded-[24px] p-6 relative shadow-lg">
              {/* Close Button */}
              <TouchableOpacity
                className="absolute top-[18px] right-[18px] w-8 h-8 rounded-full items-center justify-center bg-surface-subtle z-10"
                onPress={handleClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>

              {/* Header Icon & Title */}
              <View className="items-center mb-5 mt-1">
                <View className="w-[50px] h-[50px] rounded-full bg-primary-mist items-center justify-center mb-3">
                  <Lock size={22} color={theme.colors.primary} />
                </View>
                <Text className="text-xl font-bold text-text-primary mb-1.5">Reset Password</Text>
                <Text className="text-xs text-text-secondary text-center leading-[17px] px-2">
                  Create a password with at least 8 characters, an uppercase letter, and a number.
                </Text>
              </View>

              {/* Form Fields */}
              <View className="gap-3.5">
                {/* New Password */}
                <View className="gap-1.5">
                  <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">NEW PASSWORD</Text>
                  <View className="flex-row items-center bg-surface-subtle border border-border rounded-[14px] px-3.5 h-12">
                    <TextInput
                      className="flex-1 text-sm text-text-primary font-semibold"
                      secureTextEntry={!showNewPassword}
                      placeholder="••••••••"
                      placeholderTextColor={theme.colors.textPlaceholder}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      className="p-1.5"
                      onPress={() => setShowNewPassword((prev) => !prev)}
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} color={theme.colors.textSecondary} />
                      ) : (
                        <Eye size={18} color={theme.colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View className="gap-1.5">
                  <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">CONFIRM PASSWORD</Text>
                  <View className="flex-row items-center bg-surface-subtle border border-border rounded-[14px] px-3.5 h-12">
                    <TextInput
                      className="flex-1 text-sm text-text-primary font-semibold"
                      secureTextEntry={!showConfirmPassword}
                      placeholder="••••••••"
                      placeholderTextColor={theme.colors.textPlaceholder}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      className="p-1.5"
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} color={theme.colors.textSecondary} />
                      ) : (
                        <Eye size={18} color={theme.colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {confirmPassword.length > 0 && !passwordsMatch && (
                  <Text className="text-xs text-error font-semibold -mt-1">Passwords do not match.</Text>
                )}

                {/* Action Buttons */}
                <View className="flex-row items-center gap-2.5 mt-2">
                  <TouchableOpacity
                    className="flex-1 h-11 rounded-[14px] border border-border bg-surface-subtle items-center justify-center"
                    onPress={handleClose}
                    disabled={isSubmitting}
                  >
                    <Text className="text-[13px] font-semibold text-text-secondary">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={cn(
                      'flex-[1.5] h-11 rounded-[14px] bg-primary items-center justify-center shadow-sm',
                      (!newPassword || !confirmPassword || !passwordsMatch || isSubmitting) && 'opacity-45'
                    )}
                    onPress={handleSubmit}
                    disabled={!newPassword || !confirmPassword || !passwordsMatch || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={theme.colors.white} />
                    ) : (
                      <Text className="text-[13px] font-semibold text-white">Update Password</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
