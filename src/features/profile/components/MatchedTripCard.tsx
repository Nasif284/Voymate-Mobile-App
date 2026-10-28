import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MapPin, Calendar, Compass, Wallet } from 'lucide-react-native';

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
          <MapPin size={16} color="#005440" />
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
              <Calendar size={14} color="#005440" />
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
              <Compass size={14} color="#005440" />
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
              <Wallet size={14} color="#005440" />
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6EFE9',
    shadowColor: '#000',
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
    borderBottomColor: '#F0F4F1',
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#151D19',
    letterSpacing: -0.2,
  },
  bannerContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#003E2F',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#005440',
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
    fontWeight: '900',
    color: '#FFFFFF',
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
    backgroundColor: '#F8FAF8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBF1ED',
  },
  tileIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTextWrapper: {
    flex: 1,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5C6B64',
    letterSpacing: 0.6,
  },
  tileValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#151D19',
    marginTop: 1,
  },
});
