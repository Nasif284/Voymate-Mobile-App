import React from 'react';
import {
  View,
  Text,
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
      <View className="px-5 pt-1 pb-6">
        {/* Active Journey Radar Card */}
        <View className="bg-text-primary rounded-3xl p-5 mb-3.5 relative overflow-hidden shadow-floating">
          {/* Ambient Lighting Accents */}
          <View className="absolute -top-10 -right-7 w-36 h-36 rounded-full bg-white/10" />
          <View className="absolute -bottom-12 left-5 w-28 h-28 rounded-full bg-white/5" />

          {/* Destination & Meta */}
          <View className="flex-row items-center gap-3.5">
            <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center border border-white/20">
              <MapPin size={22} color={theme.colors.primaryLight} />
            </View>
            <View className="flex-1">
              <Text className="text-[19px] font-semibold text-white tracking-tight" numberOfLines={1}>
                {destinationTitle}
              </Text>
              <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
                <View className="flex-row items-center bg-white/10 px-2 py-1 rounded-lg gap-1">
                  <Calendar size={11} color={theme.colors.primaryLight} />
                  <Text className="text-[11px] font-semibold text-primary-light">
                    {formatDateRange(activeTrip.dateFrom, activeTrip.dateTo)}
                  </Text>
                </View>
                {activeTrip.travelStyle && (
                  <View className="flex-row items-center bg-white/10 px-2 py-1 rounded-lg gap-1">
                    <Flame size={11} color={theme.colors.primaryLight} />
                    <Text className="text-[11px] font-semibold text-primary-light">
                      {activeTrip.travelStyle}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Psychological Reassurance Body */}
        <View className="bg-surface rounded-3xl p-5 border border-border shadow-subtle">
          <View className="flex-row items-center gap-2 mb-2.5">
            <View className="w-7 h-7 rounded-full bg-primary-mist items-center justify-center">
              <Sparkles size={16} color={theme.colors.primary} />
            </View>
            <Text className="text-[11px] font-semibold text-primary tracking-wider uppercase">
              TRIP ACTIVE
            </Text>
          </View>

          <Text className="text-lg font-semibold text-text-primary tracking-tight leading-6 mb-2">
            Looking for travel mates for {destinationTitle}
          </Text>

          <Text className="text-[13px] text-text-secondary leading-5 mb-4">
            Your trip is live. New travelers add trips every day—check your trip matches or browse other destinations while we find people heading to {destinationTitle}.
          </Text>

          {/* Value Highlights */}
          <View className="gap-3 mb-5 bg-surface-subtle p-3.5 rounded-2xl border border-border">
            <View className="flex-row items-start gap-2.5">
              <View className="w-7 h-7 rounded-lg bg-surface items-center justify-center mt-0.5">
                <Users size={14} color={theme.colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-text-primary">Smart Destination Matches</Text>
                <Text className="text-[11.5px] text-text-muted leading-4 mt-0.5">
                  We match you with travelers visiting {destinationTitle} on overlapping dates.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-2.5">
              <View className="w-7 h-7 rounded-lg bg-surface items-center justify-center mt-0.5">
                <ShieldCheck size={14} color={theme.colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-text-primary">Direct Trip Planning</Text>
                <Text className="text-[11.5px] text-text-muted leading-4 mt-0.5">
                  Chat directly before your trip to coordinate transport, stays, and activities.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-2.5 mb-4">
            <TouchableOpacity
              className="flex-row items-center justify-center bg-primary py-3.5 px-5 rounded-2xl gap-2 shadow-card"
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onViewMatchesPress();
              }}
            >
              <Users size={17} color={theme.colors.white} strokeWidth={2.2} />
              <Text className="text-sm font-semibold text-white tracking-wide">View Trip Matches</Text>
              <ArrowRight size={16} color={theme.colors.white} />
            </TouchableOpacity>

            <View className="flex-row gap-2.5">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center bg-surface-subtle py-3 rounded-xl gap-1.5 border border-border"
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onViewTripsPress();
                }}
              >
                <Calendar size={14} color={theme.colors.primary} />
                <Text className="text-[12.5px] font-semibold text-text-primary">My Trips</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center bg-surface-subtle py-3 rounded-xl gap-1.5 border border-border"
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onPlanTripPress();
                }}
              >
                <Plus size={14} color={theme.colors.primary} />
                <Text className="text-[12.5px] font-semibold text-text-primary">Add Another Trip</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Retention Micro-Tip */}
          <View className="flex-row items-start bg-accent-goldLight p-3 rounded-xl gap-2 border border-accent-gold/25">
            <Text className="text-sm">💡</Text>
            <Text className="flex-1 text-[11.5px] text-text-primary leading-4">
              <Text className="font-semibold">Tip: </Text>
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
    <View className="px-5 pt-1 pb-6">
      <View className="bg-surface rounded-3xl p-6 items-center border border-border relative overflow-hidden shadow-subtle">
        {/* Soft Background Geometry */}
        <View className="absolute -top-12 -right-10 w-40 h-40 rounded-full bg-primary-mist" />
        <View className="absolute -bottom-14 -left-10 w-36 h-36 rounded-full bg-surface-subtle" />

        {/* Hero Visual Icon Badge */}
        <View className="w-[72px] h-[72px] rounded-full bg-primary-mist items-center justify-center border border-primary/20 mb-4 relative">
          <Compass size={32} color={theme.colors.primary} strokeWidth={2.2} />
          <View className="absolute -top-0.5 -right-0.5 w-6 h-6 rounded-full bg-primary-light items-center justify-center border-2 border-surface">
            <Sparkles size={14} color={theme.colors.primaryDark} />
          </View>
        </View>

        {/* Motivational Tag */}
        <View className="flex-row items-center bg-primary-mist px-2.5 py-1.5 rounded-xl mb-3 gap-1">
          <Globe2 size={11} color={theme.colors.primary} />
          <Text className="text-[10.5px] font-semibold text-primary uppercase tracking-wider">
            GET STARTED
          </Text>
        </View>

        {/* Core Psychological Headline */}
        <Text className="text-[21px] font-semibold text-text-primary text-center tracking-tight leading-7 mb-2.5">
          Plan a Trip to Find Travel Mates
        </Text>

        {/* Empathetic & Persuasive Copy */}
        <Text className="text-[13.5px] text-text-secondary text-center leading-5 mb-5 px-1.5">
          Add your destination and travel dates. We will match you with solo travelers going to the same place.
        </Text>

        {/* 3 Core Value Props to Reduce Hesitation */}
        <View className="w-full gap-2.5 mb-5">
          <View className="flex-row items-center bg-surface-subtle py-2.5 px-3.5 rounded-2xl border border-border gap-3">
            <View className="w-8 h-8 rounded-xl bg-surface items-center justify-center border border-border">
              <Text className="text-[15px]">🎯</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-text-primary">Smart Matching</Text>
              <Text className="text-[11px] text-text-muted leading-4 mt-0.5">
                Match by destination, travel dates, and budget.
              </Text>
            </View>
          </View>

          <View className="flex-row items-center bg-surface-subtle py-2.5 px-3.5 rounded-2xl border border-border gap-3">
            <View className="w-8 h-8 rounded-xl bg-surface items-center justify-center border border-border">
              <Text className="text-[15px]">💬</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-text-primary">Chat Before You Go</Text>
              <Text className="text-[11px] text-text-muted leading-4 mt-0.5">
                Message potential travel mates and align plans before your trip.
              </Text>
            </View>
          </View>

          <View className="flex-row items-center bg-surface-subtle py-2.5 px-3.5 rounded-2xl border border-border gap-3">
            <View className="w-8 h-8 rounded-xl bg-surface items-center justify-center border border-border">
              <Text className="text-[15px]">🚗</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-text-primary">Share the Trip</Text>
              <Text className="text-[11px] text-text-muted leading-4 mt-0.5">
                Split costs, share rides, and explore together.
              </Text>
            </View>
          </View>
        </View>

        {/* Big Activation CTA Button */}
        <TouchableOpacity
          className="w-full flex-row items-center justify-between bg-primary py-3.5 px-5 rounded-2xl shadow-card mb-3"
          activeOpacity={0.9}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPlanTripPress();
          }}
        >
          <View className="flex-row items-center gap-2.5">
            <Plus size={18} color={theme.colors.white} strokeWidth={2.5} />
            <Text className="text-[15px] font-semibold text-white tracking-wide">
              Create Travel Plan
            </Text>
          </View>
          <ArrowRight size={17} color={theme.colors.primaryLight} strokeWidth={2.2} />
        </TouchableOpacity>

        {/* Secondary Gentle Discovery Link */}
        <TouchableOpacity
          className="flex-row items-center gap-1.5 py-1.5 px-3"
          activeOpacity={0.75}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onExplorePress();
          }}
        >
          <Text className="text-[12.5px] font-semibold text-primary">
            Explore Destinations
          </Text>
          <ArrowRight size={13} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
