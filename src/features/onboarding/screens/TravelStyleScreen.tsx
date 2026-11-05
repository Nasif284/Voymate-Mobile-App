import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { Button } from '../../../components/ui/Button';
import { useHaptics } from '../../../hooks/useHaptics';
import { useSetOnboardingTravelStyle } from '../hooks/onboarding.hooks';
import { cn } from '../../../utils/cn';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Sparkles,
  Backpack,
  Coins,
  Crown,
  Smile,
  Zap,
  Coffee,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'TravelStyle'>;

const TOTAL_SUBSTEPS = 3;

type TravelType = 'BACKPACKER' | 'BUDGET' | 'LUXURY';
type Personality = 'INTROVERT' | 'AMBIVERT' | 'EXTROVERT';

interface TravelTypeOption {
  id: TravelType;
  title: string;
  tagline: string;
  desc: string;
  icon: (color: string) => React.ReactNode;
}

const TRAVEL_TYPES: TravelTypeOption[] = [
  {
    id: 'BACKPACKER',
    title: 'Backpacker',
    tagline: 'Off the beaten path 🎒',
    desc: 'Hostels, local transit, spontaneous adventures, and immersive backpacking culture.',
    icon: (color) => <Backpack size={24} color={color} strokeWidth={2} />,
  },
  {
    id: 'BUDGET',
    title: 'Smart Budget',
    tagline: 'Maximum value 🪙',
    desc: 'Cost-conscious, comfortable stays, smart itinerary planning, and shared expenses.',
    icon: (color) => <Coins size={24} color={color} strokeWidth={2} />,
  },
  {
    id: 'LUXURY',
    title: 'Luxury & Comfort',
    tagline: 'Premium exploration ✨',
    desc: 'Boutique hotels, private transport, fine culinary experiences, and high comfort.',
    icon: (color) => <Crown size={24} color={color} strokeWidth={2} />,
  },
];

interface PersonalityOption {
  id: Personality;
  title: string;
  tagline: string;
  desc: string;
  icon: (color: string) => React.ReactNode;
}

const PERSONALITIES: PersonalityOption[] = [
  {
    id: 'INTROVERT',
    title: 'Introverted Explorer',
    tagline: 'Quiet & contemplative 🌿',
    desc: 'Enjoys calm mornings, uncrowded scenic spots, peaceful walks, and smaller group vibes.',
    icon: (color) => <Coffee size={24} color={color} strokeWidth={2} />,
  },
  {
    id: 'AMBIVERT',
    title: 'Balanced Ambivert',
    tagline: 'Best of both worlds ⚖️',
    desc: 'Loves social outings and shared dinners, but values personal downtime to recharge.',
    icon: (color) => <Smile size={24} color={color} strokeWidth={2} />,
  },
  {
    id: 'EXTROVERT',
    title: 'High-Energy Extrovert',
    tagline: 'Thrives in crowds ⚡',
    desc: 'Loves meeting travelers, lively hostel crawls, group expeditions, and nonstop energy.',
    icon: (color) => <Zap size={24} color={color} strokeWidth={2} />,
  },
];

const INTEREST_TAGS = [
  { label: 'Hiking & Trekking', value: 'HIKING' },
  { label: 'Street Food & Dining', value: 'FOODIE' },
  { label: 'Photography', value: 'PHOTOGRAPHY' },
  { label: 'Art & Museums', value: 'CULTURE' },
  { label: 'Nightlife & Bars', value: 'NIGHTLIFE' },
  { label: 'Beaches & Surfing', value: 'BEACH' },
  { label: 'Historical Sites', value: 'HISTORY' },
  { label: 'Nature & Wildlife', value: 'NATURE' },
  { label: 'Road Trips', value: 'ROAD_TRIPS' },
  { label: 'Wellness & Yoga', value: 'WELLNESS' },
  { label: 'Coffee Crawls', value: 'COFFEE' },
  { label: 'Scuba Diving', value: 'SCUBA' },
];

