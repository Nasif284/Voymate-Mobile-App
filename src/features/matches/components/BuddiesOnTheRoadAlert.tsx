import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../../../config/theme';
import { TripMatchItem } from '../types';
import { MessageSquare, Users } from 'lucide-react-native';

interface BuddiesOnTheRoadAlertProps {
  buddies: TripMatchItem[];
  onMessagePress: (buddy: TripMatchItem) => void;
}

export const BuddiesOnTheRoadAlert: React.FC<BuddiesOnTheRoadAlertProps> = ({
  buddies,
  onMessagePress,
}) => {
  if (!buddies || buddies.length === 0) return null;

  const firstBuddy = buddies[0];
  const buddyName = firstBuddy.user.fullName || 'A friend';
  const count = buddies.length;

  return (
    <View className="flex-row items-center justify-between bg-text-primary rounded-2xl py-3 px-3.5 mb-5 shadow-floating">
      <View className="flex-row items-center flex-1 pr-2.5 gap-2.5">
        <View className="relative">
          {firstBuddy.user.avatarUrl ? (
            <Image
              source={{ uri: firstBuddy.user.avatarUrl }}
              className="w-9 h-9 rounded-full border border-surface"
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={150}
            />
          ) : (
            <View className="w-9 h-9 rounded-full bg-primary items-center justify-center border border-surface">
              <Users size={14} color={theme.colors.white} />
            </View>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-[13px] font-semibold text-white" numberOfLines={1}>
            {count === 1
              ? `${buddyName} is heading here too!`
              : `${buddyName} + ${count - 1} mate${count > 2 ? 's' : ''} heading here!`}
          </Text>
          <Text className="text-[10px] text-white/75 mt-0.5">
            Connected buddies on the road around your dates
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className="flex-row items-center bg-primary py-2 px-3 rounded-xl gap-1 shadow-card"
        onPress={() => onMessagePress(firstBuddy)}
        activeOpacity={0.8}
      >
        <MessageSquare size={13} color={theme.colors.white} />
        <Text className="text-[11px] font-semibold text-white">Chat</Text>
      </TouchableOpacity>
    </View>
  );
};
