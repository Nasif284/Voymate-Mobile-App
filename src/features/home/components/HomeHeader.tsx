import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../../config/theme';
import { Compass, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface HomeHeaderProps {
  userName: string;
  avatarUrl?: string | null;
  location?: string | null;
  isTraveling: boolean;
  onToggleTraveling: () => void;
  isUpdatingStatus?: boolean;
  onAvatarPress?: () => void;
}

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userName,
  avatarUrl,
  location,
  isTraveling,
  onToggleTraveling,
  isUpdatingStatus,
  onAvatarPress,
}) => {
  const firstName = userName ? userName.split(' ')[0] : 'Traveler';
  const greeting = getTimeGreeting();

  const handleToggle = () => {
    if (isUpdatingStatus) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleTraveling();
  };

  return (
    <View style={styles.container}>
      {/* Main Header Row */}
      <View style={styles.headerRow}>
        {/* Left: Greeting & Name */}
        <View style={styles.leftCol}>
          <Text style={styles.timeGreeting}>{greeting},</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {firstName} 👋
          </Text>
          {location && (
            <View style={styles.locationPill}>
              <MapPin size={10} color={theme.colors.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}
        </View>

        {/* Right: Traveling Toggle Button & User Avatar */}
        <View style={styles.rightCol}>
          {/* Creative Compact Traveling Pill */}
          <TouchableOpacity
            style={[
              styles.travelPill,
              isTraveling ? styles.travelPillActive : styles.travelPillInactive,
            ]}
            onPress={handleToggle}
            activeOpacity={0.7}
            disabled={isUpdatingStatus}
            hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
            accessibilityRole="switch"
            accessibilityState={{ checked: isTraveling, busy: isUpdatingStatus }}
            accessibilityLabel={`Traveling status: currently ${isTraveling ? 'traveling' : 'at home'}. Tap to toggle.`}
          >
            {isUpdatingStatus ? (
              <ActivityIndicator
                size="small"
                color={isTraveling ? theme.colors.primary : theme.colors.textMuted}
                style={{ transform: [{ scale: 0.7 }] }}
              />
            ) : (
              <>
                <View
                  style={[
                    styles.statusDot,
                    isTraveling ? styles.statusDotActive : styles.statusDotInactive,
                  ]}
                />
                <Text
                  style={[
                    styles.travelPillText,
                    isTraveling ? styles.travelPillTextActive : styles.travelPillTextInactive,
                  ]}
                >
                  {isTraveling ? 'Traveling' : 'At Home'}
                </Text>
                <Compass
                  size={12}
                  color={isTraveling ? theme.colors.primary : theme.colors.textMuted}
                />
              </>
            )}
          </TouchableOpacity>

          {/* User Avatar */}
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={onAvatarPress}
            activeOpacity={onAvatarPress ? 0.8 : 1}
            disabled={!onAvatarPress}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isTraveling && <View style={styles.onlineBadge} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
    paddingRight: 12,
  },
  timeGreeting: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textMuted,
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 2,
    letterSpacing: -0.4,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF8F4',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    marginTop: 5,
    gap: 3.5,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  travelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5.5,
  },
  travelPillActive: {
    backgroundColor: '#EBF6F1',
    borderColor: 'rgba(15, 110, 86, 0.3)',
  },
  travelPillInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8E4',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  statusDotInactive: {
    backgroundColor: '#BEC9C3',
  },
  travelPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  travelPillTextActive: {
    color: theme.colors.primary,
  },
  travelPillTextInactive: {
    color: theme.colors.textSecondary,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#EAEAEA',
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
