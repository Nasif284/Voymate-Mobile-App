import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { UserProfileData, ProfileVariant } from '../types';
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Sparkles,
  MessageSquare,
  UserPlus,
  Check,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../../config/theme';
import { formatDistanceKm } from '../../../utils/formatters';

interface ProfileHeroProps {
  user: UserProfileData;
  variant?: ProfileVariant;
  matchScore?: number | null;
  distanceKm?: number;
  connectionStatus?: 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
  isOwnProfile?: boolean;
  onBackPress?: () => void;
  onConnectPress?: () => void;
  onAcceptPress?: () => void;
  onMessagePress?: () => void;
  onEditPress?: () => void;
  onAvatarPress?: () => void;
  onCoverPress?: () => void;
}

const formatMemberDate = (dateVal?: string | Date) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

export const ProfileHero: React.FC<ProfileHeroProps> = ({
  user,
  variant,
  matchScore,
  distanceKm,
  connectionStatus = 'NONE',
  isOwnProfile = false,
  onBackPress,
  onConnectPress,
  onAcceptPress,
  onMessagePress,
  onEditPress,
  onAvatarPress,
  onCoverPress,
}) => {
  const locationString = [user.city, user.state, user.country]
    .filter(Boolean)
    .join(', ');

  const memberSince = formatMemberDate(user.createdAt);

  return (
    <View style={styles.container}>
      {/* Cover Image Banner */}
      <TouchableOpacity
        activeOpacity={isOwnProfile ? 0.85 : 1}
        onPress={isOwnProfile ? onCoverPress : undefined}
        style={styles.coverContainer}
      >
        {user.coverUrl ? (
          <Image
            source={{ uri: user.coverUrl }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.coverFallback}>
            <View style={styles.coverGradientSim} />
          </View>
        )}
        <View style={styles.coverDarkGradient} />

        {/* Back Button (Only for public profiles) */}
        {onBackPress && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBackPress();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={22} color={theme.colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Top Right Badges */}
        <View style={styles.topRightBadges}>
          {distanceKm !== undefined && (
            <View style={styles.distanceBadge}>
              <MapPin size={11} color={theme.colors.white} />
              <Text style={styles.distanceText}>
                {formatDistanceKm(distanceKm)}
              </Text>
            </View>
          )}

          {user.isTraveling && (
            <View style={styles.travelingLiveBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.travelingLiveText}>Traveling Now</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Profile Overlapping Card */}
      <View style={styles.profileCard}>
        {/* Floating Avatar */}
        <View style={styles.avatarRow}>
          <TouchableOpacity
            activeOpacity={isOwnProfile ? 0.85 : 1}
            onPress={isOwnProfile ? onAvatarPress : undefined}
            style={styles.avatarWrapper}
          >
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>
                  {user.fullName?.charAt(0)?.toUpperCase() || 'V'}
                </Text>
              </View>
            )}

            {isOwnProfile && (
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditIcon}>📷</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Quick Match / Status Pill */}
          {matchScore !== undefined && matchScore !== null ? (
            <View style={styles.matchScorePill}>
              <Sparkles size={13} color={theme.colors.primary} />
              <Text style={styles.matchScoreText}>{matchScore}% Match</Text>
            </View>
          ) : user.travelPersonality ? (
            <View style={styles.personalityPill}>
              <Text style={styles.personalityText} numberOfLines={1}>
                {user.travelPersonality}
              </Text>
            </View>
          ) : null}
        </View>

        {/* User Details */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {user.fullName}
            </Text>
          </View>

          {/* Location & Member Since */}
          <View style={styles.metaRow}>
            {locationString ? (
              <View style={styles.metaItem}>
                <MapPin size={13} color={theme.colors.primary} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {locationString}
                </Text>
              </View>
            ) : null}

            {memberSince ? (
              <View style={styles.metaItem}>
                <Calendar size={13} color={theme.colors.textSecondary} />
                <Text style={styles.metaMutedText}>Member since {memberSince}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Action Buttons Bar */}
        <View style={styles.actionRow}>
          {isOwnProfile ? (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={onEditPress}
              activeOpacity={0.8}
            >
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <>
              {/* Message Button */}
              <TouchableOpacity
                style={styles.messageButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onMessagePress?.();
                }}
                activeOpacity={0.8}
              >
                <MessageSquare size={16} color={theme.colors.primary} />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>

              {/* Dynamic Connection Button */}
              {connectionStatus === 'CONNECTED' ? (
                <View style={styles.connectedBadge}>
                  <Check size={14} color={theme.colors.primary} strokeWidth={2.5} />
                  <Text style={styles.connectedBadgeText}>Connected</Text>
                </View>
              ) : connectionStatus === 'REQUEST_RECEIVED' ? (
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onAcceptPress?.();
                  }}
                  activeOpacity={0.8}
                >
                  <Check size={16} color={theme.colors.white} strokeWidth={2.5} />
                  <Text style={styles.acceptButtonText}>Accept Request</Text>
                </TouchableOpacity>
              ) : connectionStatus === 'REQUEST_SENT' ? (
                <View style={styles.requestSentBadge}>
                  <Clock size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.requestSentText}>Request Sent</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onConnectPress?.();
                  }}
                  activeOpacity={0.8}
                >
                  <UserPlus size={16} color={theme.colors.white} />
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: theme.colors.background,
  },
  coverContainer: {
    width: '100%',
    height: 220,
    backgroundColor: theme.colors.primaryDark,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primaryDark,
  },
  coverGradientSim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.primaryDark,
    opacity: 0.8,
  },
  coverDarkGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.overlay,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topRightBadges: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.overlay,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  distanceText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  travelingLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.overlay,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },
  travelingLiveText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: -45,
    marginBottom: 12,
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: theme.colors.surface,
    backgroundColor: theme.colors.surfaceSubtle,
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '700',
    color: theme.colors.white,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditIcon: {
    fontSize: 12,
  },
  matchScorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.primaryMist,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    marginBottom: 4,
  },
  matchScoreText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  personalityPill: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
    maxWidth: 160,
  },
  personalityText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  metaMutedText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  messageButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryMist,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  connectButton: {
    flex: 1.3,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
  },
  acceptButton: {
    flex: 1.3,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
  },
  connectedBadge: {
    flex: 1.3,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryMist,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  connectedBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  requestSentBadge: {
    flex: 1.3,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  requestSentText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  editProfileButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
  },
});
