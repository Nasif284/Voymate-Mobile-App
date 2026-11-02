import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { theme } from '../../../config/theme';
import { ActiveTrip } from '../types';
import { Luggage, Calendar, Sparkles, ChevronDown } from 'lucide-react-native';

interface ActiveTripCapsuleProps {
  trip: ActiveTrip;
  matchCount?: number;
  onChangeTrip?: () => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const ActiveTripCapsule: React.FC<ActiveTripCapsuleProps> = ({
  trip,
  matchCount,
  onChangeTrip,
}) => {
  const dates =
    trip.dateFrom && trip.dateTo
      ? `${formatDate(trip.dateFrom)} - ${formatDate(trip.dateTo)}`
      : '';

  const destinationName =
    trip.destination?.name ||
    trip.destination?.city ||
    trip.name ||
    'Upcoming Journey';

  return (
    <View className="bg-surface-subtle rounded-2xl border border-border p-4 mb-5 shadow-subtle">
      <View className="flex-row justify-between items-center mb-2.5">
        <View className="flex-row items-center gap-1.5">
          <Sparkles size={12} color={theme.colors.primary} />
          <Text className="text-[11px] font-semibold text-primary uppercase tracking-wider">
            Matching For Trip
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {matchCount !== undefined && matchCount > 0 && (
            <View className="bg-surface px-2 py-0.5 rounded-lg border border-border">
              <Text className="text-[10px] font-semibold text-primary">{matchCount} matches</Text>
            </View>
          )}

          {onChangeTrip && (
            <TouchableOpacity
              className="flex-row items-center bg-surface py-1 px-2 rounded-lg border border-border gap-0.5"
              onPress={onChangeTrip}
              activeOpacity={0.8}
            >
              <Text className="text-[11px] font-semibold text-primary">Switch</Text>
              <ChevronDown size={12} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <View className="w-9 h-9 rounded-xl bg-surface items-center justify-center border border-border shadow-subtle">
          <Luggage size={16} color={theme.colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-text-primary tracking-tight" numberOfLines={1}>
            {destinationName}
          </Text>
          {dates ? (
            <View className="flex-row items-center gap-1 mt-0.5">
              <Calendar size={11} color={theme.colors.textMuted} />
              <Text className="text-[11px] text-text-muted">{dates}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};
