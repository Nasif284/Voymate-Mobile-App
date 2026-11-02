import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { VoymateLogo } from '../../../components/ui/VoymateLogo';
import { GoogleIcon } from '../../../components/ui/GoogleIcon';
import { Mail, Lock, AlertCircle } from 'lucide-react-native';
import { useHaptics } from '../../../hooks/useHaptics';
import { useLogin } from '../hooks/auth.hooks';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const haptics = useHaptics();
  const loginMutation = useLogin({
    onError: (msg) => setErrorMessage(msg),
  });
  const loading = loginMutation.isPending;

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errorMessage) setErrorMessage(null);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errorMessage) setErrorMessage(null);
  };

  const handleLogin = () => {
    Keyboard.dismiss();

    if (!email.trim() || !password) {
      haptics.error();
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setErrorMessage(null);
    loginMutation.mutate({
      email: email.trim().toLowerCase(),
      password,
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
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 36 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="w-full max-w-[420px] self-center">
              {/* Minimalist Creative Brand Mark */}
              <View className="items-center mt-3 mb-6">
                <View className="mb-3 shadow-subtle" style={theme.shadows.subtle}>
                  <VoymateLogo size={56} variant="rose" withBackground />
                </View>
                <Text className="text-xs font-bold text-primary tracking-[4px]">VOYMATE</Text>
              </View>

              {/* Understated, Classy Welcome Header */}
              <View className="items-center mb-7">
                <Text className="text-[26px] font-medium text-textPrimary tracking-tight">Welcome back</Text>
                <Text className="text-sm text-textSecondary mt-1.5 text-center leading-5">
                  Sign in to view your trips, matches, and messages.
                </Text>
              </View>

              {/* Error Banner if any */}
              {errorMessage ? (
                <View className="flex-row items-center bg-error-light py-2.5 px-3.5 rounded-xl mb-4 border border-error">
                  <AlertCircle size={16} color={theme.colors.error} className="mr-2" />
                  <Text className="flex-1 text-error text-[13px] font-medium leading-[17px]">{errorMessage}</Text>
                </View>
              ) : null}

              {/* Modern Label-Free Inputs */}
              <View className="w-full">
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
                  leftIcon={<Mail size={18} color={theme.colors.textMuted} />}
                  className="mb-3.5"
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
                  leftIcon={<Lock size={18} color={theme.colors.textMuted} />}
                  className="mb-3.5"
                />

                {/* Subtle Forgot Password Link */}
                <TouchableOpacity
                  className="self-end mb-5 mt-0.5"
                  onPress={() => {
                    haptics.selection();
                    navigation.navigate('ForgotPassword');
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <Text className="text-primary text-[13px] font-medium">Forgot password?</Text>
                </TouchableOpacity>

                {/* Primary Button */}
                <Button
                  title="Sign In"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  onPress={handleLogin}
                  className="rounded-2xl h-[54px] shadow-card"
                />

                {/* Creative Divider */}
                <View className="flex-row items-center my-[22px]">
                  <View className="flex-1 h-[1px] bg-border" />
                  <Text className="mx-3.5 text-xs text-textMuted font-medium tracking-wide">or continue with</Text>
                  <View className="flex-1 h-[1px] bg-border" />
                </View>

                {/* Google Sign In */}
                <TouchableOpacity
                  className="flex-row items-center justify-center bg-surface border border-border rounded-2xl h-[52px] shadow-subtle"
                  style={theme.shadows.subtle}
                  activeOpacity={0.85}
                  onPress={() => {
                    haptics.light();
                  }}
                >
                  <GoogleIcon size={19} />
                  <Text className="text-[15px] font-medium text-textPrimary ml-2.5 tracking-wide">Continue with Google</Text>
                </TouchableOpacity>
              </View>

              {/* Bottom Switcher */}
              <View className="flex-row justify-center items-center mt-7">
                <Text className="text-sm text-textSecondary">New here? </Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.selection();
                    navigation.navigate('Signup');
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Text className="text-sm text-primary font-bold">Join Voymate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};
