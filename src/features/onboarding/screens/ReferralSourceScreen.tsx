import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { Button } from '../../../components/ui/Button';
import { VoymateLogo } from '../../../components/ui/VoymateLogo';
import { useHaptics } from '../../../hooks/useHaptics';
import { useSetOnboardingSource } from '../hooks/onboarding.hooks';
import { cn } from '../../../utils/cn';
import {
  Users,
  Share2,
  Search,
  BookOpen,
  Smartphone,
  MoreHorizontal,
  Check,
  AlertCircle,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'ReferralSource'>;

interface SourceOption {
  id: string;
  label: string;
  icon: (color: string) => React.ReactNode;
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    id: 'FRIENDS_FAMILY',
    label: 'Friends or Family',
    icon: (color) => <Users size={20} color={color} strokeWidth={2} />,
  },
  {
    id: 'SOCIAL_MEDIA',
    label: 'Social Media',
    icon: (color) => <Share2 size={20} color={color} strokeWidth={2} />,
  },
  {
    id: 'SEARCH_ENGINE',
    label: 'Search Engine',
    icon: (color) => <Search size={20} color={color} strokeWidth={2} />,
  },
  {
    id: 'TRAVEL_BLOG',
    label: 'Travel Blog or Article',
    icon: (color) => <BookOpen size={20} color={color} strokeWidth={2} />,
  },
  {
    id: 'APP_STORE',
    label: 'App Store',
    icon: (color) => <Smartphone size={20} color={color} strokeWidth={2} />,
  },
  {
    id: 'OTHER',
    label: 'Other',
    icon: (color) => <MoreHorizontal size={20} color={color} strokeWidth={2} />,
  },
];

export const ReferralSourceScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedSource, setSelectedSource] = useState<string>('FRIENDS_FAMILY');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const haptics = useHaptics();
  const setSourceMutation = useSetOnboardingSource({
    onSuccess: () => {
      navigation.navigate('ProfileDetails');
    },
    onError: (msg) => setErrorMessage(msg),
  });
  const loading = setSourceMutation.isPending;

  const handleSelect = (id: string) => {
    haptics.selection();
    setSelectedSource(id);
    if (errorMessage) setErrorMessage(null);
  };

  const handleContinue = () => {
    if (!selectedSource || loading) return;

    setErrorMessage(null);
    setSourceMutation.mutate({ source: selectedSource });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1">
        {/* Top Step Progress Indicator */}
        <View className="flex-row items-center justify-between px-6 pt-3 pb-2.5">
          <View className="flex-row items-center gap-2">
            <VoymateLogo size={24} withBackground />
            <Text className="text-lg font-bold text-primary tracking-tight">Voymate</Text>
          </View>
          <Text className="text-[13px] font-semibold text-textMuted">Step 1 of 3</Text>
        </View>

        {/* Progress Bar Line */}
        <View className="h-[3px] bg-border-subtle mx-6 rounded-full overflow-hidden mb-4">
          <View className="h-full bg-primary rounded-full w-1/3" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 110 }}
        >
          {/* Header */}
          <View className="mb-6 mt-2">
            <Text className="text-[26px] font-medium text-textPrimary tracking-tight">How did you hear about us?</Text>
            <Text className="text-sm text-textSecondary mt-1.5 leading-5">
              This helps us understand where our global traveler community is growing.
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View className="flex-row items-center bg-error-light py-2.5 px-3.5 rounded-xl mb-4 border border-error">
              <AlertCircle size={16} color={theme.colors.error} className="mr-2" />
              <Text className="flex-1 text-error text-[13px] font-medium leading-[17px]">{errorMessage}</Text>
            </View>
          ) : null}

          {/* Options Grid / List */}
          <View className="gap-3">
            {SOURCE_OPTIONS.map((opt) => {
              const isSelected = selectedSource === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  className={cn(
                    'flex-row items-center bg-surface py-3.5 px-4 rounded-2xl border-[1.5px] shadow-subtle',
                    isSelected ? 'border-primary' : 'border-border'
                  )}
                  style={theme.shadows.subtle}
                  onPress={() => handleSelect(opt.id)}
                  activeOpacity={0.75}
                >
                  <View
                    className={cn(
                      'w-10 h-10 rounded-xl items-center justify-center mr-3.5',
                      isSelected ? 'bg-primary-mist' : 'bg-surface-subtle'
                    )}
                  >
                    {opt.icon(
                      isSelected ? theme.colors.primary : theme.colors.textSecondary
                    )}
                  </View>

                  <Text
                    className={cn(
                      'flex-1 text-[15px]',
                      isSelected ? 'text-primary font-semibold' : 'text-textPrimary font-medium'
                    )}
                  >
                    {opt.label}
                  </Text>

                  <View
                    className={cn(
                      'w-[22px] h-[22px] rounded-full border-[1.5px] items-center justify-center',
                      isSelected ? 'bg-primary border-primary' : 'border-border'
                    )}
                  >
                    {isSelected && <Check size={13} color={theme.colors.white} strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Floating Bottom Button */}
        <View className="absolute bottom-0 left-0 right-0 bg-surface px-6 pt-3 pb-6 border-t border-border-subtle">
          <Button
            title="Continue"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!selectedSource || loading}
            onPress={handleContinue}
            className="rounded-2xl h-[54px] shadow-card"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};
