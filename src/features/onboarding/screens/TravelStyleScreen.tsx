import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../../navigation/types';
import { theme } from '../../../config/theme';
import { Button } from '../../../components/ui/Button';
import { useHaptics } from '../../../hooks/useHaptics';
import { useAuthStore } from '../../../store/authStore';
import { apiClient } from '../../../api/client';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Sparkles,
  Compass,
  Users,
  Backpack,
  Coins,
  Crown,
  Smile,
  Zap,
  Coffee,
  Globe,
  Heart,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'TravelStyle'>;

const TOTAL_SUBSTEPS = 4;

type TravelType = 'BACKPACKER' | 'BUDGET' | 'LUXURY';
type Personality = 'INTROVERT' | 'AMBIVERT' | 'EXTROVERT';
type MatchPreference = 'EVERYONE' | 'WOMEN' | 'MEN';

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
  { label: 'Mountains & Treks', value: 'Mountains' },
  { label: 'Beaches & Ocean', value: 'Beach' },
  { label: 'Food & Culinary', value: 'Foodie' },
  { label: 'Culture & History', value: 'Culture' },
  { label: 'Hiking & Trails', value: 'Hiking' },
  { label: 'Nightlife & Music', value: 'Party' },
  { label: 'Road Trips', value: 'Road Trips' },
  { label: 'Wildlife & Nature', value: 'Wildlife' },
  { label: 'Wellness & Yoga', value: 'Wellness' },
  { label: 'Photography', value: 'Photography' },
];

interface MatchOption {
  id: MatchPreference;
  title: string;
  subtitle: string;
  icon: (color: string) => React.ReactNode;
}

const MATCH_PREFERENCES: MatchOption[] = [
  {
    id: 'EVERYONE',
    title: 'Everyone',
    subtitle: 'Open to connecting with all respectful solo travelers worldwide 🌍',
    icon: (color) => <Globe size={22} color={color} strokeWidth={2} />,
  },
  {
    id: 'WOMEN',
    title: 'Women Only',
    subtitle: 'Prioritize connecting with verified female solo travelers 👩',
    icon: (color) => <Heart size={22} color={color} strokeWidth={2} />,
  },
  {
    id: 'MEN',
    title: 'Men Only',
    subtitle: 'Prioritize connecting with male solo travelers 👨',
    icon: (color) => <Users size={22} color={color} strokeWidth={2} />,
  },
];

