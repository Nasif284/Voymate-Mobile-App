import React, { useState, useEffect, useCallback } from 'react';
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
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/authStore';
import { profileService } from '../services/profile.service';
import { connectionService } from '../../connections/services/connection.service';
import { UserProfileData, ProfileUpcomingTrip } from '../types';
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
  Compass,
  Users,
  ShieldCheck,
  PlusCircle,
  LogOut,
  Edit3,
  Radio,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: authUser, logout } = useAuthStore();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<ProfileUpcomingTrip[]>([]);
  const [connectionsCount, setConnectionsCount] = useState<number>(0);
  const [incomingRequestsCount, setIncomingRequestsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingTraveling, setIsUpdatingTraveling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchProfileData = useCallback(async () => {
    try {
      const [data, conns, incomingReqs] = await Promise.all([
        profileService.getMe(),
        connectionService.getConnections().catch(() => []),
        connectionService.getIncomingRequests().catch(() => []),
      ]);

      setProfile(data);
      setConnectionsCount(conns.length);
      setIncomingRequestsCount(incomingReqs.length);

      if (data?.id) {
        try {
          const trips = await profileService.getUserUpcomingTrips(data.id);
          setUpcomingTrips(trips);
        } catch {
          // Non-critical
        }
      }
    } catch (err) {
      console.warn('Error fetching personal profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  // Handle Pick and Upload Avatar
  const handlePickAvatar = async () => {
    try {
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
        setIsLoading(true);
        await profileService.updateAvatar(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await fetchProfileData();
      }
    } catch (err) {
      Alert.alert('Upload Failed', 'Could not update profile photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Pick and Upload Cover
  const handlePickCover = async () => {
    try {
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
        setIsLoading(true);
        await profileService.updateCover(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await fetchProfileData();
      }
    } catch (err) {
      Alert.alert('Upload Failed', 'Could not update cover photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Traveling State
  const handleToggleTraveling = async (newVal: boolean) => {
    if (!profile || isUpdatingTraveling) return;
    const prevVal = profile.isTraveling;
    // Optimistic update
    setProfile((prev) => (prev ? { ...prev, isTraveling: newVal } : null));
    setIsUpdatingTraveling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await profileService.updateProfile({
        fullName: profile.fullName,
        bio: profile.bio || '',
        isTraveling: newVal,
        travelPersonalityCode: profile.travelPersonality || undefined,
        interests: profile.interests || [],
        languages: profile.languages || [],
        skills: profile.skills || [],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Revert on error
      setProfile((prev) => (prev ? { ...prev, isTraveling: prevVal } : null));
      Alert.alert('Update Failed', 'Could not update traveling status.');
    } finally {
      setIsUpdatingTraveling(false);
    }
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
            <Camera size={13} color="#FFFFFF" />
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
                <Camera size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Edit Profile Action Group */}
            <View style={styles.actionButtonGroup}>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => setShowEditModal(true)}
                activeOpacity={0.8}
              >
                <Edit3 size={15} color="#005440" />
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* User Name & Demographics */}
          <View style={styles.nameSection}>
            <Text style={styles.nameText}>
              {profile?.fullName || authUser?.fullName || 'Voymate Traveler'}
              {profile?.age ? `, ${profile.age}` : ''}
            </Text>
            {locationString ? (
              <View style={styles.locationRow}>
                <MapPin size={13} color="#005440" />
                <Text style={styles.locationText}>{locationString}</Text>
              </View>
            ) : null}
            {memberSince ? (
              <View style={styles.memberRow}>
                <Calendar size={12} color="#5C6B64" />
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
              <Text style={styles.statLabel}>JOURNEYS</Text>
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
                color={profile?.isTraveling ? '#005440' : '#5C6B64'}
              />
            </View>

            <View style={styles.travelingTextWrap}>
              <Text style={styles.travelingTitle}>
                {profile?.isTraveling ? 'Traveling Now' : 'Not Traveling'}
              </Text>
              <Text style={styles.travelingSubtitle}>
                {profile?.isTraveling
                  ? 'Active. Other travelers nearby can find you.'
                  : 'Off. Turn on when traveling to see nearby mates.'}
              </Text>
            </View>

            {isUpdatingTraveling ? (
              <ActivityIndicator size="small" color="#005440" />
            ) : (
              <Switch
                value={Boolean(profile?.isTraveling)}
                onValueChange={handleToggleTraveling}
                disabled={isUpdatingTraveling}
                trackColor={{ false: '#E2EBE5', true: '#005440' }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Bio Card */}
        <ProfileBioCard
          name={profile?.fullName || authUser?.fullName || 'You'}
          bio={profile?.bio}
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
            activeOpacity={0.8}
          >
            <View style={styles.bottomLogoutIconCircle}>
              <LogOut size={16} color="#DC2626" />
            </View>
            <Text style={styles.bottomLogoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          visible={showEditModal}
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSave={async (payload) => {
            const updated = await profileService.updateProfile(payload);
            setProfile(updated);
            await fetchProfileData();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAF8',
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
    opacity: 0.85,
  },
  coverDarkGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  changeCoverBtn: {
    position: 'absolute',
    bottom: 42,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  changeCoverBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  identityCard: {
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
  cameraBadge: {
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
    backgroundColor: '#E8F5EE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C9EADB',
  },
  editProfileButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#005440',
  },
  nameSection: {
    marginBottom: 16,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#151D19',
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
    color: '#005440',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  memberText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5C6B64',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAF8',
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8EFEA',
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
    fontWeight: '900',
    color: '#151D19',
  },
  statBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#005440',
    marginTop: -8,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#5C6B64',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#DDE5E0',
  },
  travelingCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  travelingCardActive: {
    backgroundColor: '#E8F5EE',
    borderColor: '#A0F3D4',
  },
  travelingCardInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6EFE9',
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
    backgroundColor: '#C9EADB',
  },
  travelingIconWrapInactive: {
    backgroundColor: '#F3F4F6',
  },
  travelingTextWrap: {
    flex: 1,
  },
  travelingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#151D19',
  },
  travelingSubtitle: {
    fontSize: 11,
    color: '#5C6B64',
    lineHeight: 15,
    marginTop: 2,
  },
  logoutSection: {
    marginTop: 20,
    marginBottom: 8,
  },
  bottomLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  bottomLogoutIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomLogoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#DC2626',
  },
});
