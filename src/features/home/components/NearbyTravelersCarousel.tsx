import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { theme } from '../../../config/theme';
import { UserWithDetails } from '../types';
import { formatDistanceKm } from '../../../utils/formatters';
import { MapPin, UserPlus, Check, MessageSquare } from 'lucide-react-native';

interface NearbyTravelersCarouselProps {
  users: UserWithDetails[];
  onConnectPress: (user: UserWithDetails) => void;
  onAcceptPress?: (user: UserWithDetails) => void;
  onMessagePress?: (user: UserWithDetails) => void;
  onUserPress?: (user: UserWithDetails) => void;
  connectionsMap: Record<string, 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE'>;
}

export const NearbyTravelersCarousel: React.FC<NearbyTravelersCarouselProps> = ({
  users,
  onConnectPress,
  onAcceptPress,
  onMessagePress,
  onUserPress,
  connectionsMap,
}) => {
  if (users.length === 0) return null;

  return (
    <View className="mb-6">
      {/* Section Header */}
      <View className="flex-row justify-between items-center px-5 mb-3">
        <View className="flex-row items-center gap-2.5">
          <View className="w-8 h-8 rounded-full bg-surface-subtle items-center justify-center">
            <MapPin size={15} color={theme.colors.primary} />
          </View>
          <View>
            <Text className="text-base font-semibold text-text-primary tracking-tight">
              Travelers Near You
            </Text>
            <Text className="text-xs text-text-muted">Solo travelers within 50 km</Text>
          </View>
        </View>
        <View className="bg-surface-subtle px-2.5 py-1 rounded-full border border-border">
          <Text className="text-xs font-semibold text-text-primary">{users.length}</Text>
        </View>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        decelerationRate="fast"
        snapToInterval={212}
        snapToAlignment="start"
      >
        {users.map((user) => {
          const status = connectionsMap[user.id] || user.connectionStatus || 'NONE';
          const rawDistance = user.distanceKm ?? (user as any).distance ?? (user as any).distance_km;
          const distance = formatDistanceKm(rawDistance);

          return (
            <TouchableOpacity
              key={user.id}
              className="w-[200px] bg-surface rounded-2xl border border-border overflow-hidden shadow-subtle"
              activeOpacity={0.92}
              onPress={() => onUserPress?.(user)}
              disabled={!onUserPress}
            >
              {/* Cover Banner */}
              <View className="h-[75px] w-full relative bg-primary-dark">
                {user.coverUrl ? (
                  <Image source={{ uri: user.coverUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full bg-primary-dark" />
                )}
                {/* Distance Badge */}
                <View className="absolute top-2 right-2 flex-row items-center bg-black/60 px-2 py-0.5 rounded-full gap-1">
                  <MapPin size={9} color={theme.colors.white} />
                  <Text className="text-white text-[10px] font-semibold">{distance}</Text>
                </View>
              </View>

              {/* Avatar Floating */}
              <View className="absolute top-[52px] left-3 z-10">
                {user.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    className="w-11 h-11 rounded-full border-2 border-surface bg-surface-subtle"
                  />
                ) : (
                  <View className="w-11 h-11 rounded-full bg-primary items-center justify-center border-2 border-surface">
                    <Text className="text-white text-base font-semibold">
                      {user.fullName?.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Card Body */}
              <View className="pt-7 px-3 pb-3">
                <Text className="text-sm font-semibold text-text-primary" numberOfLines={1}>
                  {user.fullName}
                </Text>

                <Text className="text-[11px] text-text-muted mt-0.5" numberOfLines={1}>
                  {user.city ? `${user.city}, ` : ''}{user.state || user.country || 'Traveling'}
                </Text>

                {/* Interest Tags */}
                {user.interests && user.interests.length > 0 && (
                  <View className="flex-row gap-1 my-2">
                    {user.interests.slice(0, 2).map((item, idx) => (
                      <View key={idx} className="bg-surface-subtle px-2 py-0.5 rounded-md flex-shrink">
                        <Text className="text-[10px] text-text-secondary font-medium" numberOfLines={1}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Button */}
                <View className="mt-2">
                  {status === 'CONNECTED' ? (
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-2 rounded-xl gap-1 bg-primary-dark"
                      onPress={() => onMessagePress ? onMessagePress(user) : onConnectPress(user)}
                    >
                      <MessageSquare size={13} color={theme.colors.white} />
                      <Text className="text-white text-xs font-semibold">Message</Text>
                    </TouchableOpacity>
                  ) : status === 'REQUEST_SENT' ? (
                    <View className="flex-row items-center justify-center py-2 rounded-xl bg-surface-subtle">
                      <Text className="text-text-muted text-xs font-semibold">Sent</Text>
                    </View>
                  ) : status === 'REQUEST_RECEIVED' ? (
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-2 rounded-xl gap-1 bg-primary"
                      onPress={() => onAcceptPress ? onAcceptPress(user) : onConnectPress(user)}
                    >
                      <Check size={13} color={theme.colors.white} />
                      <Text className="text-white text-xs font-semibold">Accept</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-2 rounded-xl gap-1 bg-primary shadow-subtle"
                      onPress={() => onConnectPress(user)}
                      activeOpacity={0.8}
                    >
                      <UserPlus size={13} color={theme.colors.white} />
                      <Text className="text-white text-xs font-semibold">Connect</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
