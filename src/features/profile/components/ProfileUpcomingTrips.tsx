import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Compass, Calendar, MapPin } from 'lucide-react-native';
import { ProfileUpcomingTrip } from '../types';

interface ProfileUpcomingTripsProps {
  trips: ProfileUpcomingTrip[];
  onTripPress?: (trip: ProfileUpcomingTrip) => void;
  onSeeAll?: () => void;
}

const formatDate = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
};

const formatYear = (dateStr?: string | Date) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.getFullYear().toString();
  } catch {
    return '';
  }
};

export const ProfileUpcomingTrips: React.FC<ProfileUpcomingTripsProps> = ({
  trips = [],
  onTripPress,
  onSeeAll,
}) => {
  if (!trips || trips.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Compass size={16} color="#005440" />
          </View>
          <Text style={styles.headerTitle}>Upcoming Travel Plans</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{trips.length}</Text>
          </View>
          {onSeeAll && (
            <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {trips.map((trip) => {
          const dateFromStr = formatDate(trip.dateFrom);
          const dateToStr = formatDate(trip.dateTo);
          const year = formatYear(trip.dateTo);
          const dateRange =
            dateFromStr && dateToStr
              ? `${dateFromStr} - ${dateToStr}, ${year}`
              : dateFromStr || '';

          const destinationName =
            trip.destination?.city && trip.destination?.country
              ? `${trip.destination.city}, ${trip.destination.country}`
              : trip.destination?.name || 'Explore Trip';

          return (
            <TouchableOpacity
              key={trip.id}
              style={styles.tripCard}
              activeOpacity={0.85}
              onPress={() => onTripPress?.(trip)}
            >
              {/* Trip Image Banner */}
              <View style={styles.imageWrapper}>
                {trip.destination?.coverUrl ? (
                  <Image
                    source={{ uri: trip.destination.coverUrl }}
                    style={styles.tripImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imageFallback} />
                )}
                <View style={styles.imageGradient} />
                <View style={styles.destBadge}>
                  <MapPin size={10} color="#FFFFFF" />
                  <Text style={styles.destBadgeText} numberOfLines={1}>
                    {destinationName}
                  </Text>
                </View>
              </View>

              {/* Trip Info */}
              <View style={styles.infoWrapper}>
                <Text style={styles.tripTitle} numberOfLines={1}>
                  {trip.name}
                </Text>

                {dateRange ? (
                  <View style={styles.dateRow}>
                    <Calendar size={12} color="#005440" />
                    <Text style={styles.dateText} numberOfLines={1}>
                      {dateRange}
                    </Text>
                  </View>
                ) : null}

                {trip.travelStyle ? (
                  <View style={styles.styleBadge}>
                    <Text style={styles.styleBadgeText}>
                      {trip.travelStyle}
                    </Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 18,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#005440',
  },
  countBadge: {
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#005440',
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tripCard: {
    width: 210,
    backgroundColor: '#F8FAF8',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8EFEA',
  },
  imageWrapper: {
    width: '100%',
    height: 100,
    position: 'relative',
    backgroundColor: '#003E2F',
  },
  tripImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#005440',
  },
  imageGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  destBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  destBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  infoWrapper: {
    padding: 12,
    gap: 6,
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#151D19',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C6B64',
  },
  styleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  styleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#005440',
  },
});
