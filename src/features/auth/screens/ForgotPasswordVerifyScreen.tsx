import React, { useState, useEffect } from 'react';
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
import { Button } from '../../../components/ui/Button';
import { OtpInput } from '../../../components/ui/OtpInput';
import { ArrowLeft, AlertCircle, CheckCircle, KeyRound, ShieldCheck } from 'lucide-react-native';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { useHaptics } from '../../../hooks/useHaptics';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPasswordVerify'>;

const RESEND_COOLDOWN_SECONDS = 45;

export const ForgotPasswordVerifyScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);

  const haptics = useHaptics();

  // Resend Countdown Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleCodeChange = (text: string) => {
    setCode(text);
    if (errorMessage) setErrorMessage(null);
    if (statusMessage) setStatusMessage(null);
  };

  const handleVerify = async (codeToVerify?: string) => {
    if (loading) return;
    Keyboard.dismiss();
    const finalCode = (codeToVerify || code).trim();

    if (!finalCode || finalCode.length < 6) {
      haptics.error();
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      await apiClient.post(ENDPOINTS.AUTH.VERIFY_OTP, {
        email: email.trim().toLowerCase(),
        code: finalCode,
        purpose: 'password_reset',
      });

      haptics.success();
      navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() });
    } catch (err: any) {
      haptics.error();
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Invalid or expired code. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    try {
      setResending(true);
      setErrorMessage(null);
      setStatusMessage(null);

      await apiClient.post(ENDPOINTS.AUTH.SEND_OTP, {
        email: email.trim().toLowerCase(),
        purpose: 'password_reset',
      });

      haptics.success();
      setStatusMessage('A new verification code has been sent to your email.');
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setCode('');
    } catch (err: any) {
      haptics.error();
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Unable to resend code right now. Please try again later.';
      setErrorMessage(message);
    } finally {
      setResending(false);
    }
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

              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconBox}>
                  <ShieldCheck size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.title}>Enter verification code</Text>
                <Text style={styles.subtitle}>
                  We have sent a 6-digit verification code to reset your password.
                </Text>

                <View style={styles.emailPill}>
                  <Text style={styles.emailText} numberOfLines={1}>
                    {email}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      haptics.selection();
                      navigation.goBack();
                    }}
                  >
                    <Text style={styles.editLink}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={16} color={theme.colors.error} style={styles.bannerIcon} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Success / Status Banner */}
              {statusMessage ? (
                <View style={styles.statusBanner}>
                  <CheckCircle size={16} color={theme.colors.success} style={styles.bannerIcon} />
                  <Text style={styles.statusBannerText}>{statusMessage}</Text>
                </View>
              ) : null}

              {/* 6-Digit OTP Input */}
              <OtpInput
                length={6}
                value={code}
                onChange={handleCodeChange}
                onComplete={(completedCode) => handleVerify(completedCode)}
                error={!!errorMessage}
                disabled={loading}
              />

              {/* Primary Action Button */}
              <Button
                title="Verify Code"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={code.length < 6 || loading}
                onPress={() => handleVerify()}
                style={styles.verifyButton}
              />

              {/* Resend Cooldown Section */}
              <View style={styles.resendContainer}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    Resend code in{' '}
                    <Text style={styles.countdownBold}>
                      0:{countdown < 10 ? `0${countdown}` : countdown}
                    </Text>
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResend}
                    disabled={resending}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resendLink}>
                      {resending ? 'Sending...' : "Didn't receive a code? Resend"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 84, 64, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  emailText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: 10,
    maxWidth: 240,
  },
  editLink: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 110, 86, 0.12)',
  },
  statusBannerText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  verifyButton: {
    marginTop: 24,
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  countdownBold: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
