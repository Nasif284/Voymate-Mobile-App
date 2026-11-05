import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../../config/theme';
import { Compass, MapPin, Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { cn } from '../../../utils/cn';
import { useUnreadNotificationCount } from '../../notifications/hooks/useNotifications';

interface HomeHeaderProps {
  userName: string;
  avatarUrl?: string | null;
  location?: string | null;
  isLocating?: boolean;
  locationPermissionDenied?: boolean;
  onEnableLocationPress?: () => void;
  isTraveling: boolean;
  onToggleTraveling: () => void;
  isUpdatingStatus?: boolean;
  onAvatarPress?: () => void;
  onNotificationsPress?: () => void;
}

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userName,
  avatarUrl,
  location,
  isLocating,
  locationPermissionDenied,
  onEnableLocationPress,
  isTraveling,
  onToggleTraveling,
  isUpdatingStatus,
  onAvatarPress,
  onNotificationsPress,
}) => {
  const firstName = userName ? userName.split(' ')[0] : 'Traveler';
  const greeting = getTimeGreeting();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const handleToggle = () => {
    if (isUpdatingStatus) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleTraveling();
  };

  return (
    <View className="px-5 pt-2 pb-3.5">
      <View className="flex-row justify-between items-center">
        {/* Left: Greeting & Name */}
        <View className="flex-1 pr-3">
          <Text className="text-xs font-medium text-text-muted capitalize tracking-wide">
            {greeting},
          </Text>
          <Text className="text-[22px] font-semibold text-text-primary mt-0.5 tracking-tight" numberOfLines={1}>
            {firstName} 👋
          </Text>
          {isTraveling && (
            <>
              {location ? (
                <View className="flex-row items-center bg-surface-subtle self-start px-2 py-1 rounded-[10px] mt-1.5 gap-1">
                  <MapPin size={10} color={theme.colors.primary} />
                  <Text className="text-[11px] font-medium text-text-secondary" numberOfLines={1}>
                    {location}
                  </Text>
                </View>
              ) : isLocating ? (
                <View className="flex-row items-center bg-surface-subtle self-start px-2 py-1 rounded-[10px] mt-1.5 gap-1.5">
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                    style={{ transform: [{ scale: 0.55 }], width: 10, height: 10 }}
                  />
                  <Text className="text-[11px] font-medium text-text-muted" numberOfLines={1}>
                    Locating...
                  </Text>
                </View>
              ) : locationPermissionDenied ? (
                <TouchableOpacity
                  className="flex-row items-center bg-surface border border-primary self-start px-2 py-1 rounded-[10px] mt-1.5 gap-1"
                  onPress={onEnableLocationPress}
                  activeOpacity={0.7}
                >
                  <MapPin size={10} color={theme.colors.primary} />
                  <Text className="text-[11px] font-semibold text-primary" numberOfLines={1}>
                    Enable location
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>

        {/* Right: Traveling Toggle Button & User Avatar */}
        <View className="flex-row items-center gap-2.5">
          <TouchableOpacity
            className={cn(
              'flex-row items-center py-[7px] px-[11px] rounded-full border gap-1.5',
              isTraveling ? 'bg-surface border-primary' : 'bg-surface border-border'
            )}
            onPress={handleToggle}
            activeOpacity={0.7}
            disabled={isUpdatingStatus}
            hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
            accessibilityRole="switch"
            accessibilityState={{ checked: isTraveling, busy: isUpdatingStatus }}
            accessibilityLabel={`Traveling status: currently ${isTraveling ? 'traveling' : 'at home'}. Tap to toggle.`}
          >
            {isUpdatingStatus ? (
              <ActivityIndicator
                size="small"
                color={isTraveling ? theme.colors.primary : theme.colors.textMuted}
                style={{ transform: [{ scale: 0.7 }] }}
              />
            ) : (
              <>
                <View className={cn(
                  'w-[7px] h-[7px] rounded-full',
                  isTraveling ? 'bg-success shadow-sm' : 'bg-surface-dim'
                )} />
                <Text
                  className={cn(
                    'text-[11px] font-semibold',
                    isTraveling ? 'text-primary' : 'text-text-secondary'
                  )}
                >
                  {isTraveling ? 'Traveling' : 'At Home'}
                </Text>
                <Compass
                  size={12}
                  color={isTraveling ? theme.colors.primary : theme.colors.textMuted}
                />
              </>
            )}
          </TouchableOpacity>

          {/* Notifications Bell */}
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center relative"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onNotificationsPress?.();
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Bell size={18} color={theme.colors.textPrimary} />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-primary min-w-[18px] h-[18px] rounded-full items-center justify-center px-1 border-2 border-surface">
                <Text className="text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* User Avatar */}
          <TouchableOpacity
            className="relative"
            onPress={onAvatarPress}
            activeOpacity={onAvatarPress ? 0.8 : 1}
            disabled={!onAvatarPress}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="w-11 h-11 rounded-full border-2 border-surface bg-surface-subtle"
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            ) : (
              <View className="w-11 h-11 rounded-full bg-primary items-center justify-center border-2 border-surface">
                <Text className="text-base font-semibold text-white">
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isTraveling && (
              <View className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-surface" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
