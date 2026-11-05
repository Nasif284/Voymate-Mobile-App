import React from 'react';
import { View, Text } from 'react-native';
import { Sparkles, Check, Compass, Calendar } from 'lucide-react-native';
import { theme } from '../../../config/theme';

export type MatchCardBadgeMode =
  | 'STRICT_MATCH'
  | 'LOCATION_DISCOVERY'
  | 'DATES_DISCOVERY'
  | 'STYLE_DISCOVERY'
  | 'BUDGET_DISCOVERY'
  | 'INTENT_MATCH'
  | 'OPEN_BROWSING';

interface MatchCompatibilityCardProps {
  score: number;
  reasons?: string[];
  badgeMode?: MatchCardBadgeMode;
  travelType?: string | null;
  filterLabel?: string;
}

export const MatchCompatibilityCard: React.FC<MatchCompatibilityCardProps> = ({
  score,
  reasons = [],
  badgeMode = 'STRICT_MATCH',
  travelType,
  filterLabel,
}) => {
  const isStrict = badgeMode === 'STRICT_MATCH';
  const isLocation = badgeMode === 'LOCATION_DISCOVERY';
  const isDates = badgeMode === 'DATES_DISCOVERY';
  const isStyle = badgeMode === 'STYLE_DISCOVERY';
  const isBudget = badgeMode === 'BUDGET_DISCOVERY';
  const isIntent = badgeMode === 'INTENT_MATCH';

  const titleText = isStrict
    ? 'Why You Match'
    : isLocation
      ? 'Destination Compatibility'
      : isIntent
        ? `${filterLabel || 'Travel Intent'} Fit`
        : isDates
          ? 'Dates & Timing Fit'
          : isStyle
            ? `${filterLabel || 'Travel Style'} Fit`
            : isBudget
              ? `${filterLabel || 'Budget Style'} Fit`
              : 'Trip & Style Alignment';

  const subtitleText = isStrict
    ? 'Calculated based on your travel dates, destination, and budget alignment.'
    : isLocation
      ? 'Based on shared destination, travel personality, and common traveler interests.'
      : isIntent
        ? `Matched based on verified criteria (${filterLabel ? filterLabel.toLowerCase() : 'timing & style alignment'}).`
        : isDates
          ? 'Based on overlapping travel dates and shared schedule availability.'
          : isStyle
            ? `Matched based on ${filterLabel ? filterLabel.toLowerCase() : 'travel style'} alignment.`
            : isBudget
              ? `Matched based on ${filterLabel ? filterLabel.toLowerCase() : 'budget style'} pace.`
              : 'Matched based on travel vibe, upcoming destinations, and shared interests.';

  return (
    <View className="bg-surface rounded-[24px] p-5 mx-4 mt-3.5 border border-border">
      {/* Top Header & Gauge Row */}
      <View className="flex-row items-center gap-4 pb-4 border-b border-border">
        {/* Score / Vibe Ring Gauge */}
        <View className="items-center justify-center">
          {isStrict ? (
            score >= 70 ? (
              <View className="w-[76px] h-[76px] rounded-full border-4 border-primary bg-surface items-center justify-center">
                <Text className="text-[22px] font-bold text-primary tracking-[-0.5px]">
                  {score}%
                </Text>
                <Text className="text-[8px] font-semibold text-primary tracking-[0.8px] opacity-85 -mt-0.5">
                  SCORE
                </Text>
              </View>
            ) : (
              <View className="w-[76px] h-[76px] rounded-full border-4 border-primary bg-surface items-center justify-center p-1">
                <Sparkles size={22} color={theme.colors.primary} />
                <Text className="text-[9px] font-bold text-primary tracking-[0.5px] mt-0.5 text-center">
                  GOOD FIT
                </Text>
              </View>
            )
          ) : isLocation ? (
            <View className="w-[76px] h-[76px] rounded-full border-4 border-primary bg-surface items-center justify-center p-1">
              <Sparkles size={22} color={theme.colors.primary} />
              <Text className="text-[9px] font-bold text-primary tracking-[0.5px] mt-0.5 text-center">
                {score >= 75 ? 'HIGH VIBE' : 'GOOD FIT'}
              </Text>
            </View>
          ) : isIntent ? (
            <View className="w-[76px] h-[76px] rounded-full border-4 border-primary bg-surface items-center justify-center p-1">
              <Sparkles size={22} color={theme.colors.primary} />
              <Text className="text-[9px] font-bold text-primary tracking-[0.5px] mt-0.5 text-center">
                VIBE FIT
              </Text>
            </View>
          ) : isDates ? (
            <View className="w-[76px] h-[76px] rounded-full border-4 border-primary bg-surface items-center justify-center p-1">
              <Calendar size={22} color={theme.colors.primary} />
              <Text className="text-[9px] font-bold text-primary tracking-[0.5px] mt-0.5 text-center">
                DATES FIT
              </Text>
            </View>
          ) : isStyle || isBudget ? (
            <View className="w-[76px] h-[76px] rounded-full border-4 border-primary bg-surface items-center justify-center p-1">
              <Sparkles size={22} color={theme.colors.primary} />
              <Text className="text-[9px] font-bold text-primary tracking-[0.5px] mt-0.5 text-center">
                {isBudget ? 'BUDGET FIT' : 'STYLE FIT'}
              </Text>
            </View>
          ) : (
            <View className="w-[76px] h-[76px] rounded-full border-4 border-primary bg-surface items-center justify-center p-1">
              <Compass size={22} color={theme.colors.primary} />
              <Text className="text-[9px] font-bold text-primary tracking-[0.5px] mt-0.5 text-center">
                OPEN TRIP
              </Text>
            </View>
          )}
        </View>

        {/* Gauge Intro Text */}
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5 mb-1">
            {isStrict || isLocation || isStyle || isBudget || isIntent ? (
              <Sparkles size={16} color={theme.colors.primary} />
            ) : isDates ? (
              <Calendar size={16} color={theme.colors.primary} />
            ) : (
              <Compass size={16} color={theme.colors.primary} />
            )}
            <Text className="text-base font-bold text-text-primary tracking-[-0.2px]">
              {titleText}
            </Text>
          </View>
          <Text className="text-xs text-text-secondary leading-4 font-medium">
            {subtitleText}
          </Text>
        </View>
      </View>

      {/* Breakdown Reasons */}
      {reasons && reasons.length > 0 ? (
        <View className="pt-3.5 gap-2">
          {reasons.map((reason, index) => (
            <View
              key={index}
              className="flex-row items-center gap-2.5 bg-surface-subtle px-3 py-2.5 rounded-[14px] border border-border"
            >
              <View className="w-5 h-5 rounded-full bg-surface border border-primary items-center justify-center">
                <Check
                  size={11}
                  color={theme.colors.primary}
                  strokeWidth={3}
                />
              </View>
              <Text className="flex-1 text-[13px] font-semibold text-text-primary leading-[18px]">
                {reason}
              </Text>
            </View>
          ))}
        </View>
      ) : badgeMode === 'OPEN_BROWSING' ? (
        <View className="pt-3.5 gap-2">
          <View className="flex-row items-center gap-2.5 bg-surface-subtle px-3 py-2.5 rounded-[14px] border border-border">
            <View className="w-5 h-5 rounded-full bg-surface border border-primary items-center justify-center">
              <Check size={11} color={theme.colors.primary} strokeWidth={3} />
            </View>
            <Text className="flex-1 text-[13px] font-semibold text-text-primary leading-[18px]">
              {travelType && travelType.toUpperCase() !== 'TRAVELER'
                ? `${travelType} traveler mindset`
                : 'Active traveler looking for travel mates'}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Discovery Mode Date Overlap Hint */}
      {isLocation && (
        <View className="mt-3 pt-3 border-t border-border flex-row items-center gap-2">
          <Calendar size={13} color={theme.colors.textMuted} />
          <Text className="text-[11px] text-text-muted flex-1">
            Dates not selected. Add travel dates in Explore to see exact companion overlap %.
          </Text>
        </View>
      )}

      {/* Intent Match Hint */}
      {isIntent && (
        <View className="mt-3 pt-3 border-t border-border flex-row items-center gap-2">
          <Sparkles size={13} color={theme.colors.textMuted} />
          <Text className="text-[11px] text-text-muted flex-1">
            Trip intent matched! Add a destination in Explore to unlock exact % match score.
          </Text>
        </View>
      )}

      {/* Dates Mode Hint */}
      {isDates && (
        <View className="mt-3 pt-3 border-t border-border flex-row items-center gap-2">
          <Sparkles size={13} color={theme.colors.textMuted} />
          <Text className="text-[11px] text-text-muted flex-1">
            Add a destination or travel style in Explore to calculate full compatibility % score.
          </Text>
        </View>
      )}

      {/* Style/Budget Mode Hint */}
      {(isStyle || isBudget) && (
        <View className="mt-3 pt-3 border-t border-border flex-row items-center gap-2">
          <Calendar size={13} color={theme.colors.textMuted} />
          <Text className="text-[11px] text-text-muted flex-1">
            Add travel dates or destination in Explore to calculate full compatibility % score.
          </Text>
        </View>
      )}

      {/* Open Browsing Mode Hint */}
      {badgeMode === 'OPEN_BROWSING' && (
        <View className="mt-3 pt-3 border-t border-border flex-row items-center gap-2">
          <Compass size={13} color={theme.colors.textMuted} />
          <Text className="text-[11px] text-text-muted flex-1">
            Search a destination or add travel dates in Explore to see exact compatibility score %.
          </Text>
        </View>
      )}
    </View>
  );
};
