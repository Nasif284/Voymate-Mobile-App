import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Check } from 'lucide-react-native';

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
            <Sparkles size={16} color="#005440" />
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
                <Check size={11} color="#005440" strokeWidth={3} />
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    shadowColor: '#000',
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
    borderBottomColor: '#F0F4F1',
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
    borderColor: '#005440',
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#005440',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gaugeScore: {
    fontSize: 22,
    fontWeight: '900',
    color: '#005440',
    letterSpacing: -0.5,
  },
  gaugeLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#005440',
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
    fontWeight: '800',
    color: '#151D19',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#5C6B64',
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
    backgroundColor: '#F7FAF6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8EFEA',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C9EADB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#181D1A',
    lineHeight: 18,
  },
});
