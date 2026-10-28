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
  Users,
  Share2,
  Search,
  BookOpen,
  Smartphone,
  MoreHorizontal,
  Check,
  AlertCircle,
  Compass,
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
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setOnboarding = useAuthStore((state) => state.setOnboarding);
  const haptics = useHaptics();

  const handleSelect = (id: string) => {
    haptics.selection();
    setSelectedSource(id);
    if (errorMessage) setErrorMessage(null);
  };

  const handleContinue = async () => {
    if (!selectedSource || loading) return;

    try {
      setLoading(true);
      setErrorMessage(null);

      await apiClient.post(ENDPOINTS.ONBOARDING.SOURCE, {
        source: selectedSource,
      });

      haptics.success();
      setOnboarding(2, false);
      navigation.navigate('ProfileDetails');
    } catch (err: any) {
      haptics.error();
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Could not save your response. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Step Progress Indicator */}
        <View style={styles.stepProgressHeader}>
          <View style={styles.brandRow}>
            <Compass size={22} color={theme.colors.primary} />
            <Text style={styles.brandText}>Voymate</Text>
          </View>
          <Text style={styles.stepCounterText}>Step 1 of 3</Text>
        </View>

        {/* Progress Bar Line */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: '33%' }]} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>How did you hear about us?</Text>
            <Text style={styles.subtitle}>
              This helps us understand where our global traveler community is growing.
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color={theme.colors.error} style={styles.bannerIcon} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Options Grid / List */}
          <View style={styles.optionsList}>
            {SOURCE_OPTIONS.map((opt) => {
              const isSelected = selectedSource === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => handleSelect(opt.id)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      isSelected && styles.iconCircleSelected,
                    ]}
                  >
                    {opt.icon(
                      isSelected ? theme.colors.primary : theme.colors.textSecondary
                    )}
                  </View>

                  <Text
                    style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>

                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Floating Bottom Button */}
        <View style={styles.bottomBar}>
          <Button
            title="Continue"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={!selectedSource || loading}
            onPress={handleContinue}
            style={styles.continueButton}
          />
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
  stepProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: -0.3,
  },
  stepCounterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: 'rgba(0, 84, 64, 0.08)',
    marginHorizontal: 24,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 24,
    marginTop: 8,
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
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 84, 64, 0.08)',
    ...theme.shadows.subtle,
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 84, 64, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconCircleSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  optionLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
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
  continueButton: {
    borderRadius: 16,
    height: 54,
    ...theme.shadows.card,
  },
});
