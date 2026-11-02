import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { UserProfileData, ProfileVariant } from '../types';
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Sparkles,
  MessageSquare,
  UserPlus,
  Check,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../../config/theme';
import { formatDistanceKm } from '../../../utils/formatters';

interface ProfileHeroProps {
  user: UserProfileData;
  variant?: ProfileVariant;
  matchScore?: number | null;
  distanceKm?: number;
  connectionStatus?: 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
  isOwnProfile?: boolean;
  onBackPress?: () => void;
  onConnectPress?: () => void;
  onAcceptPress?: () => void;
  onMessagePress?: () => void;
  onEditPress?: () => void;
  onAvatarPress?: () => void;
  onCoverPress?: () => void;
}

const formatMemberDate = (dateVal?: string | Date) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

export const ProfileHero: React.FC<ProfileHeroProps> = ({
  user,
  matchScore,
  distanceKm,
  connectionStatus = 'NONE',
  isOwnProfile = false,
  onBackPress,
  onConnectPress,
  onAcceptPress,
  onMessagePress,
  onEditPress,
  onAvatarPress,
  onCoverPress,
}) => {
  const locationString = [user.city, user.state, user.country]
    .filter(Boolean)
    .join(', ');

  const memberSince = formatMemberDate(user.createdAt);

  return (
    <View className="w-full bg-background">
      {/* Cover Image Banner */}
      <TouchableOpacity
        activeOpacity={isOwnProfile ? 0.85 : 1}
        onPress={isOwnProfile ? onCoverPress : undefined}
        className="w-full h-[220px] bg-primary-dark relative"
      >
        {user.coverUrl ? (
          <Image
            source={{ uri: user.coverUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full bg-primary-dark">
            <View className="absolute inset-0 bg-primary-dark opacity-80" />
          </View>
        )}
        <View className="absolute inset-0 bg-black/40" />

        {/* Back Button (Only for public profiles) */}
        {onBackPress && (
          <TouchableOpacity
            className="absolute w-[38px] h-[38px] rounded-full bg-black/40 items-center justify-center z-10 border border-white/20"
            style={{ top: Platform.OS === 'ios' ? 52 : 36, left: 20 }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBackPress();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={22} color={theme.colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Top Right Badges */}
        <View
          className="absolute flex-row items-center gap-2 z-10"
          style={{ top: Platform.OS === 'ios' ? 52 : 36, right: 20 }}
        >
          {distanceKm !== undefined && (
            <View className="flex-row items-center gap-1 bg-black/40 px-2.5 py-[5px] rounded-[14px] border border-white/20">
              <MapPin size={11} color={theme.colors.white} />
              <Text className="text-white text-[11px] font-bold">
                {formatDistanceKm(distanceKm)}
              </Text>
            </View>
          )}

          {user.isTraveling && (
            <View className="flex-row items-center gap-[5px] bg-black/40 px-2.5 py-[5px] rounded-[14px] border border-primary-border">
              <View className="w-1.5 h-1.5 rounded-full bg-success" />
              <Text className="text-white text-[11px] font-bold tracking-[0.3px]">Traveling Now</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Profile Overlapping Card */}
      <View className="bg-surface rounded-t-[32px] -mt-8 px-5 pb-5">
        {/* Floating Avatar */}
        <View className="flex-row justify-between items-end -mt-[45px] mb-3">
          <TouchableOpacity
            activeOpacity={isOwnProfile ? 0.85 : 1}
            onPress={isOwnProfile ? onAvatarPress : undefined}
            className="w-[90px] h-[90px] rounded-full border-4 border-surface bg-surface-subtle items-center justify-center relative"
          >
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} className="w-full h-full rounded-full" />
            ) : (
              <View className="w-full h-full rounded-full bg-primary items-center justify-center">
                <Text className="text-[34px] font-bold text-white">
                  {user.fullName?.charAt(0)?.toUpperCase() || 'V'}
                </Text>
              </View>
            )}

            {isOwnProfile && (
              <View className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-primary border-2 border-surface items-center justify-center">
                <Text className="text-xs">📷</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Quick Match / Status Pill */}
          {matchScore !== undefined && matchScore !== null ? (
            <View className="flex-row items-center gap-1.5 bg-primary-mist px-3 py-1.5 rounded-full border border-primary-border mb-1">
              <Sparkles size={13} color={theme.colors.primary} />
              <Text className="text-primary text-xs font-semibold tracking-[0.3px]">{matchScore}% Match</Text>
            </View>
          ) : null}
        </View>

        {/* User Details */}
        <View className="mb-4">
          <View className="flex-row items-center mb-1.5">
            <Text className="text-2xl font-bold text-text-primary tracking-[-0.4px]" numberOfLines={1}>
              {user.fullName}
            </Text>
          </View>

          {/* Location & Member Since */}
          <View className="flex-row flex-wrap items-center gap-3">
            {locationString ? (
              <View className="flex-row items-center gap-1">
                <MapPin size={13} color={theme.colors.primary} />
                <Text className="text-[13px] font-semibold text-primary" numberOfLines={1}>
                  {locationString}
                </Text>
              </View>
            ) : null}

            {memberSince ? (
              <View className="flex-row items-center gap-1">
                <Calendar size={13} color={theme.colors.textSecondary} />
                <Text className="text-xs font-medium text-text-secondary">Member since {memberSince}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Action Buttons Bar */}
        <View className="flex-row items-center gap-2.5 mt-1">
          {isOwnProfile ? (
            <TouchableOpacity
              className="flex-1 h-11 rounded-[14px] bg-primary items-center justify-center"
              onPress={onEditPress}
              activeOpacity={0.8}
            >
              <Text className="text-sm font-bold text-white">Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <>
              {/* Message Button */}
              <TouchableOpacity
                className="flex-1 h-11 rounded-[14px] bg-primary-mist border border-primary-border flex-row items-center justify-center gap-1.5"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onMessagePress?.();
                }}
                activeOpacity={0.8}
              >
                <MessageSquare size={16} color={theme.colors.primary} />
                <Text className="text-sm font-bold text-primary">Message</Text>
              </TouchableOpacity>

              {/* Dynamic Connection Button */}
              {connectionStatus === 'CONNECTED' ? (
                <View className="flex-[1.3] h-11 rounded-[14px] bg-primary-mist border border-primary-border flex-row items-center justify-center gap-1.5">
                  <Check size={14} color={theme.colors.primary} strokeWidth={2.5} />
                  <Text className="text-sm font-bold text-primary">Connected</Text>
                </View>
              ) : connectionStatus === 'REQUEST_RECEIVED' ? (
                <TouchableOpacity
                  className="flex-[1.3] h-11 rounded-[14px] bg-primary flex-row items-center justify-center gap-1.5"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onAcceptPress?.();
                  }}
                  activeOpacity={0.8}
                >
                  <Check size={16} color={theme.colors.white} strokeWidth={2.5} />
                  <Text className="text-sm font-bold text-white">Accept Request</Text>
                </TouchableOpacity>
              ) : connectionStatus === 'REQUEST_SENT' ? (
                <View className="flex-[1.3] h-11 rounded-[14px] bg-surface-subtle flex-row items-center justify-center gap-1.5">
                  <Clock size={14} color={theme.colors.textSecondary} />
                  <Text className="text-[13px] font-semibold text-text-secondary">Request Sent</Text>
                </View>
              ) : (
                <TouchableOpacity
                  className="flex-[1.3] h-11 rounded-[14px] bg-primary flex-row items-center justify-center gap-1.5"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onConnectPress?.();
                  }}
                  activeOpacity={0.8}
                >
                  <UserPlus size={16} color={theme.colors.white} />
                  <Text className="text-sm font-bold text-white">Connect</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
};
