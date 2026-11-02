import React from 'react';
import { View, Text } from 'react-native';

interface MatchesHeaderProps {
  activeTripDestination?: string | null;
}

export const MatchesHeader: React.FC<MatchesHeaderProps> = ({
  activeTripDestination,
}) => {
  return (
    <View className="px-5 pt-2 pb-4">
      <Text className="text-2xl font-semibold text-text-primary tracking-tight">
        Trip Matches
      </Text>
      <Text className="text-xs text-text-muted mt-0.5 leading-[17px]">
        {activeTripDestination
          ? `Companions heading to ${activeTripDestination} on overlapping dates`
          : 'Companions whose destinations and dates align with yours'}
      </Text>
    </View>
  );
};
