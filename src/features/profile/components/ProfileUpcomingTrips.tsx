import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Compass, Calendar, MapPin } from 'lucide-react-native';
import { theme } from '../../../config/theme';
import { ProfileUpcomingTrip } from '../types';

interface ProfileUpcomingTripsProps {
  trips: ProfileUpcomingTrip[];
  onTripPress?: (trip: ProfileUpcomingTrip) => void;
  onSeeAll?: () => void;
}

const formatDate = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
};

const formatYear = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.getFullYear().toString();
  } catch {
    return '';
  }
};

export const ProfileUpcomingTrips: React.FC<ProfileUpcomingTripsProps> = ({
  trips = [],
  onTripPress,
  onSeeAll,
}) => {
  if ((!trips || trips.length === 0) && !onSeeAll) return null;

  return (
    <View className="bg-surface rounded-[24px] py-[18px] mx-4 mt-3.5 border border-border">
      <View className="flex-row items-center justify-between px-5 mb-3.5">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-full bg-surface-subtle items-center justify-center">
            <Compass size={16} color={theme.colors.primary} />
          </View>
          <Text className="text-base font-bold text-text-primary tracking-[-0.2px]">Upcoming Travel Plans</Text>
        </View>
        <View className="flex-row items-center gap-2.5">
          <View className="bg-surface border border-primary px-2 py-[3px] rounded-[10px]">
            <Text className="text-[11px] font-semibold text-primary">{trips.length}</Text>
          </View>
          {onSeeAll && (
            <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text className="text-[13px] font-semibold text-primary">See all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {trips.length === 0 ? (
        <TouchableOpacity className="mx-4 p-3.5 rounded-[14px] bg-surface-subtle border border-border gap-1.5" onPress={onSeeAll} activeOpacity={0.8}>
          <Text className="text-[13px] text-text-secondary leading-[19px]">No upcoming trips yet. Add a trip to start getting matched.</Text>
          <Text className="text-xs font-semibold text-primary mt-0.5">Create Trip Plan →</Text>
        </TouchableOpacity>
      ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {trips.map((trip) => {
          const dateFromStr = formatDate(trip.dateFrom);
          const dateToStr = formatDate(trip.dateTo);
          const year = formatYear(trip.dateTo);
          const dateRange =
            dateFromStr && dateToStr
              ? `${dateFromStr} - ${dateToStr}, ${year}`
              : dateFromStr || '';

          const destinationName =
            trip.destination?.city && trip.destination?.country
              ? `${trip.destination.city}, ${trip.destination.country}`
              : trip.destination?.name || 'Explore Trip';

          return (
            <TouchableOpacity
              key={trip.id}
              className="w-[210px] bg-surface-subtle rounded-[18px] overflow-hidden border border-border"
              activeOpacity={0.85}
              onPress={() => onTripPress?.(trip)}
            >
              {/* Trip Image Banner */}
              <View className="w-full h-[100px] relative bg-primary-dark">
                {trip.destination?.coverUrl ? (
                  <Image
                    source={{ uri: trip.destination.coverUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-primary-dark" />
                )}
                <View className="absolute inset-0 bg-black/30" />
                <View className="absolute bottom-2 left-2 right-2 flex-row items-center gap-1">
                  <MapPin size={10} color={theme.colors.white} />
                  <Text className="text-[11px] font-semibold text-white" numberOfLines={1}>
                    {destinationName}
                  </Text>
                </View>
              </View>

              {/* Trip Info */}
              <View className="p-3 gap-1.5">
                <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
                  {trip.name}
                </Text>

                {dateRange ? (
                  <View className="flex-row items-center gap-1.5">
                    <Calendar size={12} color={theme.colors.primary} />
                    <Text className="text-[11px] font-semibold text-text-secondary" numberOfLines={1}>
                      {dateRange}
                    </Text>
                  </View>
                ) : null}

                {trip.travelStyle ? (
                  <View className="self-start bg-surface border border-primary px-2 py-0.5 rounded-lg mt-0.5">
                    <Text className="text-[10px] font-bold text-primary">
                      {trip.travelStyle}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      )}
    </View>
  );
};
