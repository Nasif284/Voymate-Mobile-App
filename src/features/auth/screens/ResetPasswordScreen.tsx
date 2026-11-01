import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  ShieldCheck,
} from 'lucide-react-native';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { useHaptics } from '../../../hooks/useHaptics';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const haptics = useHaptics();

  // Password rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSubmit = async () => {
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

    try {
      setLoading(true);
      setErrorMessage(null);

      await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
        email: email.trim().toLowerCase(),
        password: newPassword,
      });

      haptics.success();
      setIsSuccess(true);

      // Auto redirect to Login after 2.5 seconds
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 2500);
    } catch (err: any) {
      haptics.error();
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Unable to update password. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Back Navigation Button */}
              {!isSuccess && (
                <TouchableOpacity
                  style={styles.backButton}
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
                <View style={styles.successContainer}>
                  <View style={styles.successIconBox}>
                    <CheckCircle size={40} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.successTitle}>Password updated successfully!</Text>
                  <Text style={styles.successSubtitle}>
                    Your new password is set. Redirecting you to sign in...
                  </Text>

                  <Button
                    title="Proceed to Sign In"
                    variant="primary"
                    size="lg"
                    onPress={handleGoToLogin}
                    style={styles.loginNowButton}
                  />
                </View>
              ) : (
                <>
                  {/* Header */}
                  <View style={styles.header}>
                    <View style={styles.iconBox}>
                      <Lock size={22} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.title}>Reset your password</Text>
                    <Text style={styles.subtitle}>
                      Create a strong new password for your account.
                    </Text>
                  </View>

                  {/* Error Banner */}
                  {errorMessage ? (
                    <View style={styles.errorBanner}>
                      <AlertCircle size={16} color={theme.colors.error} style={styles.bannerIcon} />
                      <Text style={styles.errorBannerText}>{errorMessage}</Text>
                    </View>
                  ) : null}

                  {/* Form */}
                  <View style={styles.form}>
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
                      containerStyle={styles.inputField}
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
                      containerStyle={styles.inputField}
                    />

                    {/* Requirements checklist */}
                    <View style={styles.requirementsBox}>
                      <Text style={styles.requirementsHeader}>Password Requirements:</Text>
                      <View style={styles.reqRow}>
                        <View style={[styles.reqCheck, hasMinLength && styles.reqCheckActive]}>
                          {hasMinLength && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                        <Text style={[styles.reqText, hasMinLength && styles.reqTextActive]}>
                          At least 8 characters
                        </Text>
                      </View>

                      <View style={styles.reqRow}>
                        <View
                          style={[
                            styles.reqCheck,
                            hasUppercase && hasLowercase && styles.reqCheckActive,
                          ]}
                        >
                          {hasUppercase && hasLowercase && (
                            <Check size={10} color="#FFFFFF" strokeWidth={3} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.reqText,
                            hasUppercase && hasLowercase && styles.reqTextActive,
                          ]}
                        >
                          Upper and lowercase letters
                        </Text>
                      </View>

                      <View style={styles.reqRow}>
                        <View style={[styles.reqCheck, hasNumber && styles.reqCheckActive]}>
                          {hasNumber && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                        <Text style={[styles.reqText, hasNumber && styles.reqTextActive]}>
                          At least one number (0-9)
                        </Text>
                      </View>

                      {confirmPassword.length > 0 && (
                        <View style={styles.reqRow}>
                          <View
                            style={[styles.reqCheck, passwordsMatch && styles.reqCheckActive]}
                          >
                            {passwordsMatch && (
                              <Check size={10} color="#FFFFFF" strokeWidth={3} />
                            )}
                          </View>
                          <Text
                            style={[styles.reqText, passwordsMatch && styles.reqTextActive]}
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
                      style={styles.submitButton}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 36,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 84, 64, 0.08)',
    ...theme.shadows.subtle,
  },
  header: {
    marginBottom: 24,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.12)',
  },
  bannerIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.error,
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  inputField: {
    marginBottom: 4,
  },
  requirementsBox: {
    backgroundColor: 'rgba(0, 84, 64, 0.03)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 84, 64, 0.08)',
    marginTop: 4,
  },
  requirementsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E2E8E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqCheckActive: {
    backgroundColor: theme.colors.primary,
  },
  reqText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  reqTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 12,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 28,
  },
  loginNowButton: {
    width: '100%',
  },
});
