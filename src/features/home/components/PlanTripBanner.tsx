import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Compass, ArrowRight, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../../config/theme';

interface PlanTripBannerProps {
  onPlanTripPress: () => void;
}

export const PlanTripBanner: React.FC<PlanTripBannerProps> = ({
  onPlanTripPress,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPlanTripPress();
  };

  return (
    <View className="px-5 mb-4">
      <TouchableOpacity
        className="bg-text-primary rounded-[22px] py-3.5 px-4 relative overflow-hidden shadow-floating"
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {/* Subtle Decorative Ambient Rings */}
        <View className="absolute -top-7 -right-5 w-[100px] h-[100px] rounded-full bg-white/10" />
        <View className="absolute -bottom-10 right-10 w-20 h-20 rounded-full bg-white/5" />

        {/* Content Row */}
        <View className="flex-row items-center gap-3">
          {/* Evocative Icon Badge */}
          <View className="w-11 h-11 rounded-2xl bg-white/10 items-center justify-center border border-white/20">
            <Compass size={22} color={theme.colors.primaryLight} strokeWidth={2.2} />
          </View>

          {/* Text Container */}
          <View className="flex-1">
            <View className="flex-row items-center gap-1 mb-0.5">
              <Sparkles size={10} color={theme.colors.primaryLight} />
              <Text className="text-[10px] font-semibold text-primary-light uppercase tracking-wider">
                NO ACTIVE TRIP
              </Text>
            </View>
            <Text className="text-sm font-semibold text-white tracking-tight">Planning a trip?</Text>
            <Text className="text-[11px] text-white/70 mt-0.5 leading-4" numberOfLines={2}>
              Add your destination and dates to match with travel mates
            </Text>
          </View>

          {/* Classy Action Pill */}
          <View className="flex-row items-center bg-white py-2 px-3 rounded-full gap-1">
            <Text className="text-xs font-semibold text-text-primary">Plan Trip</Text>
            <ArrowRight size={13} color={theme.colors.textPrimary} strokeWidth={2.5} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};
