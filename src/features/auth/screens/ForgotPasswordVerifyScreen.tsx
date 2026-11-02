import React, { useState, useEffect } from 'react';
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
import { Button } from '../../../components/ui/Button';
import { OtpInput } from '../../../components/ui/OtpInput';
import { ArrowLeft, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react-native';
import { useHaptics } from '../../../hooks/useHaptics';
import { useVerifyOtp, useSendOtp } from '../hooks/auth.hooks';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPasswordVerify'>;

const RESEND_COOLDOWN_SECONDS = 45;

export const ForgotPasswordVerifyScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);

  const haptics = useHaptics();
  const verifyOtpMutation = useVerifyOtp({
    onSuccess: (cleanEmail) => {
      navigation.navigate('ResetPassword', { email: cleanEmail });
    },
    onError: (msg) => setErrorMessage(msg),
  });
  const sendOtpMutation = useSendOtp({
    onSuccess: () => {
      setStatusMessage('A new verification code has been sent to your email.');
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setCode('');
    },
    onError: (msg) => setErrorMessage(msg),
  });
  const loading = verifyOtpMutation.isPending;
  const resending = sendOtpMutation.isPending;

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

  const handleVerify = (codeToVerify?: string) => {
    if (loading) return;
    Keyboard.dismiss();
    const finalCode = (codeToVerify || code).trim();

    if (!finalCode || finalCode.length < 6) {
      haptics.error();
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setErrorMessage(null);
    verifyOtpMutation.mutate({
      email: email.trim().toLowerCase(),
      code: finalCode,
      purpose: 'password_reset',
    });
  };

  const handleResend = () => {
    if (countdown > 0 || resending) return;

    setErrorMessage(null);
    setStatusMessage(null);
    sendOtpMutation.mutate({
      email: email.trim().toLowerCase(),
      purpose: 'password_reset',
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

              {/* Header */}
              <View className="mb-6">
                <View className="w-11 h-11 rounded-full bg-surface-subtle items-center justify-center mb-3.5">
                  <ShieldCheck size={24} color={theme.colors.primary} />
                </View>
                <Text className="text-[26px] font-medium text-textPrimary tracking-tight">Enter verification code</Text>
                <Text className="text-sm text-textSecondary mt-1.5 leading-5">
                  We have sent a 6-digit verification code to reset your password.
                </Text>

                <View className="flex-row items-center bg-surface-subtle py-2 px-3 rounded-xl mt-3 self-start border border-border-subtle">
                  <Text className="text-[13px] font-semibold text-primary mr-2.5 max-w-[240px]" numberOfLines={1}>
                    {email}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      haptics.selection();
                      navigation.goBack();
                    }}
                  >
                    <Text className="text-xs text-textMuted font-semibold underline">Change</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View className="flex-row items-center bg-error-light py-2.5 px-3.5 rounded-xl mb-4 border border-error">
                  <AlertCircle size={16} color={theme.colors.error} className="mr-2" />
                  <Text className="flex-1 text-error text-[13px] font-medium leading-[17px]">{errorMessage}</Text>
                </View>
              ) : null}

              {/* Success / Status Banner */}
              {statusMessage ? (
                <View className="flex-row items-center bg-success-light py-2.5 px-3.5 rounded-xl mb-4 border border-success">
                  <CheckCircle size={16} color={theme.colors.success} className="mr-2" />
                  <Text className="flex-1 text-primary text-[13px] font-medium leading-[17px]">{statusMessage}</Text>
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
                className="rounded-2xl h-[54px] mt-6 shadow-card"
              />

              {/* Resend Cooldown Section */}
              <View className="items-center mt-6 py-2">
                {countdown > 0 ? (
                  <Text className="text-[13px] text-textMuted font-medium">
                    Resend code in{' '}
                    <Text className="text-primary font-bold">
                      0:{countdown < 10 ? `0${countdown}` : countdown}
                    </Text>
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResend}
                    disabled={resending}
                    activeOpacity={0.7}
                  >
                    <Text className="text-[13px] font-semibold text-primary">
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
