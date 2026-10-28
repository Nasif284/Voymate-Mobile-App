import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { GoogleIcon } from '../../../components/ui/GoogleIcon';
import { Mail, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react-native';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { useHaptics } from '../../../hooks/useHaptics';

type SignupScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Signup'
>;

interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const haptics = useHaptics();

  const handleNameChange = (text: string) => {
    setFullName(text);
    if (errorMessage) setErrorMessage(null);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSignup = async () => {
    Keyboard.dismiss();

    if (!fullName.trim() || !email.trim() || !password) {
      haptics.error();
      setErrorMessage('Please fill in all fields to create your account.');
      return;
    }

    if (fullName.trim().length < 4) {
      haptics.error();
      setErrorMessage('Full name must be at least 4 characters.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (password.length < 8 || !passwordRegex.test(password)) {
      haptics.error();
      setErrorMessage(
        'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.'
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      await apiClient.post(ENDPOINTS.AUTH.REGISTER, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      haptics.success();
      navigation.navigate('VerifyEmail', { email: email.trim().toLowerCase(), password });
    } catch (err: any) {
      haptics.error();
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        (err.message === 'Network Error'
          ? 'Cannot connect to server. Ensure your phone and PC are on the same Wi-Fi.'
          : null) ||
        'Unable to create account. Please check your details.';
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
                <Text style={styles.title}>Create account</Text>
                <Text style={styles.subtitle}>
                  Join a verified global community of solo explorers.
                </Text>
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={16} color={theme.colors.error} style={styles.errorIcon} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Modern Label-Free Form */}
              <View style={styles.form}>
                <Input
                  placeholder="Full name"
                  value={fullName}
                  onChangeText={handleNameChange}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  returnKeyType="next"
                  leftIcon={<User size={18} color="#7A8B84" />}
                  containerStyle={styles.inputContainer}
                />

                <Input
                  placeholder="Email address"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  leftIcon={<Mail size={18} color="#7A8B84" />}
                  containerStyle={styles.inputContainer}
                />

                <Input
                  placeholder="Create password (min 8 chars, 1 uppercase, 1 number)"
                  value={password}
                  onChangeText={handlePasswordChange}
                  isPassword
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                  leftIcon={<Lock size={18} color="#7A8B84" />}
                  containerStyle={styles.inputContainer}
                />

                {/* Primary Action Button */}
                <Button
                  title="Create Account"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  onPress={handleSignup}
                  style={styles.signupButton}
                />

                {/* Terms Micro-Notice */}
                <Text style={styles.termsText}>
                  By creating an account, you agree to Voymate's{' '}
                  <Text style={styles.termsLink}>Terms</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>.
                </Text>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or sign up with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign In */}
                <TouchableOpacity
                  style={styles.googleButton}
                  activeOpacity={0.85}
                  onPress={() => {
                    haptics.light();
                  }}
                >
                  <GoogleIcon size={19} />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>

              {/* Footer Switcher */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.selection();
                    navigation.navigate('Login');
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerLink}>Sign in</Text>
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
    marginBottom: 26,
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
  errorIcon: {
    marginRight: 8,
  },
  errorBannerText: {
    flex: 1,
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 14,
  },
  signupButton: {
    borderRadius: 16,
    height: 54,
    marginTop: 6,
    ...theme.shadows.card,
  },
  termsText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 84, 64, 0.08)',
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 12,
    color: '#8A9791',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(0, 84, 64, 0.1)',
    borderRadius: 16,
    height: 52,
    ...theme.shadows.subtle,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginLeft: 10,
    letterSpacing: 0.1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
