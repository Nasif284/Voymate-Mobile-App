import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { theme } from '../../../config/theme';
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
  Radio,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const firstName = user.fullName?.split(' ')[0] || 'Traveler';

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
            <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Top Right Badges */}
        <View style={styles.topRightBadges}>
          {distanceKm !== undefined && (
            <View style={styles.distanceBadge}>
              <MapPin size={11} color="#FFFFFF" />
              <Text style={styles.distanceText}>
                {distanceKm < 1 ? '< 1 km away' : `${distanceKm.toFixed(1)} km away`}
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
              <Sparkles size={13} color="#005440" />
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
              {user.age ? `, ${user.age}` : ''}
            </Text>
          </View>

          {/* Location & Member Since */}
          <View style={styles.metaRow}>
            {locationString ? (
              <View style={styles.metaItem}>
                <MapPin size={13} color="#005440" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {locationString}
                </Text>
              </View>
            ) : null}

            {memberSince ? (
              <View style={styles.metaItem}>
                <Calendar size={13} color="#5C6B64" />
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
                <MessageSquare size={16} color="#005440" />
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>

              {/* Dynamic Connection Button */}
              {connectionStatus === 'CONNECTED' ? (
                <View style={styles.connectedBadge}>
                  <Check size={14} color="#005440" strokeWidth={2.5} />
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
                  <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.acceptButtonText}>Accept Request</Text>
                </TouchableOpacity>
              ) : connectionStatus === 'REQUEST_SENT' ? (
                <View style={styles.requestSentBadge}>
                  <Clock size={14} color="#5C6B64" />
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
                  <UserPlus size={16} color="#FFFFFF" />
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
    backgroundColor: '#F8FAF8',
  },
  coverContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#003E2F',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#005440',
  },
  coverGradientSim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#003E2F',
    opacity: 0.8,
  },
  coverDarkGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(21, 29, 25, 0.45)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  distanceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  travelingLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 84, 64, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(160, 243, 212, 0.4)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  travelingLiveText: {
    color: '#A0F3D4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
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
    borderColor: '#FFFFFF',
    backgroundColor: '#E8F5EE',
    shadowColor: '#000',
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
    backgroundColor: '#005440',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#005440',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C9EADB',
    marginBottom: 4,
  },
  matchScoreText: {
    color: '#005440',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  personalityPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
    maxWidth: 160,
  },
  personalityText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '700',
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
    fontWeight: '900',
    color: '#151D19',
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
    color: '#005440',
  },
  metaMutedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5C6B64',
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
    backgroundColor: '#E8F5EE',
    borderWidth: 1,
    borderColor: '#C9EADB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#005440',
  },
  connectButton: {
    flex: 1.3,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#005440',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#005440',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  acceptButton: {
    flex: 1.3,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#005440',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  connectedBadge: {
    flex: 1.3,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E8F5EE',
    borderWidth: 1,
    borderColor: '#A0F3D4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  connectedBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#005440',
  },
  requestSentBadge: {
    flex: 1.3,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  requestSentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  editProfileButton: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#005440',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editProfileButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
