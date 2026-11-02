import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { GoogleIcon } from '../../../components/ui/GoogleIcon';
import { Mail, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react-native';
import { useHaptics } from '../../../hooks/useHaptics';
import { useRegister } from '../hooks/auth.hooks';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const haptics = useHaptics();
  const registerMutation = useRegister({
    onSuccess: () => {
      navigation.navigate('VerifyEmail', {
        email: email.trim().toLowerCase(),
        password,
      });
    },
    onError: (msg) => setErrorMessage(msg),
  });
  const loading = registerMutation.isPending;

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

  const handleSignup = () => {
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

    setErrorMessage(null);
    registerMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
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
                <Text className="text-[26px] font-medium text-textPrimary tracking-tight">Create account</Text>
                <Text className="text-sm text-textSecondary mt-1.5 leading-5">
                  Create an account to find travel mates for your next trip.
                </Text>
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View className="flex-row items-center bg-error-light py-2.5 px-3.5 rounded-xl mb-4 border border-error">
                  <AlertCircle size={16} color={theme.colors.error} className="mr-2" />
                  <Text className="flex-1 text-error text-[13px] font-medium leading-[17px]">{errorMessage}</Text>
                </View>
              ) : null}

              {/* Modern Label-Free Form */}
              <View className="w-full">
                <Input
                  placeholder="Full name"
                  value={fullName}
                  onChangeText={handleNameChange}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  returnKeyType="next"
                  leftIcon={<User size={18} color={theme.colors.textMuted} />}
                  className="mb-3.5"
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
                  leftIcon={<Mail size={18} color={theme.colors.textMuted} />}
                  className="mb-3.5"
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
                  leftIcon={<Lock size={18} color={theme.colors.textMuted} />}
                  className="mb-3.5"
                />

                {/* Primary Action Button */}
                <Button
                  title="Create Account"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  onPress={handleSignup}
                  className="rounded-2xl h-[54px] mt-1.5 shadow-card"
                />

                {/* Terms Micro-Notice */}
                <Text className="text-xs text-textMuted text-center mt-4 leading-[18px] px-2">
                  By creating an account, you agree to Voymate's{' '}
                  <Text className="text-primary font-semibold">Terms</Text> and{' '}
                  <Text className="text-primary font-semibold">Privacy Policy</Text>.
                </Text>

                {/* Divider */}
                <View className="flex-row items-center my-[22px]">
                  <View className="flex-1 h-[1px] bg-border" />
                  <Text className="mx-3.5 text-xs text-textMuted font-medium tracking-wide">or sign up with</Text>
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

              {/* Footer Switcher */}
              <View className="flex-row justify-center items-center mt-7">
                <Text className="text-sm text-textSecondary">Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => {
                    haptics.selection();
                    navigation.navigate('Login');
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Text className="text-sm text-primary font-bold">Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
