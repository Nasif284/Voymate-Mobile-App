import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { theme } from '../../../config/theme';
import { UserWithDetails } from '../types';
import { formatDistanceKm } from '../../../utils/formatters';
import { MapPin, UserPlus, Check, MessageSquare } from 'lucide-react-native';

interface NearbyTravelersCarouselProps {
  users: UserWithDetails[];
  onConnectPress: (user: UserWithDetails) => void;
  onAcceptPress?: (user: UserWithDetails) => void;
  onMessagePress?: (user: UserWithDetails) => void;
  onUserPress?: (user: UserWithDetails) => void;
  connectionsMap: Record<string, 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE'>;
}

export const NearbyTravelersCarousel: React.FC<NearbyTravelersCarouselProps> = ({
  users,
  onConnectPress,
  onAcceptPress,
  onMessagePress,
  onUserPress,
  connectionsMap,
}) => {
  if (users.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <MapPin size={15} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Travelers Near You</Text>
            <Text style={styles.sectionSubtitle}>Solo travelers within 50 km</Text>
          </View>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{users.length}</Text>
        </View>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={220}
        snapToAlignment="start"
      >
        {users.map((user) => {
          const status = connectionsMap[user.id] || user.connectionStatus || 'NONE';
          const rawDistance = user.distanceKm ?? (user as any).distance ?? (user as any).distance_km;
          const distance = formatDistanceKm(rawDistance);

          return (
            <TouchableOpacity
              key={user.id}
              style={styles.card}
              activeOpacity={0.92}
              onPress={() => onUserPress?.(user)}
              disabled={!onUserPress}
            >
              {/* Cover Banner */}
              <View style={styles.coverWrapper}>
                {user.coverUrl ? (
                  <Image source={{ uri: user.coverUrl }} style={styles.coverImage} />
                ) : (
                  <View style={styles.coverPlaceholder} />
                )}
                {/* Distance Badge */}
                <View style={styles.distanceBadge}>
                  <MapPin size={10} color={theme.colors.white} />
                  <Text style={styles.distanceText}>{distance}</Text>
                </View>
              </View>

              {/* Avatar Floating */}
              <View style={styles.avatarWrapper}>
                {user.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {user.fullName?.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.fullName}
                </Text>

                <Text style={styles.userLocation} numberOfLines={1}>
                  {user.city ? `${user.city}, ` : ''}{user.state || user.country || 'Traveling'}
                </Text>

                {/* Interest Tags */}
                {user.interests && user.interests.length > 0 && (
                  <View style={styles.interestsRow}>
                    {user.interests.slice(0, 2).map((item, idx) => (
                      <View key={idx} style={styles.interestTag}>
                        <Text style={styles.interestText} numberOfLines={1}>
                          {item}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Button */}
                <View style={styles.actionContainer}>
                  {status === 'CONNECTED' ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnConnected]}
                      onPress={() => onMessagePress ? onMessagePress(user) : onConnectPress(user)}
                    >
                      <MessageSquare size={13} color={theme.colors.white} />
                      <Text style={styles.btnTextLight}>Message</Text>
                    </TouchableOpacity>
                  ) : status === 'REQUEST_SENT' ? (
                    <View style={[styles.actionBtn, styles.btnSent]}>
                      <Text style={styles.btnTextMuted}>Sent</Text>
                    </View>
                  ) : status === 'REQUEST_RECEIVED' ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnAccept]}
                      onPress={() => onAcceptPress ? onAcceptPress(user) : onConnectPress(user)}
                    >
                      <Check size={13} color={theme.colors.white} />
                      <Text style={styles.btnTextLight}>Accept</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.btnConnect]}
                      onPress={() => onConnectPress(user)}
                      activeOpacity={0.8}
                    >
                      <UserPlus size={13} color={theme.colors.primary} />
                      <Text style={styles.btnTextConnect}>Connect</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  scrollContent: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 12,
  },
  card: {
    width: 205,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    shadowColor: theme.colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  coverWrapper: {
    height: 75,
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
  distanceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  distanceText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  avatarWrapper: {
    position: 'absolute',
    top: 50,
    left: 14,
    zIndex: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: theme.colors.surface,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: theme.colors.surface,
  },
  avatarFallbackText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  cardBody: {
    paddingTop: 26,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  userLocation: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  interestsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
    marginBottom: 10,
  },
  interestTag: {
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 80,
  },
  interestText: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  btnConnect: {
    backgroundColor: theme.colors.primaryMist,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  btnTextConnect: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  btnConnected: {
    backgroundColor: theme.colors.primary,
  },
  btnAccept: {
    backgroundColor: theme.colors.primaryDark,
  },
  btnSent: {
    backgroundColor: theme.colors.surfaceSubtle,
  },
  btnTextLight: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  btnTextMuted: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
});
