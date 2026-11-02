import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Luggage, Calendar, MessageSquare, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../../config/theme';

interface TripCompanionBannerProps {
  userName: string;
  destination: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  onMessagePress: () => void;
}

const formatDate = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const TripCompanionBanner: React.FC<TripCompanionBannerProps> = ({
  userName,
  destination,
  dateFrom,
  dateTo,
  onMessagePress,
}) => {
  const firstName = userName?.split(' ')[0] || 'Traveler';
  const cleanDestination = destination?.split(',')[0] || destination;

  const dateFromStr = formatDate(dateFrom);
  const dateToStr = formatDate(dateTo);
  const dateRangeStr =
    dateFromStr && dateToStr ? `${dateFromStr} - ${dateToStr}` : dateFromStr || '';

  return (
    <View className="bg-text-primary rounded-[24px] p-5 mx-4 mt-3.5 border border-white/10">
      {/* Decorative accent top bar */}
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-9 h-9 rounded-xl bg-white/10 justify-center items-center border border-white/20">
          <Luggage size={18} color={theme.colors.primary} />
        </View>

        <View className="flex-1 flex-row items-center flex-wrap gap-1.5">
          <View className="bg-primary px-2 py-[3px] rounded-[10px]">
            <Text className="text-white text-[9px] font-semibold tracking-[0.5px]">TRIP COMPANION REQUEST</Text>
          </View>
          {dateRangeStr ? (
            <View className="flex-row items-center gap-1 bg-white/15 px-2 py-[3px] rounded-[10px]">
              <Calendar size={11} color="rgba(255, 255, 255, 0.85)" />
              <Text className="text-white text-[11px] font-semibold">{dateRangeStr}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Main Announcement */}
      <Text className="text-[17px] font-bold text-white leading-[23px] tracking-[-0.2px] mb-1.5">
        {firstName} is looking for mates for an upcoming trip to {cleanDestination}!
      </Text>

      <Text className="text-[13px] text-white/80 leading-[18px] mb-4">
        Would you like to travel together? Coordinate your journey, share itineraries, and explore together.
      </Text>

      {/* Action CTA */}
      <TouchableOpacity
        className="bg-surface h-11 rounded-[14px] flex-row items-center justify-center gap-2"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onMessagePress();
        }}
        activeOpacity={0.85}
      >
        <MessageSquare size={15} color={theme.colors.primary} />
        <Text className="text-primary text-sm font-semibold">Message {firstName} to Join</Text>
        <ArrowRight size={14} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
};
