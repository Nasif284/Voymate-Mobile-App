import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { theme } from '../../../config/theme';
import { UserWithDetails } from '../types';
import {
  Calendar,
  Luggage,
  MapPin,
  UserPlus,
  Check,
  MessageSquare,
} from 'lucide-react-native';

interface BuddyTravelerCardProps {
  user: UserWithDetails;
  connectionStatus: 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
  onPress?: (user: UserWithDetails) => void;
  onConnectPress: (user: UserWithDetails) => void;
  onAcceptPress?: (user: UserWithDetails) => void;
  onMessagePress?: (user: UserWithDetails) => void;
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

export const BuddyTravelerCard: React.FC<BuddyTravelerCardProps> = React.memo(({
  user,
  connectionStatus,
  onPress,
  onConnectPress,
  onAcceptPress,
  onMessagePress,
}) => {
  const activeTrip = user.activeTrip;
  const tripDates =
    activeTrip?.dateFrom && activeTrip?.dateTo
      ? `${formatDate(activeTrip.dateFrom)} - ${formatDate(activeTrip.dateTo)}`
      : '';

  const destinationText =
    activeTrip?.destination ||
    (activeTrip?.destinationCity && activeTrip?.destinationCountry
      ? `${activeTrip.destinationCity}, ${activeTrip.destinationCountry}`
      : activeTrip?.name);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.93}
      onPress={() => onPress?.(user)}
      disabled={!onPress}
    >
      {/* Cover Image Banner */}
      <View style={styles.coverWrapper}>
        {user.coverUrl ? (
          <Image source={{ uri: user.coverUrl }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder} />
        )}

        {/* Date Range Badge (if upcoming trip exists) */}
        {tripDates ? (
          <View style={styles.dateBadge}>
            <Calendar size={11} color="#FFFFFF" />
            <Text style={styles.dateText}>{tripDates}</Text>
          </View>
        ) : null}

        {/* Travel Style Badge (if available) */}
        {activeTrip?.travelStyle ? (
          <View style={styles.styleBadge}>
            <Text style={styles.styleText}>{activeTrip.travelStyle}</Text>
          </View>
        ) : null}
      </View>

      {/* Floating Avatar */}
      <View style={styles.avatarWrapper}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {user.fullName?.charAt(0) || 'T'}
            </Text>
          </View>
        )}
      </View>

      {/* Card Content Body */}
      <View style={styles.body}>
        {/* Top: Name, Age, Home Location */}
        <View style={[styles.nameSection, !destinationText && { marginBottom: 14 }]}>
          <Text style={styles.name} numberOfLines={1}>
            {user.fullName}{user.age ? `, ${user.age}` : ''}
          </Text>

          <View style={styles.homeLocationRow}>
            <MapPin size={12} color={theme.colors.textMuted} />
            <Text style={styles.homeLocation} numberOfLines={1}>
              {user.city ? `${user.city}, ` : ''}{user.state || user.country || 'Solo Explorer'}
            </Text>
          </View>
        </View>

        {/* Destination Highlight Box (The Trip they're looking for buddies for!) */}
        {destinationText ? (
          <View style={styles.destinationBox}>
            <View style={styles.destinationIconCircle}>
              <Luggage size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.destinationInfo}>
              <Text style={styles.destinationLabel}>Looking for buddies for</Text>
              <Text style={styles.destinationName} numberOfLines={1}>
                {destinationText}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Bio Snippet if available */}
        {user.bio ? (
          <Text style={styles.bioText} numberOfLines={2}>
            "{user.bio}"
          </Text>
        ) : null}

        {/* Interests Pills */}
        {user.interests && user.interests.length > 0 && (
          <View style={styles.interestsRow}>
            {user.interests.slice(0, 3).map((interest, idx) => (
              <View key={idx} style={styles.interestChip}>
                <Text style={styles.interestChipText}>{interest}</Text>
              </View>
            ))}
            {user.interests.length > 3 && (
              <View style={styles.interestMoreChip}>
                <Text style={styles.interestMoreText}>+{user.interests.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionRow}>
          {connectionStatus === 'CONNECTED' ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnConnected]}
              onPress={() => onMessagePress?.(user)}
              activeOpacity={0.85}
            >
              <MessageSquare size={15} color="#FFFFFF" />
              <Text style={styles.btnTextLight}>Message Mate</Text>
            </TouchableOpacity>
          ) : connectionStatus === 'REQUEST_RECEIVED' ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnAccept]}
              onPress={() => onAcceptPress?.(user)}
              activeOpacity={0.85}
            >
              <Check size={15} color="#FFFFFF" />
              <Text style={styles.btnTextLight}>Accept Request</Text>
            </TouchableOpacity>
          ) : connectionStatus === 'REQUEST_SENT' ? (
            <View style={[styles.btn, styles.btnSent]}>
              <Text style={styles.btnTextMuted}>Request Sent</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.btn, styles.btnConnect]}
              onPress={() => onConnectPress(user)}
              activeOpacity={0.85}
            >
              <UserPlus size={15} color="#FFFFFF" />
              <Text style={styles.btnTextLight}>Connect</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8ECE9',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  coverWrapper: {
    height: 120,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0F6E56',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#005440',
  },
  dateBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  styleBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 84, 64, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  styleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  avatarWrapper: {
    position: 'absolute',
    top: 90,
    left: 18,
    zIndex: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#EAEAEA',
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  body: {
    paddingTop: 36,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  nameSection: {
    marginBottom: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  homeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  homeLocation: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  destinationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8F4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginTop: 14,
    marginBottom: 14,
    gap: 10,
  },
  destinationIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationInfo: {
    flex: 1,
  },
  destinationLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  destinationName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#181D1A',
    marginTop: 1,
  },
  bioText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 17,
    marginBottom: 10,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  interestChip: {
    backgroundColor: '#F3F6F4',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  interestChipText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  interestMoreChip: {
    backgroundColor: '#F3F6F4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  interestMoreText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  actionRow: {
    marginTop: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  btnConnect: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  btnConnected: {
    backgroundColor: '#005440',
  },
  btnAccept: {
    backgroundColor: '#0F6E56',
  },
  btnSent: {
    backgroundColor: '#F1F4F1',
  },
  btnTextLight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnTextMuted: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
});
