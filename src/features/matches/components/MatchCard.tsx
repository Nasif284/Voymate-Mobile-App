import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../../config/theme';
import { TripMatchItem } from '../types';
import { formatTravelerLocation } from '../../../utils/locationFormat';
import { useViewerCountry } from '../../profile/hooks/profile.hooks';
import {
  Calendar,
  Luggage,
  MapPin,
  UserPlus,
  Check,
  MessageSquare,
  Sparkles,
  Compass,
} from 'lucide-react-native';

export type MatchCardBadgeMode =
  | 'STRICT_MATCH'
  | 'LOCATION_DISCOVERY'
  | 'CATEGORY_BROWSING';

interface MatchCardProps {
  match: TripMatchItem;
  connectionStatus: 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
  onPress?: (match: TripMatchItem) => void;
  onConnectPress: (match: TripMatchItem) => void;
  onAcceptPress?: (match: TripMatchItem) => void;
  onMessagePress?: (match: TripMatchItem) => void;
  badgeMode?: MatchCardBadgeMode;
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

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  connectionStatus,
  onPress,
  onConnectPress,
  onAcceptPress,
  onMessagePress,
  badgeMode = 'STRICT_MATCH',
}) => {
  const { user, tripMatch } = match;
  const viewerCountry = useViewerCountry();

  const dateFrom = tripMatch.dateFrom ? formatDate(tripMatch.dateFrom) : '';
  const dateTo = tripMatch.dateTo ? formatDate(tripMatch.dateTo) : '';
  const dateRangeStr = dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : '';

  const matchScore = tripMatch.totalPoints;
  const destination = tripMatch.destination;

  return (
    <TouchableOpacity
      className="bg-surface rounded-3xl border border-border mb-5 overflow-hidden shadow-subtle"
      activeOpacity={0.93}
      onPress={() => onPress?.(match)}
      disabled={!onPress}
    >
      {/* Cover Image Banner */}
      <View className="h-[120px] w-full relative bg-primary-dark">
        {user.coverUrl ? (
          <Image
            source={{ uri: user.coverUrl }}
            className="w-full h-full"
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={`cover_${user.id}`}
            transition={150}
          />
        ) : (
          <View className="w-full h-full bg-primary-dark" />
        )}

        {/* Date Range Badge */}
        {dateRangeStr ? (
          <View className="absolute top-3 left-3 flex-row items-center bg-black/60 px-2.5 py-1 rounded-full gap-1">
            <Calendar size={11} color={theme.colors.white} />
            <Text className="text-white text-[10px] font-semibold">{dateRangeStr}</Text>
          </View>
        ) : null}

        {/* Adaptive Compatibility / Category Badge */}
        {badgeMode === 'STRICT_MATCH' && matchScore != null && (
          <View className="absolute top-3 right-3 flex-row items-center bg-primary px-2.5 py-1 rounded-full gap-1 shadow-card">
            <Sparkles size={11} color={theme.colors.white} />
            <Text className="text-white text-[11px] font-semibold">{matchScore}% Match</Text>
          </View>
        )}

        {badgeMode === 'LOCATION_DISCOVERY' && (
          <View className="absolute top-3 right-3 flex-row items-center bg-black/65 px-2.5 py-1 rounded-full gap-1 border border-white/20">
            <Sparkles size={11} color={theme.colors.primary} />
            <Text className="text-white text-[11px] font-semibold">
              {matchScore != null && matchScore >= 75 ? 'High Vibe' : 'Compatible Vibe'}
            </Text>
          </View>
        )}

        {badgeMode === 'CATEGORY_BROWSING' && (
          <View className="absolute top-3 right-3 flex-row items-center bg-black/65 px-2.5 py-1 rounded-full gap-1 border border-white/20">
            <Compass size={11} color={theme.colors.primary} />
            <Text className="text-white text-[11px] font-semibold capitalize">
              {user.travelType || 'Traveler'}
            </Text>
          </View>
        )}
      </View>

      {/* Floating Avatar */}
      <View className="absolute top-[90px] left-5 z-10">
        {user.avatarUrl ? (
          <Image
            source={{ uri: user.avatarUrl }}
            className="w-[60px] h-[60px] rounded-full border-[3px] border-surface bg-surface-subtle"
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={`avatar_${user.id}`}
            transition={150}
          />
        ) : (
          <View className="w-[60px] h-[60px] rounded-full bg-primary items-center justify-center border-[3px] border-surface">
            <Text className="text-white text-[22px] font-semibold">
              {user.fullName?.charAt(0) || 'T'}
            </Text>
          </View>
        )}
      </View>

      {/* Card Body */}
      <View className="pt-9 px-5 pb-5">
        {/* Name & Origin */}
        <View>
          <Text className="text-lg font-semibold text-text-primary tracking-tight" numberOfLines={1}>
            {user.fullName}
          </Text>

          <View className="flex-row items-center gap-1 mt-0.5">
            <MapPin size={12} color={theme.colors.textMuted} />
            <Text className="text-xs text-text-muted" numberOfLines={1}>
              {formatTravelerLocation(
                { city: user.city, state: user.state, country: user.country },
                viewerCountry
              )}
            </Text>
          </View>
        </View>

        {/* Destination Box with Equal Spacing */}
        {destination ? (
          <View className="flex-row items-center bg-surface-subtle py-2.5 px-3 rounded-2xl my-3.5 gap-2.5">
            <View className="w-8 h-8 rounded-full bg-surface items-center justify-center shadow-subtle">
              <Luggage size={14} color={theme.colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                Overlapping destination
              </Text>
              <Text className="text-sm font-semibold text-text-primary mt-0.5" numberOfLines={1}>
                {destination}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Bio Snippet if available */}
        {user.bio ? (
          <Text className="text-xs text-text-secondary italic leading-[17px] mb-3" numberOfLines={2}>
            "{user.bio}"
          </Text>
        ) : null}

        {/* Interests Chips */}
        {user.interests && user.interests.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mb-3.5">
            {user.interests.slice(0, 3).map((item, idx) => (
              <View key={idx} className="bg-surface-subtle px-2.5 py-1 rounded-lg">
                <Text className="text-[11px] text-text-secondary font-medium">{item}</Text>
              </View>
            ))}
            {user.interests.length > 3 && (
              <View className="bg-surface-subtle px-2 py-1 rounded-lg">
                <Text className="text-[11px] text-text-muted font-semibold">
                  +{user.interests.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Button */}
        <View className="mt-1">
          {connectionStatus === 'CONNECTED' ? (
            <TouchableOpacity
              className="flex-row items-center justify-center py-3 rounded-2xl gap-1.5 bg-primary-dark"
              onPress={() => onMessagePress?.(match)}
              activeOpacity={0.85}
            >
              <MessageSquare size={15} color={theme.colors.white} />
              <Text className="text-[13px] font-semibold text-white">Message Mate</Text>
            </TouchableOpacity>
          ) : connectionStatus === 'REQUEST_RECEIVED' ? (
            <TouchableOpacity
              className="flex-row items-center justify-center py-3 rounded-2xl gap-1.5 bg-primary shadow-subtle"
              onPress={() => onAcceptPress?.(match)}
              activeOpacity={0.85}
            >
              <Check size={15} color={theme.colors.white} />
              <Text className="text-[13px] font-semibold text-white">Accept Request</Text>
            </TouchableOpacity>
          ) : connectionStatus === 'REQUEST_SENT' ? (
            <View className="flex-row items-center justify-center py-3 rounded-2xl gap-1.5 bg-surface-subtle">
              <Text className="text-[13px] font-semibold text-text-muted">Request Sent</Text>
            </View>
          ) : (
            <TouchableOpacity
              className="flex-row items-center justify-center py-3 rounded-2xl gap-1.5 bg-primary shadow-card"
              onPress={() => onConnectPress(match)}
              activeOpacity={0.85}
            >
              <UserPlus size={15} color={theme.colors.white} />
              <Text className="text-[13px] font-semibold text-white">Connect</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
