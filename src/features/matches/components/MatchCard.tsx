import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { theme } from '../../../config/theme';
import { TripMatchItem } from '../types';
import {
  Calendar,
  Luggage,
  MapPin,
  UserPlus,
  Check,
  MessageSquare,
  Sparkles,
} from 'lucide-react-native';

interface MatchCardProps {
  match: TripMatchItem;
  connectionStatus: 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
  onPress?: (match: TripMatchItem) => void;
  onConnectPress: (match: TripMatchItem) => void;
  onAcceptPress?: (match: TripMatchItem) => void;
  onMessagePress?: (match: TripMatchItem) => void;
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

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  connectionStatus,
  onPress,
  onConnectPress,
  onAcceptPress,
  onMessagePress,
}) => {
  const { user, tripMatch } = match;

  const dateFrom = tripMatch.dateFrom ? formatDate(tripMatch.dateFrom) : '';
  const dateTo = tripMatch.dateTo ? formatDate(tripMatch.dateTo) : '';
  const dateRangeStr = dateFrom && dateTo ? `${dateFrom} - ${dateTo}` : '';

  const matchScore = tripMatch.totalPoints;
  const destination = tripMatch.destination;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.93}
      onPress={() => onPress?.(match)}
      disabled={!onPress}
    >
      {/* Cover Image Banner */}
      <View style={styles.coverWrapper}>
        {user.coverUrl ? (
          <Image source={{ uri: user.coverUrl }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder} />
        )}

        {/* Date Range Badge */}
        {dateRangeStr ? (
          <View style={styles.dateBadge}>
            <Calendar size={11} color={theme.colors.white} />
            <Text style={styles.dateText}>{dateRangeStr}</Text>
          </View>
        ) : null}

        {/* Compatibility Match Badge */}
        {matchScore != null && (
          <View style={styles.matchScoreBadge}>
            <Sparkles size={11} color={theme.colors.white} />
            <Text style={styles.matchScoreText}>{matchScore}% Match</Text>
          </View>
        )}
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

      {/* Card Body */}
      <View style={styles.body}>
        {/* Name & Origin */}
        <View style={styles.nameSection}>
          <Text style={styles.name} numberOfLines={1}>
            {user.fullName}
          </Text>

          <View style={styles.homeLocationRow}>
            <MapPin size={12} color={theme.colors.textMuted} />
            <Text style={styles.homeLocation} numberOfLines={1}>
              {user.city ? `${user.city}, ` : ''}{user.state || user.country || 'Solo Explorer'}
            </Text>
          </View>
        </View>

        {/* Destination Box with Equal Spacing */}
        {destination ? (
          <View style={styles.destinationBox}>
            <View style={styles.destinationIconCircle}>
              <Luggage size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.destinationInfo}>
              <Text style={styles.destinationLabel}>Overlapping destination</Text>
              <Text style={styles.destinationName} numberOfLines={1}>
                {destination}
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

        {/* Interests Chips */}
        {user.interests && user.interests.length > 0 && (
          <View style={styles.interestsRow}>
            {user.interests.slice(0, 3).map((item, idx) => (
              <View key={idx} style={styles.interestChip}>
                <Text style={styles.interestChipText}>{item}</Text>
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
              onPress={() => onMessagePress?.(match)}
              activeOpacity={0.85}
            >
              <MessageSquare size={15} color={theme.colors.white} />
              <Text style={styles.btnTextLight}>Message Mate</Text>
            </TouchableOpacity>
          ) : connectionStatus === 'REQUEST_RECEIVED' ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnAccept]}
              onPress={() => onAcceptPress?.(match)}
              activeOpacity={0.85}
            >
              <Check size={15} color={theme.colors.white} />
              <Text style={styles.btnTextLight}>Accept Request</Text>
            </TouchableOpacity>
          ) : connectionStatus === 'REQUEST_SENT' ? (
            <View style={[styles.btn, styles.btnSent]}>
              <Text style={styles.btnTextMuted}>Request Sent</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.btn, styles.btnConnect]}
              onPress={() => onConnectPress(match)}
              activeOpacity={0.85}
            >
              <UserPlus size={15} color={theme.colors.white} />
              <Text style={styles.btnTextLight}>Connect</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  coverWrapper: {
    height: 120,
    width: '100%',
    position: 'relative',
    backgroundColor: theme.colors.primaryDark,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primaryDark,
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
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  matchScoreBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  matchScoreText: {
    color: theme.colors.onPrimary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
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
    borderColor: theme.colors.surface,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  avatarFallbackText: {
    color: theme.colors.onPrimary,
    fontSize: 22,
    fontWeight: '600',
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
    fontWeight: '700',
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
    backgroundColor: theme.colors.surfaceSubtle,
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
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.textPrimary,
    marginTop: 1,
  },
  bioText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 17,
    marginBottom: 12,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  interestChip: {
    backgroundColor: theme.colors.surfaceSubtle,
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
    backgroundColor: theme.colors.surfaceSubtle,
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
    backgroundColor: theme.colors.primaryDark,
  },
  btnAccept: {
    backgroundColor: theme.colors.primary,
  },
  btnSent: {
    backgroundColor: theme.colors.surfaceSubtle,
  },
  btnTextLight: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
  btnTextMuted: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
});
