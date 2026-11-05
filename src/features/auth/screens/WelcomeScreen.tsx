import React from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { Button } from '../../../components/ui/Button';
import { Compass, ShieldCheck, Users, MapPin } from 'lucide-react-native';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Welcome'
>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[440px] self-center flex-1 justify-between">
          {/* Top Hero Brand Section */}
          <View className="mt-3">
            <View className="w-[68px] h-[68px] rounded-full bg-surface-subtle items-center justify-center mb-4">
              <Compass size={36} color={theme.colors.primary} />
            </View>
            <Text className="text-xs font-bold text-primary tracking-[2px] mb-1.5">
              WELCOME TO VOYMATE
            </Text>
            <Text className="text-display font-bold text-textPrimary leading-9 tracking-tight">
              Never travel alone again.
            </Text>
            <Text className="text-[15px] text-textSecondary leading-[22px] mt-3">
              Connect with solo travelers who share your destination, dates, and travel style.
            </Text>
          </View>

          {/* Feature Highlights Grid */}
          <View className="my-6">
            <View className="flex-row items-start mb-4">
              <View className="w-[38px] h-[38px] rounded-xl bg-surface-subtle items-center justify-center mr-3 mt-0.5">
                <Users size={18} color={theme.colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-textPrimary">Smart Compatibility</Text>
                <Text className="text-[13px] text-textMuted mt-0.5 leading-[18px]">
                  Match by dates, budget bracket, and travel pace.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start mb-4">
              <View className="w-[38px] h-[38px] rounded-xl bg-surface-subtle items-center justify-center mr-3 mt-0.5">
                <MapPin size={18} color={theme.colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-textPrimary">Nearby Discovery</Text>
                <Text className="text-[13px] text-textMuted mt-0.5 leading-[18px]">
                  Find fellow travelers currently in the same city.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start mb-4">
              <View className="w-[38px] h-[38px] rounded-xl bg-surface-subtle items-center justify-center mr-3 mt-0.5">
                <ShieldCheck size={18} color={theme.colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-textPrimary">Direct Messaging</Text>
                <Text className="text-[13px] text-textMuted mt-0.5 leading-[18px]">
                  Chat in real time and coordinate trip plans before you go.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mb-2">
            <Button
              title="Create an Account"
              variant="primary"
              size="lg"
              onPress={() => navigation.navigate('Signup')}
              className="mb-3"
            />

            <Button
              title="I already have an account"
              variant="secondary"
              size="lg"
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
