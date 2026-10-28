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
import { ArrowLeft, Mail, AlertCircle, CheckCircle, KeyRound } from 'lucide-react-native';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { useHaptics } from '../../../hooks/useHaptics';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const haptics = useHaptics();

  const handleSubmit = async () => {
    Keyboard.dismiss();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      haptics.error();
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      haptics.error();
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email: cleanEmail,
      });

      haptics.success();
      setSuccessMessage('Password reset code sent. Check your inbox.');
    } catch (err: any) {
      haptics.error();
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        'Unable to process password reset. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
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
                <View style={styles.keyIconBox}>
                  <KeyRound size={22} color={theme.colors.primary} />
                </View>
                <Text style={styles.title}>Reset password</Text>
                <Text style={styles.subtitle}>
                  Enter the email address tied to your account and we'll send you recovery instructions.
                </Text>
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={16} color={theme.colors.error} style={styles.bannerIcon} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Success Banner */}
              {successMessage ? (
                <View style={styles.statusBanner}>
                  <CheckCircle size={16} color={theme.colors.success} style={styles.bannerIcon} />
                  <Text style={styles.statusBannerText}>{successMessage}</Text>
                </View>
              ) : null}

              {/* Form Input (Label-free, top-aligned) */}
              <View style={styles.form}>
                <Input
                  placeholder="Email address"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  leftIcon={<Mail size={18} color={theme.colors.textMuted} />}
                  containerStyle={styles.inputField}
                />

                <Button
                  title="Send Reset Code"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  onPress={handleSubmit}
                  style={styles.submitButton}
                />
              </View>

              {/* Back to Login Link */}
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={() => {
                    haptics.selection();
                    navigation.navigate('Login');
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.footerLink}>Back to sign in</Text>
                </TouchableOpacity>
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
    marginBottom: 28,
  },
  keyIconBox: {
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
    fontWeight: '500',
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 110, 86, 0.15)',
  },
  bannerIcon: {
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },
  statusBannerText: {
    flex: 1,
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },
  form: {
    width: '100%',
  },
  inputField: {
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 16,
    height: 54,
    marginTop: 4,
    ...theme.shadows.card,
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
