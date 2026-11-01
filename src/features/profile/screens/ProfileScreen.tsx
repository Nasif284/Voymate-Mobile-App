import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../config/theme';
import { useAuthStore } from '../../../store/authStore';
import {
  useGetMe,
  useGetProfileUpcomingTrips,
  useUpdateProfile,
  useUpdateAvatar,
  useUpdateCover,
} from '../hooks/profile.hooks';
import {
  useGetConnections,
  useGetIncomingRequests,
} from '../../connections/hooks/connection.hooks';
import { ProfileAttributesCard } from '../components/ProfileAttributesCard';
import { ProfileBioCard } from '../components/ProfileBioCard';
import { ProfileUpcomingTrips } from '../components/ProfileUpcomingTrips';
import { EditProfileModal } from '../components/EditProfileModal';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  Camera,
  MapPin,
  Calendar,
  LogOut,
  Edit3,
  Radio,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { StatusBar } from 'expo-status-bar';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: authUser, logout } = useAuthStore();

  const [showEditModal, setShowEditModal] = useState(false);

  // TanStack Query Hooks
  const { data: profile = null } = useGetMe();
  const { data: connections = [] } = useGetConnections();
  const { data: incomingRequests = [] } = useGetIncomingRequests();
  const { data: upcomingTrips = [] } = useGetProfileUpcomingTrips(profile?.id);

  const updateProfileMutation = useUpdateProfile();
  const updateAvatarMutation = useUpdateAvatar();
  const updateCoverMutation = useUpdateCover();

  const connectionsCount = connections.length;
  const incomingRequestsCount = incomingRequests.length;
  const isUpdatingTraveling = updateProfileMutation.isPending;

  // Handle Pick and Upload Avatar
  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Please allow gallery access to upload a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateAvatarMutation.mutate(result.assets[0].uri);
    }
  };

  // Handle Pick and Upload Cover
  const handlePickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Denied', 'Please allow gallery access to upload a cover photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      updateCoverMutation.mutate(result.assets[0].uri);
    }
  };

  // Toggle Traveling State
  const handleToggleTraveling = (newVal: boolean) => {
    if (!profile || isUpdatingTraveling) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    updateProfileMutation.mutate({
      fullName: profile.fullName,
      bio: profile.bio || '',
      isTraveling: newVal,
      travelPersonalityCode: profile.travelPersonality || undefined,
      interests: profile.interests || [],
      languages: profile.languages || [],
      skills: profile.skills || [],
    });
  };

  // Confirm and Log Out
  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            logout();
          },
        },
      ]
    );
  };

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : '';

  const locationString = [profile?.city, profile?.state, profile?.country]
    .filter(Boolean)
    .join(', ');

  const tabBarHeight = 82 + insets.bottom;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo Header */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePickCover}
          style={styles.coverContainer}
        >
          {profile?.coverUrl ? (
            <Image
              source={{ uri: profile.coverUrl }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.coverFallback}>
              <View style={styles.coverGradientSim} />
            </View>
          )}
          <View style={styles.coverDarkGradient} />

          {/* Bottom Right: Change Cover */}
          <TouchableOpacity
            style={styles.changeCoverBtn}
            onPress={handlePickCover}
            activeOpacity={0.8}
          >
            <Camera size={13} color={theme.colors.white} />
            <Text style={styles.changeCoverBtnText}>Change cover</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Profile Identity Card */}
        <View style={styles.identityCard}>
          {/* Avatar Row */}
          <View style={styles.avatarRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePickAvatar}
              style={styles.avatarWrapper}
            >
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {profile?.fullName?.charAt(0)?.toUpperCase() ||
                      authUser?.fullName?.charAt(0)?.toUpperCase() ||
                      'V'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Camera size={14} color={theme.colors.white} />
              </View>
            </TouchableOpacity>

            {/* Edit Profile Action Group */}
            <View style={styles.actionButtonGroup}>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => setShowEditModal(true)}
                activeOpacity={0.8}
              >
                <Edit3 size={15} color={theme.colors.primary} />
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* User Name & Demographics */}
          <View style={styles.nameSection}>
            <Text style={styles.nameText}>
              {profile?.fullName || authUser?.fullName || 'Voymate Traveler'}
            </Text>
            {locationString ? (
              <View style={styles.locationRow}>
                <MapPin size={13} color={theme.colors.primary} />
                <Text style={styles.locationText}>{locationString}</Text>
              </View>
            ) : null}
            {memberSince ? (
              <View style={styles.memberRow}>
                <Calendar size={12} color={theme.colors.textSecondary} />
                <Text style={styles.memberText}>Member since {memberSince}</Text>
              </View>
            ) : null}
          </View>

          {/* Instagram-Style Stats Bar */}
          <View style={styles.statsBar}>
            {/* Journeys (Tappable) */}
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Trips', { initialTab: 'active' });
              }}
            >
              <Text style={styles.statNumber}>
                {profile?.tripCount !== undefined ? profile.tripCount : upcomingTrips.length}
              </Text>
              <Text style={styles.statLabel}>TRIPS</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            {/* Mates / Connections (Tappable) */}
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Connections', { initialTab: 'connections' });
              }}
            >
              <Text style={styles.statNumber}>
                {connectionsCount}
              </Text>
              <Text style={styles.statLabel}>MATES</Text>
            </TouchableOpacity>

            <View style={styles.statDivider} />

            {/* Requests (Tappable) */}
            <TouchableOpacity
              style={styles.statItem}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Connections', {
                  initialTab: 'requests',
                  initialSubTab: 'incoming',
                });
              }}
            >
              <View style={styles.statNumberRow}>
                <Text style={styles.statNumber}>
                  {incomingRequestsCount}
                </Text>
                {incomingRequestsCount > 0 && <View style={styles.statBadgeDot} />}
              </View>
              <Text style={styles.statLabel}>REQUESTS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Traveling Mode Toggle Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleToggleTraveling(!profile?.isTraveling)}
          style={[
            styles.travelingCard,
            profile?.isTraveling ? styles.travelingCardActive : styles.travelingCardInactive,
          ]}
        >
          <View style={styles.travelingHeader}>
            <View
              style={[
                styles.travelingIconWrap,
                profile?.isTraveling
                  ? styles.travelingIconWrapActive
                  : styles.travelingIconWrapInactive,
              ]}
            >
              <Radio
                size={18}
                color={profile?.isTraveling ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>

            <View style={styles.travelingTextWrap}>
              <Text style={styles.travelingTitle}>
                {profile?.isTraveling ? 'Currently Traveling' : 'Not Traveling'}
              </Text>
              <Text style={styles.travelingSubtitle}>
                {profile?.isTraveling
                  ? 'Visible to travelers near your current location.'
                  : 'Turn on during your trip to meet travelers nearby.'}
              </Text>
            </View>

            {isUpdatingTraveling ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Switch
                value={Boolean(profile?.isTraveling)}
                onValueChange={handleToggleTraveling}
                disabled={isUpdatingTraveling}
                trackColor={{ false: theme.colors.surfaceDim, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : theme.colors.white}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Bio Card */}
        <ProfileBioCard
          name={profile?.fullName || authUser?.fullName || 'You'}
          bio={profile?.bio}
          onAddBio={() => setShowEditModal(true)}
        />

        {/* Travel Attributes & Preferences */}
        {profile && (
          <ProfileAttributesCard
            travelType={profile.travelType}
            travelPersonality={profile.travelPersonality}
            languages={profile.languages}
            skills={profile.skills}
            interests={profile.interests}
          />
        )}

        {/* Upcoming Journeys */}
        <ProfileUpcomingTrips
          trips={upcomingTrips}
          onTripPress={() => navigation.navigate('Trips', { initialTab: 'active' })}
          onSeeAll={() => navigation.navigate('Trips', { initialTab: 'active' })}
        />

        {/* Log Out Button at Very Bottom */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.bottomLogoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
          >
            <LogOut size={13} color={theme.colors.error} strokeWidth={2.2} />
            <Text style={styles.bottomLogoutText}>Log out</Text>
          </TouchableOpacity>
          <Text style={styles.appVersionText}>Voymate • v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          visible={showEditModal}
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={async (payload) => {
            await updateProfileMutation.mutateAsync(payload);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
    opacity: 0.85,
  },
  coverDarkGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.overlay,
  },
  changeCoverBtn: {
    position: 'absolute',
    bottom: 42,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.overlay,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  changeCoverBtnText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  identityCard: {
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
  cameraBadge: {
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
  actionButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryMist,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
  },
  editProfileButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  nameSection: {
    marginBottom: 16,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  memberText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  statBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: theme.colors.primary,
    marginTop: -8,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border,
  },
  travelingCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  travelingCardActive: {
    backgroundColor: theme.colors.primaryMist,
    borderColor: theme.colors.primaryBorder,
  },
  travelingCardInactive: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  travelingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  travelingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  travelingIconWrapActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  travelingIconWrapInactive: {
    backgroundColor: theme.colors.surfaceSubtle,
  },
  travelingTextWrap: {
    flex: 1,
  },
  travelingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  travelingSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  logoutSection: {
    marginTop: 24,
    marginBottom: 12,
    alignItems: 'center',
  },
  bottomLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.errorLight,
    borderWidth: 1,
    borderColor: theme.colors.errorLight,
  },
  bottomLogoutText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.colors.error,
    letterSpacing: 0.1,
  },
  appVersionText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textPlaceholder,
    marginTop: 10,
    letterSpacing: 0.2,
  },
});
