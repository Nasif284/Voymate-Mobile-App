import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MapPin, Calendar, Compass, Wallet } from 'lucide-react-native';
import { theme } from '../../../config/theme';

interface MatchedTripCardProps {
  trip: {
    id: string;
    name: string;
    dateFrom: string | Date;
    dateTo: string | Date;
    destination: {
      name: string;
      coverUrl?: string | null;
      city?: string | null;
      country?: string | null;
    };
    budgetStyle?: string;
    travelStyle?: string;
  };
}

const formatDate = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

export const MatchedTripCard: React.FC<MatchedTripCardProps> = ({ trip }) => {
  const dateFromStr = formatDate(trip.dateFrom);
  const dateToStr = formatDate(trip.dateTo);
  const dateRangeStr =
    dateFromStr && dateToStr ? `${dateFromStr} - ${dateToStr}` : dateFromStr || '';

  const destinationDisplay =
    trip.destination?.city && trip.destination?.country
      ? `${trip.destination.city}, ${trip.destination.country}`
      : trip.destination?.name || 'Destination';

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MapPin size={16} color={theme.colors.primary} />
        </View>
        <Text style={styles.headerTitle}>Matched Trip Plan</Text>
      </View>

      {/* Trip Cover Banner */}
      <View style={styles.bannerContainer}>
        {trip.destination?.coverUrl ? (
          <Image
            source={{ uri: trip.destination.coverUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.bannerFallback} />
        )}
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerContent}>
          <Text style={styles.tripName} numberOfLines={1}>
            {trip.name}
          </Text>
          <Text style={styles.destinationSub} numberOfLines={1}>
            {destinationDisplay}
          </Text>
        </View>
      </View>

      {/* Info Tiles Grid */}
      <View style={styles.grid}>
        {dateRangeStr ? (
          <View style={styles.tile}>
            <View style={styles.tileIconWrapper}>
              <Calendar size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.tileTextWrapper}>
              <Text style={styles.tileLabel}>TRAVEL DATES</Text>
              <Text style={styles.tileValue} numberOfLines={1}>
                {dateRangeStr}
              </Text>
            </View>
          </View>
        ) : null}

        {trip.travelStyle ? (
          <View style={styles.tile}>
            <View style={styles.tileIconWrapper}>
              <Compass size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.tileTextWrapper}>
              <Text style={styles.tileLabel}>TRAVEL STYLE</Text>
              <Text style={styles.tileValue} numberOfLines={1}>
                {trip.travelStyle}
              </Text>
            </View>
          </View>
        ) : null}

        {trip.budgetStyle ? (
          <View style={styles.tile}>
            <View style={styles.tileIconWrapper}>
              <Wallet size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.tileTextWrapper}>
              <Text style={styles.tileLabel}>BUDGET STYLE</Text>
              <Text style={styles.tileValue} numberOfLines={1}>
                {trip.budgetStyle}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  bannerContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: theme.colors.primaryDark,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primaryDark,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  bannerContent: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  tripName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.white,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  destinationSub: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  grid: {
    padding: 16,
    gap: 10,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tileIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTextWrapper: {
    flex: 1,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
  },
  tileValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 1,
  },
});
