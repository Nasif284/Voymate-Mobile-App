import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Luggage, Calendar, MessageSquare, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface TripCompanionBannerProps {
  userName: string;
  destination: string;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  onMessagePress: () => void;
}

const formatDate = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const TripCompanionBanner: React.FC<TripCompanionBannerProps> = ({
  userName,
  destination,
  dateFrom,
  dateTo,
  onMessagePress,
}) => {
  const firstName = userName?.split(' ')[0] || 'Traveler';
  const cleanDestination = destination?.split(',')[0] || destination;

  const dateFromStr = formatDate(dateFrom);
  const dateToStr = formatDate(dateTo);
  const dateRangeStr =
    dateFromStr && dateToStr ? `${dateFromStr} - ${dateToStr}` : dateFromStr || '';

  return (
    <View style={styles.card}>
      {/* Decorative accent top bar */}
      <View style={styles.headerRow}>
        <View style={styles.iconContainer}>
          <Luggage size={18} color="#A0F3D4" />
        </View>

        <View style={styles.tagContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>TRIP COMPANION REQUEST</Text>
          </View>
          {dateRangeStr ? (
            <View style={styles.dateTag}>
              <Calendar size={11} color="rgba(255, 255, 255, 0.85)" />
              <Text style={styles.dateTagText}>{dateRangeStr}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Main Announcement */}
      <Text style={styles.headline}>
        {firstName} is looking for mates for an upcoming trip to {cleanDestination}!
      </Text>

      <Text style={styles.subtext}>
        Would you like to travel together? Coordinate your journey, share itineraries, and explore together.
      </Text>

      {/* Action CTA */}
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onMessagePress();
        }}
        activeOpacity={0.85}
      >
        <MessageSquare size={15} color="#004736" />
        <Text style={styles.ctaButtonText}>Message {firstName} to Join</Text>
        <ArrowRight size={14} color="#004736" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#004736',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(160, 243, 212, 0.25)',
    shadowColor: '#004736',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tagContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    backgroundColor: '#A0F3D4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#004736',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dateTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  headline: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 23,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  subtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: '#A0F3D4',
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaButtonText: {
    color: '#004736',
    fontSize: 14,
    fontWeight: '800',
  },
});
