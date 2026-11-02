import React from 'react';
import { View, Text } from 'react-native';
import { Compass, Sparkles, Globe, Award, Heart } from 'lucide-react-native';
import { theme } from '../../../config/theme';

interface ProfileAttributesCardProps {
  travelType?: string | null;
  travelPersonality?: string | null;
  skills?: string[];
  interests?: string[];
  languages?: string[];
}

export const ProfileAttributesCard: React.FC<ProfileAttributesCardProps> = ({
  travelType,
  travelPersonality,
  skills = [],
  interests = [],
  languages = [],
}) => {
  const hasAny =
    Boolean(travelType) ||
    Boolean(travelPersonality) ||
    skills.length > 0 ||
    interests.length > 0 ||
    languages.length > 0;

  if (!hasAny) return null;

  return (
    <View className="bg-surface rounded-[24px] p-5 mx-4 mt-3.5 border border-border gap-4">
      <View className="flex-row items-center gap-2 pb-3 border-b border-border">
        <View className="w-7 h-7 rounded-full bg-primary-mist items-center justify-center">
          <Compass size={16} color={theme.colors.primary} />
        </View>
        <Text className="text-base font-bold text-text-primary tracking-[-0.2px]">Travel Preferences</Text>
      </View>

      {/* Travel Style & Personality Highlight Row */}
      {(travelType || travelPersonality) && (
        <View className="flex-row flex-wrap gap-3">
          {travelType ? (
            <View className="flex-1 min-w-[130px] gap-1.5">
              <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">TRAVEL STYLE</Text>
              <View className="flex-row items-center gap-1.5 bg-primary-mist px-3 py-[7px] rounded-[14px] border border-primary-border self-start">
                <Sparkles size={12} color={theme.colors.primary} />
                <Text className="text-[13px] font-bold text-primary">{travelType}</Text>
              </View>
            </View>
          ) : null}

          {travelPersonality ? (
            <View className="flex-1 min-w-[130px] gap-1.5">
              <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">PERSONALITY</Text>
              <View className="bg-surface-subtle px-3 py-[7px] rounded-[14px] self-start">
                <Text className="text-[13px] font-bold text-text-primary">{travelPersonality}</Text>
              </View>
            </View>
          ) : null}
        </View>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-center gap-1.5">
            <Globe size={13} color={theme.colors.textSecondary} />
            <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">LANGUAGES</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {languages.map((lang, idx) => (
              <View key={idx} className="bg-surface-subtle px-3 py-1.5 rounded-xl">
                <Text className="text-xs font-semibold text-text-secondary">{lang}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-center gap-1.5">
            <Award size={13} color={theme.colors.textSecondary} />
            <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">SKILLS</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <View key={idx} className="bg-primary-mist px-3 py-1.5 rounded-xl border border-primary-border">
                <Text className="text-xs font-bold text-primary">{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Interests */}
      {interests.length > 0 && (
        <View className="gap-2">
          <View className="flex-row items-center gap-1.5">
            <Heart size={13} color={theme.colors.textSecondary} />
            <Text className="text-[10px] font-semibold text-text-secondary tracking-[0.6px]">INTERESTS</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {interests.map((interest, idx) => (
              <View key={idx} className="bg-surface-subtle px-3 py-1.5 rounded-xl border border-border">
                <Text className="text-xs font-semibold text-text-primary">{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
