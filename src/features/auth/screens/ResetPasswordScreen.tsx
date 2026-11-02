import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import {
  ArrowLeft,
  Lock,
  CheckCircle,
  AlertCircle,
  Check,
} from 'lucide-react-native';
import { useHaptics } from '../../../hooks/useHaptics';
import { useResetPassword } from '../hooks/auth.hooks';
import { cn } from '../../../utils/cn';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const haptics = useHaptics();
  const resetPasswordMutation = useResetPassword({
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 2500);
    },
    onError: (msg) => setErrorMessage(msg),
  });
  const loading = resetPasswordMutation.isPending;

  // Password rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSubmit = () => {
    Keyboard.dismiss();

    if (!hasMinLength) {
      haptics.error();
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      haptics.error();
      setErrorMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      haptics.error();
      setErrorMessage('Passwords do not match.');
      return;
    }

    setErrorMessage(null);
    resetPasswordMutation.mutate({
      email: email.trim().toLowerCase(),
      password: newPassword,
    });
  };

  const handleGoToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 36 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="w-full max-w-[420px] self-center">
              {/* Back Navigation Button */}
              {!isSuccess && (
                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-surface items-center justify-center mb-5 border border-border shadow-subtle"
                  style={theme.shadows.subtle}
                  onPress={() => {
                    haptics.selection();
                    navigation.goBack();
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2} />
                </TouchableOpacity>
              )}

              {isSuccess ? (
                /* Success View matching Next app */
                <View className="items-center py-10 px-4">
                  <View className="w-[72px] h-[72px] rounded-full bg-primary-mist items-center justify-center mb-5">
                    <CheckCircle size={40} color={theme.colors.primary} />
                  </View>
                  <Text className="text-[22px] font-bold text-textPrimary text-center tracking-tight">Password updated successfully!</Text>
                  <Text className="text-sm text-textSecondary text-center mt-2 leading-5 mb-7">
                    Your new password is set. Redirecting you to sign in...
                  </Text>

                  <Button
                    title="Proceed to Sign In"
                    variant="primary"
                    size="lg"
                    onPress={handleGoToLogin}
                    className="w-full"
                  />
                </View>
              ) : (
                <>
                  {/* Header */}
                  <View className="mb-6">
                    <View className="w-11 h-11 rounded-full bg-primary-mist items-center justify-center mb-3.5">
                      <Lock size={22} color={theme.colors.primary} />
                    </View>
                    <Text className="text-[26px] font-medium text-textPrimary tracking-tight">Reset your password</Text>
                    <Text className="text-sm text-textSecondary mt-1.5 leading-5">
                      Create a strong new password for your account.
                    </Text>
                  </View>

                  {/* Error Banner */}
                  {errorMessage ? (
                    <View className="flex-row items-center bg-error-light py-2.5 px-3.5 rounded-xl mb-4 border border-error">
                      <AlertCircle size={16} color={theme.colors.error} className="mr-2" />
                      <Text className="flex-1 text-error text-[13px] font-medium leading-[17px]">{errorMessage}</Text>
                    </View>
                  ) : null}

                  {/* Form */}
                  <View className="gap-4">
                    <Input
                      label="New password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChangeText={(val) => {
                        setNewPassword(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      isPassword
                      autoCapitalize="none"
                      autoCorrect={false}
                      leftIcon={<Lock size={18} color={theme.colors.textMuted} />}
                      className="mb-1"
                    />

                    <Input
                      label="Confirm password"
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setConfirmPassword(val);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      isPassword
                      autoCapitalize="none"
                      autoCorrect={false}
                      leftIcon={<Lock size={18} color={theme.colors.textMuted} />}
                      className="mb-1"
                    />

                    {/* Requirements checklist */}
                    <View className="bg-surface-subtle rounded-xl p-3.5 gap-2 border border-border mt-1">
                      <Text className="text-xs font-semibold text-textSecondary mb-0.5 uppercase tracking-wide">Password Requirements:</Text>

                      <View className="flex-row items-center gap-2">
                        <View className={cn('w-4 h-4 rounded-full items-center justify-center', hasMinLength ? 'bg-primary' : 'bg-border')}>
                          {hasMinLength && <Check size={10} color={theme.colors.white} strokeWidth={3} />}
                        </View>
                        <Text className={cn('text-xs', hasMinLength ? 'text-textPrimary font-semibold' : 'text-textMuted')}>
                          At least 8 characters
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <View
                          className={cn(
                            'w-4 h-4 rounded-full items-center justify-center',
                            hasUppercase && hasLowercase ? 'bg-primary' : 'bg-border'
                          )}
                        >
                          {hasUppercase && hasLowercase && (
                            <Check size={10} color={theme.colors.white} strokeWidth={3} />
                          )}
                        </View>
                        <Text
                          className={cn(
                            'text-xs',
                            hasUppercase && hasLowercase ? 'text-textPrimary font-semibold' : 'text-textMuted'
                          )}
                        >
                          Upper and lowercase letters
                        </Text>
                      </View>

                      <View className="flex-row items-center gap-2">
                        <View className={cn('w-4 h-4 rounded-full items-center justify-center', hasNumber ? 'bg-primary' : 'bg-border')}>
                          {hasNumber && <Check size={10} color={theme.colors.white} strokeWidth={3} />}
                        </View>
                        <Text className={cn('text-xs', hasNumber ? 'text-textPrimary font-semibold' : 'text-textMuted')}>
                          At least one number (0-9)
                        </Text>
                      </View>

                      {confirmPassword.length > 0 && (
                        <View className="flex-row items-center gap-2">
                          <View
                            className={cn('w-4 h-4 rounded-full items-center justify-center', passwordsMatch ? 'bg-primary' : 'bg-border')}
                          >
                            {passwordsMatch && (
                              <Check size={10} color={theme.colors.white} strokeWidth={3} />
                            )}
                          </View>
                          <Text
                            className={cn('text-xs', passwordsMatch ? 'text-textPrimary font-semibold' : 'text-textMuted')}
                          >
                            Passwords match
                          </Text>
                        </View>
                      )}
                    </View>

                    <Button
                      title="Update Password"
                      variant="primary"
                      size="lg"
                      loading={loading}
                      disabled={!isFormValid || loading}
                      onPress={handleSubmit}
                      className="mt-3"
                    />
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};
