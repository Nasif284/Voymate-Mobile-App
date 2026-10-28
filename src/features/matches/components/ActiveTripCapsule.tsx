import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../config/theme';
import { ActiveTrip } from '../types';
import { Luggage, Calendar, Sparkles, ChevronDown } from 'lucide-react-native';

interface ActiveTripCapsuleProps {
  trip: ActiveTrip;
  matchCount?: number;
  onChangeTrip?: () => void;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const ActiveTripCapsule: React.FC<ActiveTripCapsuleProps> = ({
  trip,
  matchCount,
  onChangeTrip,
}) => {
  const dates =
    trip.dateFrom && trip.dateTo
      ? `${formatDate(trip.dateFrom)} - ${formatDate(trip.dateTo)}`
      : '';

  const destinationName =
    trip.destination?.name ||
    trip.destination?.city ||
    trip.name ||
    'Upcoming Journey';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.labelGroup}>
          <Sparkles size={12} color={theme.colors.primary} />
          <Text style={styles.label}>Matching For Trip</Text>
        </View>

        <View style={styles.topRight}>
          {matchCount !== undefined && matchCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{matchCount} matches</Text>
            </View>
          )}

          {onChangeTrip && (
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={onChangeTrip}
              activeOpacity={0.8}
            >
              <Text style={styles.switchBtnText}>Switch</Text>
              <ChevronDown size={12} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.destinationRow}>
        <View style={styles.iconCircle}>
          <Luggage size={16} color={theme.colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.destinationTitle} numberOfLines={1}>
            {destinationName}
          </Text>
          {dates ? (
            <View style={styles.dateRow}>
              <Calendar size={11} color={theme.colors.textMuted} />
              <Text style={styles.dateText}>{dates}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EEF8F4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(15, 110, 86, 0.2)',
    padding: 16,
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 110, 86, 0.25)',
    gap: 2,
  },
  switchBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  info: {
    flex: 1,
  },
  destinationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#181D1A',
    letterSpacing: -0.2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