export const TravelStyleScreen: React.FC<Props> = ({ navigation }) => {
  // Micro-step (0: Travel Type, 1: Personality, 2: Interests, 3: Match Preference)
  const [currentSubStep, setCurrentSubStep] = useState(0);

  // Form State
  const [travelType, setTravelType] = useState<TravelType>('BACKPACKER');
  const [personality, setPersonality] = useState<Personality>('AMBIVERT');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Mountains', 'Culture']);
  const [matchPreference, setMatchPreference] = useState<MatchPreference>('EVERYONE');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setOnboarding = useAuthStore((state) => state.setOnboarding);
  const haptics = useHaptics();

  // Next Micro-step
  const handleNextSubStep = () => {
    haptics.selection();
    setErrorMessage(null);

    // Validation for Sub-step 2 (Interests)
    if (currentSubStep === 2 && selectedInterests.length === 0) {
      haptics.error();
      setErrorMessage('Please pick at least one travel interest to continue.');
      return;
    }

    if (currentSubStep < TOTAL_SUBSTEPS - 1) {
      setCurrentSubStep((prev) => prev + 1);
    }
  };

  // Back Sub-step
  const handleBack = () => {
    haptics.selection();
    setErrorMessage(null);
    if (currentSubStep > 0) {
      setCurrentSubStep((prev) => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  // Toggle Interest Tag
  const toggleInterest = (val: string) => {
    haptics.selection();
    if (selectedInterests.includes(val)) {
      if (selectedInterests.length === 1) {
        haptics.error();
        setErrorMessage('Select at least one travel interest.');
        return;
      }
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
  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      await apiClient.post(ENDPOINTS.ONBOARDING.TRAVEL_STYLE, {
        travelType,
        interests: selectedInterests,
        travelPersonality: personality,
        matchWith: matchPreference,
      });

      haptics.success();
      // Marks onboarding as complete (skipping optional trip creation for now)
      setOnboarding(3, true);
    } catch (err: any) {
      haptics.error();
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Could not save your travel preferences. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={theme.colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.substepIndicator}>
            <Text style={styles.substepText}>
              Travel Style • {currentSubStep + 1} of {TOTAL_SUBSTEPS}
            </Text>
          </View>

          <View style={{ width: 40 }} />
        </View>

        {/* Segmented Progress Dashes */}
        <View style={styles.segmentedProgressBar}>
          {Array.from({ length: TOTAL_SUBSTEPS }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.segmentDash,
                index <= currentSubStep && styles.segmentDashActive,
              ]}
            />
          ))}
        </View>

        {/* Error Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={theme.colors.error} style={styles.bannerIcon} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* FOCUSED MICRO-STEPS */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* SUB-STEP 0: TRAVEL TYPE */}
          {currentSubStep === 0 && (
            <View style={styles.subStepContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>How do you travel?</Text>
                <Text style={styles.subtitle}>
                  Choose the travel budget and pace that best describes your style.
                </Text>
              </View>

              <View style={styles.cardList}>
                {TRAVEL_TYPES.map((type) => {
                  const isSelected = travelType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.choiceCard,
                        isSelected && styles.choiceCardSelected,
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setTravelType(type.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.cardIconBox,
                          isSelected && styles.cardIconBoxSelected,
                        ]}
                      >
                        {type.icon(
                          isSelected ? theme.colors.primary : theme.colors.textSecondary
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.cardTitleRow}>
                          <Text
                            style={[
                              styles.cardTitle,
                              isSelected && styles.cardTitleSelected,
                            ]}
                          >
                            {type.title}
                          </Text>
                          <View
                            style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleSelected,
                            ]}
                          >
                            {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                          </View>
                        </View>
                        <Text style={styles.cardTagline}>{type.tagline}</Text>
                        <Text style={styles.cardDesc}>{type.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* SUB-STEP 1: TRAVEL PERSONALITY */}
          {currentSubStep === 1 && (
            <View style={styles.subStepContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Your travel energy</Text>
                <Text style={styles.subtitle}>
                  This helps us match you with travel companions on a similar social wavelength.
                </Text>
              </View>

              <View style={styles.cardList}>
                {PERSONALITIES.map((p) => {
                  const isSelected = personality === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.choiceCard,
                        isSelected && styles.choiceCardSelected,
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setPersonality(p.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.cardIconBox,
                          isSelected && styles.cardIconBoxSelected,
                        ]}
                      >
                        {p.icon(
                          isSelected ? theme.colors.primary : theme.colors.textSecondary
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.cardTitleRow}>
                          <Text
                            style={[
                              styles.cardTitle,
                              isSelected && styles.cardTitleSelected,
                            ]}
                          >
                            {p.title}
                          </Text>
                          <View
                            style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleSelected,
                            ]}
                          >
                            {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                          </View>
                        </View>
                        <Text style={styles.cardTagline}>{p.tagline}</Text>
                        <Text style={styles.cardDesc}>{p.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* SUB-STEP 2: INTERESTS */}
          {currentSubStep === 2 && (
            <View style={styles.subStepContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>What excites you?</Text>
                <Text style={styles.subtitle}>
                  Select your favorite travel interests and activities (1 to 10 tags).
                </Text>
              </View>

              <View style={styles.chipsGrid}>
                {INTEREST_TAGS.map((tag) => {
                  const isSelected = selectedInterests.includes(tag.value);
                  return (
                    <TouchableOpacity
                      key={tag.value}
                      style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                      onPress={() => toggleInterest(tag.value)}
                      activeOpacity={0.7}
                    >
                      {isSelected ? (
                        <Check size={15} color="#FFFFFF" style={{ marginRight: 6 }} strokeWidth={2.5} />
                      ) : (
                        <Sparkles size={14} color={theme.colors.textMuted} style={{ marginRight: 6 }} />
                      )}
                      <Text
                        style={[
                          styles.interestChipText,
                          isSelected && styles.interestChipTextSelected,
                        ]}
                      >
                        {tag.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.selectedCountBox}>
                <Text style={styles.selectedCountText}>
                  {selectedInterests.length} of 10 selected
                </Text>
              </View>
            </View>
          )}

          {/* SUB-STEP 3: MATCH PREFERENCE */}
          {currentSubStep === 3 && (
            <View style={styles.subStepContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Who to explore with?</Text>
                <Text style={styles.subtitle}>
                  Choose who you are most comfortable discovering destinations with.
                </Text>
              </View>

              <View style={styles.cardList}>
                {MATCH_PREFERENCES.map((pref) => {
                  const isSelected = matchPreference === pref.id;
                  return (
                    <TouchableOpacity
                      key={pref.id}
                      style={[
                        styles.choiceCard,
                        isSelected && styles.choiceCardSelected,
                      ]}
                      onPress={() => {
                        haptics.selection();
                        setMatchPreference(pref.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.cardIconBox,
                          isSelected && styles.cardIconBoxSelected,
                        ]}
                      >
                        {pref.icon(
                          isSelected ? theme.colors.primary : theme.colors.textSecondary
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.cardTitleRow}>
                          <Text
                            style={[
                              styles.cardTitle,
                              isSelected && styles.cardTitleSelected,
                            ]}
                          >
                            {pref.title}
                          </Text>
                          <View
                            style={[
                              styles.radioCircle,
                              isSelected && styles.radioCircleSelected,
                            ]}
                          >
                            {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                          </View>
                        </View>
                        <Text style={styles.cardDesc}>{pref.subtitle}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Floating Bottom Button */}
        <View style={styles.bottomBar}>
          {currentSubStep < TOTAL_SUBSTEPS - 1 ? (
            <Button
              title="Continue"
              variant="primary"
              size="lg"
              onPress={handleNextSubStep}
              style={styles.actionButton}
            />
          ) : (
            <Button
              title="Complete & Enter Voymate"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              onPress={handleFinalSubmit}
              style={styles.actionButton}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 84, 64, 0.08)',
    ...theme.shadows.subtle,
  },
  substepIndicator: {
    alignItems: 'center',
  },
  substepText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  segmentedProgressBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 6,
    marginVertical: 12,
  },
  segmentDash: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 84, 64, 0.1)',
  },
  segmentDashActive: {
    backgroundColor: theme.colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 110,
  },
  subStepContainer: {
    paddingTop: 10,
  },
  header: {
    marginBottom: 24,
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
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.12)',
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
  cardList: {
    gap: 14,
  },
  choiceCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 84, 64, 0.08)',
    padding: 16,
    alignItems: 'flex-start',
    ...theme.shadows.subtle,
  },
  choiceCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 84, 64, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIconBoxSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  cardTitleSelected: {
    color: theme.colors.primary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 84, 64, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  cardTagline: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 84, 64, 0.12)',
    ...theme.shadows.subtle,
  },
  interestChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  interestChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  interestChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedCountBox: {
    marginTop: 20,
    alignItems: 'center',
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 84, 64, 0.06)',
  },
  actionButton: {
    borderRadius: 16,
    height: 54,
    ...theme.shadows.card,
  },
});
