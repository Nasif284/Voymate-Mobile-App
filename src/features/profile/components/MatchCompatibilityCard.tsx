import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
    <View style={styles.card}>
      {/* Top Header & Gauge Row */}
      <View style={styles.topRow}>
        {/* Score Ring Gauge */}
        <View style={styles.gaugeWrapper}>
          <View style={styles.gaugeCircle}>
            <Text style={styles.gaugeScore}>{score}%</Text>
            <Text style={styles.gaugeLabel}>SCORE</Text>
          </View>
        </View>

        {/* Gauge Intro Text */}
        <View style={styles.introWrapper}>
          <View style={styles.titleRow}>
            <Sparkles size={16} color={theme.colors.primary} />
            <Text style={styles.title}>Why You Match</Text>
          </View>
          <Text style={styles.subtitle}>
            Calculated based on your travel styles, shared interests, and budget alignment.
          </Text>
        </View>
      </View>

      {/* Breakdown Reasons */}
      {reasons && reasons.length > 0 && (
        <View style={styles.reasonsList}>
          {reasons.map((reason, index) => (
            <View key={index} style={styles.reasonItem}>
              <View style={styles.checkCircle}>
                <Check size={11} color={theme.colors.primary} strokeWidth={3} />
              </View>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gaugeScore: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  gaugeLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: theme.colors.primary,
    letterSpacing: 0.8,
    opacity: 0.85,
    marginTop: -1,
  },
  introWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    fontWeight: '500',
  },
  reasonsList: {
    paddingTop: 14,
    gap: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
});
