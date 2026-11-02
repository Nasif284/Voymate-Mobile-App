import React from 'react';
import { View, Text } from 'react-native';
import { Sparkles, Check } from 'lucide-react-native';
import { theme } from '../../../config/theme';

interface MatchCompatibilityCardProps {
  score: number;
  reasons?: string[];
}

export const MatchCompatibilityCard: React.FC<MatchCompatibilityCardProps> = ({
  score,
  reasons = [],
}) => {
  return (
    <View className="bg-surface rounded-[24px] p-5 mx-4 mt-3.5 border border-border shadow-sm">
      {/* Top Header & Gauge Row */}
      <View className="flex-row items-center gap-4 pb-4 border-b border-border">
        {/* Score Ring Gauge */}
        <View className="items-center justify-center">
          <View className="w-[76px] h-[76px] rounded-full border-4 border-primary bg-primary-mist items-center justify-center shadow-sm">
            <Text className="text-[22px] font-bold text-primary tracking-[-0.5px]">{score}%</Text>
            <Text className="text-[8px] font-semibold text-primary tracking-[0.8px] opacity-85 -mt-0.5">SCORE</Text>
          </View>
        </View>

        {/* Gauge Intro Text */}
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5 mb-1">
            <Sparkles size={16} color={theme.colors.primary} />
            <Text className="text-base font-bold text-text-primary tracking-[-0.2px]">Why You Match</Text>
          </View>
          <Text className="text-xs text-text-secondary leading-4 font-medium">
            Calculated based on your travel styles, shared interests, and budget alignment.
          </Text>
        </View>
      </View>

      {/* Breakdown Reasons */}
      {reasons && reasons.length > 0 && (
        <View className="pt-3.5 gap-2">
          {reasons.map((reason, index) => (
            <View key={index} className="flex-row items-center gap-2.5 bg-surface-subtle px-3 py-2.5 rounded-[14px] border border-border">
              <View className="w-5 h-5 rounded-full bg-primary-mist items-center justify-center">
                <Check size={11} color={theme.colors.primary} strokeWidth={3} />
              </View>
              <Text className="flex-1 text-[13px] font-semibold text-text-primary leading-[18px]">{reason}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
