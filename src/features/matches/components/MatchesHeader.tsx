import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../config/theme';

interface MatchesHeaderProps {
  activeTripDestination?: string | null;
}

export const MatchesHeader: React.FC<MatchesHeaderProps> = ({
  activeTripDestination,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Matches</Text>
      <Text style={styles.subtitle}>
        {activeTripDestination
          ? `Companions heading to ${activeTripDestination} on overlapping dates`
          : 'Companions whose destinations and dates align with yours'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
});
