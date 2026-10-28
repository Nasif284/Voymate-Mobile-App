import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Compass, ArrowRight, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface PlanTripBannerProps {
  onPlanTripPress: () => void;
}

export const PlanTripBanner: React.FC<PlanTripBannerProps> = ({
  onPlanTripPress,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPlanTripPress();
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        {/* Subtle Decorative Ambient Rings */}
        <View style={styles.ambientCircleOne} />
        <View style={styles.ambientCircleTwo} />

        {/* Content Row */}
        <View style={styles.contentRow}>
          {/* Evocative Icon Badge */}
          <View style={styles.iconBadge}>
            <Compass size={22} color="#A0F3D4" strokeWidth={2.2} />
          </View>

          {/* Text Container */}
          <View style={styles.textContainer}>
            <View style={styles.tagRow}>
              <Sparkles size={10} color="#A0F3D4" />
              <Text style={styles.tagText}>NEXT EXPEDITION</Text>
            </View>
            <Text style={styles.title}>Where to next?</Text>
            <Text style={styles.subtitle}>
              Set a destination to unlock travel buddy matches
            </Text>
          </View>

          {/* Classy Action Pill */}
          <View style={styles.actionPill}>
            <Text style={styles.actionText}>Plan</Text>
            <ArrowRight size={13} color="#004736" strokeWidth={2.5} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#004736',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#004736',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  ambientCircleOne: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(160, 243, 212, 0.08)',
  },
  ambientCircleTwo: {
    position: 'absolute',
    bottom: -40,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(160, 243, 212, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A0F3D4',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 1,
    lineHeight: 15,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#004736',
  },
});
