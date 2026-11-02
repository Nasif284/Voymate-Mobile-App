import React from 'react';
import { View, Text, Image } from 'react-native';
import { MapPin, Calendar, Compass, Wallet } from 'lucide-react-native';
import { theme } from '../../../config/theme';

interface MatchedTripCardProps {
  trip: {
    id: string;
    name: string;
    dateFrom: string | Date;
    dateTo: string | Date;
    destination: {
      name: string;
      coverUrl?: string | null;
      city?: string | null;
      country?: string | null;
    };
    budgetStyle?: string;
    travelStyle?: string;
  };
}

const formatDate = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

export const MatchedTripCard: React.FC<MatchedTripCardProps> = ({ trip }) => {
  const dateFromStr = formatDate(trip.dateFrom);
  const dateToStr = formatDate(trip.dateTo);
  const dateRangeStr =
    dateFromStr && dateToStr ? `${dateFromStr} - ${dateToStr}` : dateFromStr || '';

  const destinationDisplay =
    trip.destination?.city && trip.destination?.country
      ? `${trip.destination.city}, ${trip.destination.country}`
      : trip.destination?.name || 'Destination';

  return (
    <View className="bg-surface rounded-[24px] mx-4 mt-3.5 overflow-hidden border border-border shadow-sm">
      {/* Header */}
      <View className="flex-row items-center gap-2 px-[18px] py-3.5 border-b border-border">
        <View className="w-7 h-7 rounded-full bg-primary-mist items-center justify-center">
          <MapPin size={16} color={theme.colors.primary} />
        </View>
        <Text className="text-base font-bold text-text-primary tracking-[-0.2px]">Matched Trip Plan</Text>
      </View>

      {/* Trip Cover Banner */}
      <View className="w-full h-[140px] relative bg-primary-dark">
        {trip.destination?.coverUrl ? (
          <Image
            source={{ uri: trip.destination.coverUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-primary-dark" />
        )}
        <View className="absolute inset-0 bg-black/35" />
        <View className="absolute bottom-3 left-4 right-4">
          <Text className="text-lg font-bold text-white tracking-[-0.2px]" numberOfLines={1}>
            {trip.name}
          </Text>
          <Text className="text-xs font-semibold text-white/90 mt-0.5" numberOfLines={1}>
            {destinationDisplay}
          </Text>
        </View>
      </View>

      {/* Info Tiles Grid */}
      <View className="p-4 gap-2.5">
        {dateRangeStr ? (
          <View className="flex-row items-center gap-3 bg-surface-subtle px-3.5 py-2.5 rounded-[14px] border border-border">
            <View className="w-8 h-8 rounded-[10px] bg-primary-mist items-center justify-center">
              <Calendar size={14} color={theme.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-[9px] font-semibold text-text-secondary tracking-[0.6px]">TRAVEL DATES</Text>
              <Text className="text-[13px] font-semibold text-text-primary mt-0.5" numberOfLines={1}>
                {dateRangeStr}
              </Text>
            </View>
          </View>
        ) : null}

        {trip.travelStyle ? (
          <View className="flex-row items-center gap-3 bg-surface-subtle px-3.5 py-2.5 rounded-[14px] border border-border">
            <View className="w-8 h-8 rounded-[10px] bg-primary-mist items-center justify-center">
              <Compass size={14} color={theme.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-[9px] font-semibold text-text-secondary tracking-[0.6px]">TRAVEL STYLE</Text>
              <Text className="text-[13px] font-semibold text-text-primary mt-0.5" numberOfLines={1}>
                {trip.travelStyle}
              </Text>
            </View>
          </View>
        ) : null}

        {trip.budgetStyle ? (
          <View className="flex-row items-center gap-3 bg-surface-subtle px-3.5 py-2.5 rounded-[14px] border border-border">
            <View className="w-8 h-8 rounded-[10px] bg-primary-mist items-center justify-center">
              <Wallet size={14} color={theme.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-[9px] font-semibold text-text-secondary tracking-[0.6px]">BUDGET STYLE</Text>
              <Text className="text-[13px] font-semibold text-text-primary mt-0.5" numberOfLines={1}>
                {trip.budgetStyle}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
};
