import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { User, Quote, Plus } from 'lucide-react-native';
import { theme } from '../../../config/theme';

interface ProfileBioCardProps {
  name: string;
  bio?: string | null;
  onAddBio?: () => void;
}

export const ProfileBioCard: React.FC<ProfileBioCardProps> = ({ name, bio, onAddBio }) => {
  const hasBio = Boolean(bio && bio.trim().length > 0);
  if (!hasBio && !onAddBio) return null;

  const firstName = name?.split(' ')[0] || 'Traveler';

  return (
    <View className="bg-surface rounded-[24px] p-5 mx-4 mt-3.5 border border-border">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-7 h-7 rounded-full bg-primary-mist items-center justify-center">
          <User size={15} color={theme.colors.primary} />
        </View>
        <Text className="text-base font-bold text-text-primary tracking-[-0.2px]">About {firstName}</Text>
      </View>

      {hasBio ? (
        <View className="relative pl-1">
          <Quote
            size={16}
            color={theme.colors.primaryLight}
            className="mb-1"
          />
          <Text className="text-sm text-text-primary leading-[22px] font-medium">{bio!.trim()}</Text>
        </View>
      ) : (
        <TouchableOpacity className="bg-surface-subtle rounded-[14px] p-3.5 border border-border gap-2.5" onPress={onAddBio} activeOpacity={0.8}>
          <Text className="text-[13px] text-text-secondary leading-[19px]">
            Add a short bio about your travel style so potential travel mates know more about you.
          </Text>
          <View className="flex-row items-center self-start bg-surface px-3 py-1.5 rounded-[10px] border border-primary gap-1">
            <Plus size={13} color={theme.colors.primary} />
            <Text className="text-xs font-bold text-primary">Add Bio</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};