export const TravelStyleScreen: React.FC<Props> = ({ navigation }) => {
  const [currentSubStep, setCurrentSubStep] = useState(0);
  const [travelType, setTravelType] = useState<TravelType>('BACKPACKER');
  const [personality, setPersonality] = useState<Personality>('AMBIVERT');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'FOODIE',
    'PHOTOGRAPHY',
    'HIKING',
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const haptics = useHaptics();
  const setTravelStyleMutation = useSetOnboardingTravelStyle({
    onSuccess: () => {
      // Onboarding complete! The root navigator will automatically render MainTabNavigator
    },
    onError: (msg) => setErrorMessage(msg),
  });
  const loading = setTravelStyleMutation.isPending;

  // Navigation Logic between micro-steps
  const handleBack = () => {
    if (currentSubStep > 0) {
      haptics.selection();
      setCurrentSubStep((prev) => prev - 1);
      if (errorMessage) setErrorMessage(null);
    } else {
      navigation.goBack();
    }
  };

  const handleNextSubStep = () => {
    if (errorMessage) setErrorMessage(null);

    if (currentSubStep === 2 && selectedInterests.length === 0) {
      haptics.error();
      setErrorMessage('Please select at least one travel interest.');
      return;
    }

    haptics.selection();
    setCurrentSubStep((prev) => prev + 1);
  };

  // Toggle Interest Tag
  const toggleInterest = (val: string) => {
    haptics.selection();
    if (selectedInterests.includes(val)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== val));
    } else {
      if (selectedInterests.length >= 10) {
        haptics.error();
        setErrorMessage('You can choose up to 10 interests.');
        return;
      }
      setSelectedInterests([...selectedInterests, val]);
      if (errorMessage) setErrorMessage(null);
    }
  };

  // Final Submit
  const handleFinalSubmit = () => {
    setErrorMessage(null);
    setTravelStyleMutation.mutate({
      travelType,
      interests: selectedInterests,
      travelPersonality: personality,
      matchWith: 'EVERYONE',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-surface">
      <View className="flex-1">
        {/* Top Header Bar */}
        <View className="flex-row items-center justify-between px-5 pt-2.5 pb-2">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-surface items-center justify-center border border-border shadow-subtle"
            style={theme.shadows.subtle}
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>

          <View className="items-center">
            <Text className="text-[13px] font-semibold text-textMuted">
              Travel Style • {currentSubStep + 1} of {TOTAL_SUBSTEPS}
            </Text>
          </View>

          <View className="w-10" />
        </View>

        {/* Segmented Progress Dashes */}
        <View className="flex-row px-5 gap-1.5 my-3">
          {Array.from({ length: TOTAL_SUBSTEPS }).map((_, index) => (
            <View
              key={index}
              className={cn(
                'flex-1 h-[3.5px] rounded-full',
                index <= currentSubStep ? 'bg-primary' : 'bg-border-subtle'
              )}
            />
          ))}
        </View>

        {/* Error Banner */}
        {errorMessage ? (
          <View className="flex-row items-center bg-error-light py-2.5 px-3.5 rounded-xl mx-5 mb-2.5 border border-error">
            <AlertCircle size={16} color={theme.colors.error} className="mr-2" />
            <Text className="flex-1 text-error text-[13px] font-medium leading-[17px]">{errorMessage}</Text>
          </View>
        ) : null}

        {/* FOCUSED MICRO-STEPS */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 110 }}
        >
          {/* SUB-STEP 0: TRAVEL TYPE */}
          {currentSubStep === 0 && (
            <View className="pt-2.5">
              <View className="mb-6">
                <Text className="text-[26px] font-medium text-textPrimary tracking-tight">How do you travel?</Text>
                <Text className="text-sm text-textSecondary mt-1.5 leading-5">
                  Choose the travel budget and pace that best describes your style.
                </Text>
              </View>

              <View className="gap-3.5">
                {TRAVEL_TYPES.map((type) => {
                  const isSelected = travelType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      className={cn(
                        'flex-row bg-surface rounded-[18px] border-[1.5px] p-4 items-start shadow-subtle',
                        isSelected ? 'border-primary' : 'border-border'
                      )}
                      style={theme.shadows.subtle}
                      onPress={() => {
                        haptics.selection();
                        setTravelType(type.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        className={cn(
                          'w-[46px] h-[46px] rounded-xl items-center justify-center mr-3.5',
                          isSelected ? 'bg-surface border border-primary' : 'bg-surface-subtle'
                        )}
                      >
                        {type.icon(
                          isSelected ? theme.colors.primary : theme.colors.textSecondary
                        )}
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text
                            className={cn(
                              'text-base font-semibold',
                              isSelected ? 'text-primary' : 'text-textPrimary'
                            )}
                          >
                            {type.title}
                          </Text>
                          <View
                            className={cn(
                              'w-[22px] h-[22px] rounded-full border-[1.5px] items-center justify-center',
                              isSelected ? 'bg-primary border-primary' : 'border-border'
                            )}
                          >
                            {isSelected && <Check size={12} color={theme.colors.white} strokeWidth={3} />}
                          </View>
                        </View>
                        <Text className="text-xs font-semibold text-primary mb-1">{type.tagline}</Text>
                        <Text className="text-[13px] text-textSecondary leading-[18px]">{type.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* SUB-STEP 1: TRAVEL PERSONALITY */}
          {currentSubStep === 1 && (
            <View className="pt-2.5">
              <View className="mb-6">
                <Text className="text-[26px] font-medium text-textPrimary tracking-tight">Your travel energy</Text>
                <Text className="text-sm text-textSecondary mt-1.5 leading-5">
                  This helps us match you with travel companions on a similar social wavelength.
                </Text>
              </View>

              <View className="gap-3.5">
                {PERSONALITIES.map((p) => {
                  const isSelected = personality === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      className={cn(
                        'flex-row bg-surface rounded-[18px] border-[1.5px] p-4 items-start shadow-subtle',
                        isSelected ? 'border-primary' : 'border-border'
                      )}
                      style={theme.shadows.subtle}
                      onPress={() => {
                        haptics.selection();
                        setPersonality(p.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        className={cn(
                          'w-[46px] h-[46px] rounded-xl items-center justify-center mr-3.5',
                          isSelected ? 'bg-surface border border-primary' : 'bg-surface-subtle'
                        )}
                      >
                        {p.icon(
                          isSelected ? theme.colors.primary : theme.colors.textSecondary
                        )}
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text
                            className={cn(
                              'text-base font-semibold',
                              isSelected ? 'text-primary' : 'text-textPrimary'
                            )}
                          >
                            {p.title}
                          </Text>
                          <View
                            className={cn(
                              'w-[22px] h-[22px] rounded-full border-[1.5px] items-center justify-center',
                              isSelected ? 'bg-primary border-primary' : 'border-border'
                            )}
                          >
                            {isSelected && <Check size={12} color={theme.colors.white} strokeWidth={3} />}
                          </View>
                        </View>
                        <Text className="text-xs font-semibold text-primary mb-1">{p.tagline}</Text>
                        <Text className="text-[13px] text-textSecondary leading-[18px]">{p.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* SUB-STEP 2: INTERESTS */}
          {currentSubStep === 2 && (
            <View className="pt-2.5">
              <View className="mb-6">
                <Text className="text-[26px] font-medium text-textPrimary tracking-tight">What excites you?</Text>
                <Text className="text-sm text-textSecondary mt-1.5 leading-5">
                  Select your favorite travel interests and activities (1 to 10 tags).
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-2.5">
                {INTEREST_TAGS.map((tag) => {
                  const isSelected = selectedInterests.includes(tag.value);
                  return (
                    <TouchableOpacity
                      key={tag.value}
                      className={cn(
                        'flex-row items-center py-3 px-4 rounded-full border-[1.2px] shadow-subtle',
                        isSelected ? 'bg-primary border-primary' : 'bg-surface border-border'
                      )}
                      style={theme.shadows.subtle}
                      onPress={() => toggleInterest(tag.value)}
                      activeOpacity={0.7}
                    >
                      {isSelected ? (
                        <Check size={15} color={theme.colors.white} className="mr-1.5" strokeWidth={2.5} />
                      ) : (
                        <Sparkles size={14} color={theme.colors.textMuted} className="mr-1.5" />
                      )}
                      <Text
                        className={cn(
                          'text-sm',
                          isSelected ? 'text-white font-semibold' : 'text-textPrimary font-medium'
                        )}
                      >
                        {tag.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View className="mt-5 items-center">
                <Text className="text-xs font-semibold text-textMuted">
                  {selectedInterests.length} of 10 selected
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Floating Bottom Button */}
        <View className="absolute bottom-0 left-0 right-0 bg-surface px-6 pt-3 pb-6 border-t border-border-subtle">
          {currentSubStep < TOTAL_SUBSTEPS - 1 ? (
            <Button
              title="Continue"
              variant="primary"
              size="lg"
              onPress={handleNextSubStep}
              className="rounded-2xl h-[54px] shadow-card"
            />
          ) : (
            <Button
              title="Complete & Enter Voymate"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              onPress={handleFinalSubmit}
              className="rounded-2xl h-[54px] shadow-card"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};
