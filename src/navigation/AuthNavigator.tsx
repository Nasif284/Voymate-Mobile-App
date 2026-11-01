import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { SignupScreen } from '../features/auth/screens/SignupScreen';
import { VerifyEmailScreen } from '../features/auth/screens/VerifyEmailScreen';
import { ForgotPasswordScreen } from '../features/auth/screens/ForgotPasswordScreen';
import { ForgotPasswordVerifyScreen } from '../features/auth/screens/ForgotPasswordVerifyScreen';
import { ResetPasswordScreen } from '../features/auth/screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ForgotPasswordVerify" component={ForgotPasswordVerifyScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};
