import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../../config/theme';
import { UserTrip } from '../../trips/types';
import {
  Compass,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  ArrowRight,
  ShieldCheck,
  Plus,
  Flame,
  Globe2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface HomeEmptyStateProps {
  activeTrip?: UserTrip | null;
  onPlanTripPress: () => void;
  onViewMatchesPress: () => void;
  onViewTripsPress: () => void;
  onExplorePress: () => void;
}

export const HomeEmptyState: React.FC<HomeEmptyStateProps> = ({
  activeTrip,
  onPlanTripPress,
  onViewMatchesPress,
  onViewTripsPress,
  onExplorePress,
}) => {
  const formatDateRange = (from: string | Date, to: string | Date) => {
    try {
      const d1 = new Date(from);
      const d2 = new Date(to);
      const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${d1.toLocaleDateString('en-US', opt)} - ${d2.toLocaleDateString('en-US', opt)}`;
    } catch {
      return 'Upcoming Dates';
    }
  };

  const destinationTitle =
    activeTrip?.destination?.name ||
    activeTrip?.destination?.city ||
    activeTrip?.name ||
    'Upcoming Journey';

  // -------------------------------------------------------------
  // Scenario 1: User HAS an Active Trip (Feed is temporarily quiet)
  // -------------------------------------------------------------
  if (activeTrip) {
    return (
      <View style={styles.container}>
        {/* Active Journey Radar Card */}
        <View style={styles.activeTripCard}>
          {/* Ambient Lighting Accents */}
          <View style={styles.ambientGlowTop} />
          <View style={styles.ambientGlowBottom} />

          {/* Destination & Meta */}
          <View style={styles.tripInfoRow}>
            <View style={styles.tripIconBox}>
              <MapPin size={22} color={theme.colors.primaryLight} />
            </View>
            <View style={styles.tripTextCol}>
              <Text style={styles.tripDestination} numberOfLines={1}>
                {destinationTitle}
              </Text>
              <View style={styles.tripMetaRow}>
                <View style={styles.metaPill}>
                  <Calendar size={11} color={theme.colors.primaryLight} />
                  <Text style={styles.metaPillText}>
                    {formatDateRange(activeTrip.dateFrom, activeTrip.dateTo)}
                  </Text>
                </View>
                {activeTrip.travelStyle && (
                  <View style={styles.metaPill}>
                    <Flame size={11} color={theme.colors.primaryLight} />
                    <Text style={styles.metaPillText}>
                      {activeTrip.travelStyle}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Psychological Reassurance Body */}
        <View style={styles.bodyCard}>
          <View style={styles.badgeRow}>
            <View style={styles.sparkleCircle}>
              <Sparkles size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.badgeCategoryText}>TRIP ACTIVE</Text>
          </View>

          <Text style={styles.headline}>
            Looking for travel mates for {destinationTitle}
          </Text>

          <Text style={styles.persuasiveText}>
            Your trip is live. New travelers add trips every day—check your trip matches or browse other destinations while we find people heading to {destinationTitle}.
          </Text>

          {/* Value Highlights */}
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={styles.tipIconWrap}>
                <Users size={14} color={theme.colors.primary} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Smart Destination Matches</Text>
                <Text style={styles.tipDesc}>
                  We match you with travelers visiting {destinationTitle} on overlapping dates.
                </Text>
              </View>
            </View>

            <View style={styles.tipItem}>
              <View style={styles.tipIconWrap}>
                <ShieldCheck size={14} color={theme.colors.primary} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Direct Trip Planning</Text>
                <Text style={styles.tipDesc}>
                  Chat directly before your trip to coordinate transport, stays, and activities.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionCol}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onViewMatchesPress();
              }}
            >
              <Users size={17} color={theme.colors.white} strokeWidth={2.2} />
              <Text style={styles.primaryBtnText}>View Trip Matches</Text>
              <ArrowRight size={16} color={theme.colors.white} />
            </TouchableOpacity>

            <View style={styles.secondaryBtnRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onViewTripsPress();
                }}
              >
                <Calendar size={14} color={theme.colors.primary} />
                <Text style={styles.secondaryBtnText}>My Trips</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onPlanTripPress();
                }}
              >
                <Plus size={14} color={theme.colors.primary} />
                <Text style={styles.secondaryBtnText}>Add Another Trip</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Retention Micro-Tip */}
          <View style={styles.proTipBox}>
            <Text style={styles.proTipEmoji}>💡</Text>
            <Text style={styles.proTipText}>
              <Text style={styles.proTipBold}>Tip: </Text>
              Complete your bio and travel interests to get 3x more connection requests.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // Scenario 2: User has NO Active Trip (Activation & Retention)
  // -------------------------------------------------------------
  return (
    <View style={styles.container}>
      <View style={styles.activationCard}>
        {/* Soft Background Geometry */}
        <View style={styles.activationGlowOne} />
        <View style={styles.activationGlowTwo} />

        {/* Hero Visual Icon Badge */}
        <View style={styles.heroIconBadge}>
          <Compass size={32} color={theme.colors.primary} strokeWidth={2.2} />
          <View style={styles.heroSparkleWrap}>
            <Sparkles size={14} color={theme.colors.primaryDark} />
          </View>
        </View>

        {/* Motivational Tag */}
        <View style={styles.motivationPill}>
          <Globe2 size={11} color={theme.colors.primary} />
          <Text style={styles.motivationPillText}>GET STARTED</Text>
        </View>

        {/* Core Psychological Headline */}
        <Text style={styles.activationTitle}>
          Plan a Trip to Find Travel Mates
        </Text>

        {/* Empathetic & Persuasive Copy */}
        <Text style={styles.activationSubtitle}>
          Add your destination and travel dates. We will match you with solo travelers going to the same place.
        </Text>

        {/* 3 Core Value Props to Reduce Hesitation */}
        <View style={styles.valuePropsContainer}>
          <View style={styles.valuePropCard}>
            <View style={styles.valuePropIconCircle}>
              <Text style={styles.valuePropEmoji}>🎯</Text>
            </View>
            <View style={styles.valuePropTextCol}>
              <Text style={styles.valuePropHeading}>Smart Matching</Text>
              <Text style={styles.valuePropDesc}>
                Match by destination, travel dates, and budget.
              </Text>
            </View>
          </View>

          <View style={styles.valuePropCard}>
            <View style={styles.valuePropIconCircle}>
              <Text style={styles.valuePropEmoji}>💬</Text>
            </View>
            <View style={styles.valuePropTextCol}>
              <Text style={styles.valuePropHeading}>Chat Before You Go</Text>
              <Text style={styles.valuePropDesc}>
                Message potential travel mates and align plans before your trip.
              </Text>
            </View>
          </View>

          <View style={styles.valuePropCard}>
            <View style={styles.valuePropIconCircle}>
              <Text style={styles.valuePropEmoji}>🚗</Text>
            </View>
            <View style={styles.valuePropTextCol}>
              <Text style={styles.valuePropHeading}>Share the Trip</Text>
              <Text style={styles.valuePropDesc}>
                Split costs, share rides, and explore together.
              </Text>
            </View>
          </View>
        </View>

        {/* Big Activation CTA Button */}
        <TouchableOpacity
          style={styles.heroActionBtn}
          activeOpacity={0.9}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPlanTripPress();
          }}
        >
          <View style={styles.heroActionContent}>
            <Plus size={18} color={theme.colors.white} strokeWidth={2.5} />
            <Text style={styles.heroActionBtnText}>Create Travel Plan</Text>
          </View>
          <ArrowRight size={17} color={theme.colors.primaryLight} strokeWidth={2.2} />
        </TouchableOpacity>

        {/* Secondary Gentle Discovery Link */}
        <TouchableOpacity
          style={styles.exploreLinkBtn}
          activeOpacity={0.75}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onExplorePress();
          }}
        >
          <Text style={styles.exploreLinkText}>
            Explore Destinations
          </Text>
          <ArrowRight size={13} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },

  // -------------------------------------------------------------
  // Scenario 1: Active Trip Styles
  // -------------------------------------------------------------
  activeTripCard: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -50,
    left: 20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  tripInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tripIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  tripTextCol: {
    flex: 1,
  },
  tripDestination: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.white,
    letterSpacing: -0.3,
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
  bodyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sparkleCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 24,
    marginBottom: 8,
  },
  persuasiveText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  tipsList: {
    gap: 12,
    marginBottom: 20,
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  tipDesc: {
    fontSize: 11.5,
    color: theme.colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  actionCol: {
    gap: 10,
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onPrimary,
    letterSpacing: 0.1,
  },
  secondaryBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: 11,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  proTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.accentGoldLight,
    padding: 12,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  proTipEmoji: {
    fontSize: 14,
  },
  proTipText: {
    flex: 1,
    fontSize: 11.5,
    color: theme.colors.textPrimary,
    lineHeight: 16,
  },
  proTipBold: {
    fontWeight: '700',
  },

  // -------------------------------------------------------------
  // Scenario 2: Activation (No Active Trip) Styles
  // -------------------------------------------------------------
  activationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  activationGlowOne: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.primaryMist,
  },
  activationGlowTwo: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  heroIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primaryBorder,
    marginBottom: 16,
    position: 'relative',
  },
  heroSparkleWrap: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  motivationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryMist,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
    gap: 5,
  },
  motivationPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  activationTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 27,
    marginBottom: 10,
  },
  activationSubtitle: {
    fontSize: 13.5,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  valuePropsContainer: {
    width: '100%',
    gap: 10,
    marginBottom: 22,
  },
  valuePropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  valuePropIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  valuePropEmoji: {
    fontSize: 15,
  },
  valuePropTextCol: {
    flex: 1,
  },
  valuePropHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  valuePropDesc: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 15,
    marginTop: 1,
  },
  heroActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 18,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12,
  },
  heroActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroActionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onPrimary,
    letterSpacing: 0.2,
  },
  exploreLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  exploreLinkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});
