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
import { ArrowLeft, Mail, AlertCircle, CheckCircle, KeyRound } from 'lucide-react-native';
import { useHaptics } from '../../../hooks/useHaptics';
import { useForgotPassword } from '../hooks/auth.hooks';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const haptics = useHaptics();
  const forgotPasswordMutation = useForgotPassword({
    onSuccess: (cleanEmail) => {
      navigation.navigate('ForgotPasswordVerify', { email: cleanEmail });
    },
    onError: (msg) => setErrorMessage(msg),
  });
  const loading = forgotPasswordMutation.isPending;

  const handleSubmit = () => {
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

    setErrorMessage(null);
    setSuccessMessage(null);
    forgotPasswordMutation.mutate({ email: cleanEmail });
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
              <View className="mb-7">
                <View className="w-11 h-11 rounded-full bg-primary-mist items-center justify-center mb-3.5">
                  <KeyRound size={22} color={theme.colors.primary} />
                </View>
                <Text className="text-[26px] font-medium text-textPrimary tracking-tight">Reset password</Text>
                <Text className="text-sm text-textSecondary mt-1.5 leading-5">
                  Enter your email address and we will send you the verification code to reset your password.
                </Text>
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View className="flex-row items-center bg-error-light py-2.5 px-3.5 rounded-xl mb-4 border border-error">
                  <AlertCircle size={16} color={theme.colors.error} className="mr-2" />
                  <Text className="flex-1 text-error text-[13px] font-medium leading-[17px]">{errorMessage}</Text>
                </View>
              ) : null}

              {/* Success Banner */}
              {successMessage ? (
                <View className="flex-row items-center bg-success-light py-2.5 px-3.5 rounded-xl mb-4 border border-success">
                  <CheckCircle size={16} color={theme.colors.success} className="mr-2" />
                  <Text className="flex-1 text-success text-[13px] font-medium leading-[17px]">{successMessage}</Text>
                </View>
              ) : null}

              {/* Form Input (Label-free, top-aligned) */}
              <View className="w-full">
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
                  className="mb-4"
                />

                <Button
                  title="Send Verification Code"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  onPress={handleSubmit}
                  className="rounded-2xl h-[54px] mt-1 shadow-card"
                />
              </View>

              {/* Back to Login Link */}
              <View className="items-center mt-7">
                <TouchableOpacity
                  onPress={() => {
                    haptics.selection();
                    navigation.navigate('Login');
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text className="text-sm text-primary font-semibold">Back to sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};
