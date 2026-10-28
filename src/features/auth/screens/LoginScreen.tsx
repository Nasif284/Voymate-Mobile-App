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
import { Mail, Lock, Compass, AlertCircle } from 'lucide-react-native';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import { useHaptics } from '../../../hooks/useHaptics';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const haptics = useHaptics();

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errorMessage) setErrorMessage(null);
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!email.trim() || !password) {
      haptics.error();
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
        email: email.trim().toLowerCase(),
        password,
      });

      const data = response.data?.data;
      if (data) {
        haptics.success();
        await setAuthSession(
          data.user,
          {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          },
          {
            step: data.onboardingStep || 1,
            isCompleted: data.onboardingCompleted ?? false,
          },
          data.isVerified ?? true
        );
      }
    } catch (err: any) {
      haptics.error();
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        (err.message === 'Network Error'
          ? 'Cannot connect to server. Ensure your phone and PC are on the same Wi-Fi.'
          : null) ||
        'Incorrect email or password. Please try again.';
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
            <View style={styles.contentCenter}>
              {/* Minimalist Creative Brand Mark */}
              <View style={styles.brandHero}>
                <View style={styles.brandHaloRing}>
                  <View style={styles.brandIconCircle}>
                    <Compass size={28} color={theme.colors.primary} strokeWidth={1.8} />
                  </View>
                </View>
                <Text style={styles.brandWordmark}>VOYMATE</Text>
              </View>

              {/* Understated, Classy Welcome Header */}
              <View style={styles.header}>
                <Text style={styles.welcomeText}>Welcome back</Text>
                <Text style={styles.subtext}>
                  Sign in to pick up where your journey left off.
                </Text>
              </View>

              {/* Error Banner if any */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={16} color={theme.colors.error} style={styles.errorIcon} />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Modern Label-Free Inputs */}
              <View style={styles.form}>
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
                  placeholder="Password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  isPassword
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  leftIcon={<Lock size={18} color="#7A8B84" />}
                  containerStyle={styles.inputContainer}
                />

                {/* Subtle Forgot Password Link */}
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => {
                    haptics.selection();
                    navigation.navigate('ForgotPassword');
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>

                {/* Primary Button */}
                <Button
                  title="Sign In"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  onPress={handleLogin}
                  style={styles.signInButton}
                />

                {/* Creative Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
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

              {/* Bottom Switcher */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>New here? </Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.selection();
                    navigation.navigate('Signup');
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerLink}>Join Voymate</Text>
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
    paddingTop: 24,
    paddingBottom: 36,
  },
  contentCenter: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  brandHaloRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(160, 243, 212, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 84, 64, 0.08)',
    ...theme.shadows.subtle,
  },
  brandWordmark: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 22,
    marginTop: 2,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  signInButton: {
    borderRadius: 16,
    height: 54,
    ...theme.shadows.card,
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
