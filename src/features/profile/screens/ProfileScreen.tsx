import React, { useState } from 'react';
import {
  View,
  Text,
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
import { cn } from '../../../utils/cn';

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
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Photo Header */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePickCover}
          className="w-full h-[220px] bg-primary-dark relative"
        >
          {profile?.coverUrl ? (
            <Image
              source={{ uri: profile.coverUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-primary-dark">
              <View className="absolute inset-0 bg-primary-dark opacity-85" />
            </View>
          )}
          <View className="absolute inset-0 bg-black/40" />

          {/* Bottom Right: Change Cover */}
          <TouchableOpacity
            className="absolute bottom-[42px] right-4 flex-row items-center gap-1.5 bg-black/40 px-2.5 py-[5px] rounded-xl border border-white/25"
            onPress={handlePickCover}
            activeOpacity={0.8}
          >
            <Camera size={13} color={theme.colors.white} />
            <Text className="text-white text-[11px] font-bold">Change cover</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Profile Identity Card */}
        <View className="bg-surface rounded-t-[32px] -mt-8 px-5 pb-5">
          {/* Avatar Row */}
          <View className="flex-row justify-between items-end -mt-[45px] mb-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePickAvatar}
              className="w-[90px] h-[90px] rounded-full border-4 border-surface bg-surface-subtle items-center justify-center relative"
            >
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} className="w-full h-full rounded-full" />
              ) : (
                <View className="w-full h-full rounded-full bg-primary items-center justify-center">
                  <Text className="text-[34px] font-bold text-white">
                    {profile?.fullName?.charAt(0)?.toUpperCase() ||
                      authUser?.fullName?.charAt(0)?.toUpperCase() ||
                      'V'}
                  </Text>
                </View>
              )}
              <View className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-primary border-2 border-surface items-center justify-center">
                <Camera size={14} color={theme.colors.white} />
              </View>
            </TouchableOpacity>

            {/* Edit Profile Action Group */}
            <View className="flex-row items-center gap-2 mb-1">
              <TouchableOpacity
                className="flex-row items-center gap-1.5 bg-surface px-3.5 py-2 rounded-2xl border border-primary"
                onPress={() => setShowEditModal(true)}
                activeOpacity={0.8}
              >
                <Edit3 size={15} color={theme.colors.primary} />
                <Text className="text-[13px] font-semibold text-primary">Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* User Name & Demographics */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-text-primary tracking-[-0.4px] mb-1">
              {profile?.fullName || authUser?.fullName || 'Voymate Traveler'}
            </Text>
            {locationString ? (
              <View className="flex-row items-center gap-1.5 mb-1">
                <MapPin size={13} color={theme.colors.primary} />
                <Text className="text-[13px] font-semibold text-primary">{locationString}</Text>
              </View>
            ) : null}
            {memberSince ? (
              <View className="flex-row items-center gap-1.5">
                <Calendar size={12} color={theme.colors.textSecondary} />
                <Text className="text-xs font-medium text-text-secondary">Member since {memberSince}</Text>
              </View>
            ) : null}
          </View>

          {/* Instagram-Style Stats Bar */}
          <View className="flex-row items-center justify-around bg-surface-subtle rounded-[18px] py-3.5 border border-border">
            {/* Journeys (Tappable) */}
            <TouchableOpacity
              className="items-center flex-1"
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Trips', { initialTab: 'active' });
              }}
            >
              <Text className="text-lg font-bold text-text-primary">
                {profile?.tripCount !== undefined ? profile.tripCount : upcomingTrips.length}
              </Text>
              <Text className="text-[9px] font-semibold text-text-secondary tracking-[0.6px] mt-0.5">TRIPS</Text>
            </TouchableOpacity>

            <View className="w-[1px] h-6 bg-border" />

            {/* Mates / Connections (Tappable) */}
            <TouchableOpacity
              className="items-center flex-1"
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Connections', { initialTab: 'connections' });
              }}
            >
              <Text className="text-lg font-bold text-text-primary">
                {connectionsCount}
              </Text>
              <Text className="text-[9px] font-semibold text-text-secondary tracking-[0.6px] mt-0.5">MATES</Text>
            </TouchableOpacity>

            <View className="w-[1px] h-6 bg-border" />

            {/* Requests (Tappable) */}
            <TouchableOpacity
              className="items-center flex-1"
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Connections', {
                  initialTab: 'requests',
                  initialSubTab: 'incoming',
                });
              }}
            >
              <View className="flex-row items-center gap-1">
                <Text className="text-lg font-bold text-text-primary">
                  {incomingRequestsCount}
                </Text>
                {incomingRequestsCount > 0 && <View className="w-[7px] h-[7px] rounded-full bg-primary -mt-2" />}
              </View>
              <Text className="text-[9px] font-semibold text-text-secondary tracking-[0.6px] mt-0.5">REQUESTS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Traveling Mode Toggle Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleToggleTraveling(!profile?.isTraveling)}
          className={cn(
            'mx-4 mt-3.5 rounded-[22px] p-4 border',
            profile?.isTraveling ? 'bg-primary-mist border-primary-border' : 'bg-surface border-border'
          )}
        >
          <View className="flex-row items-center gap-3">
            <View
              className={cn(
                'w-10 h-10 rounded-[14px] items-center justify-center',
                profile?.isTraveling ? 'bg-primary-light' : 'bg-surface-subtle'
              )}
            >
              <Radio
                size={18}
                color={profile?.isTraveling ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>

            <View className="flex-1">
              <Text className="text-sm font-semibold text-text-primary">
                {profile?.isTraveling ? 'Currently Traveling' : 'Not Traveling'}
              </Text>
              <Text className="text-[11px] text-text-secondary leading-[15px] mt-0.5">
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
        <View className="mt-6 mb-3 items-center">
          <TouchableOpacity
            className="flex-row items-center justify-center gap-1.5 py-[7px] px-4 rounded-full bg-error-light border border-error-light"
            onPress={handleLogout}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
          >
            <LogOut size={13} color={theme.colors.error} strokeWidth={2.2} />
            <Text className="text-[12.5px] font-bold text-error tracking-[0.1px]">Log out</Text>
          </TouchableOpacity>
          <Text className="text-[11px] font-medium text-text-placeholder mt-2.5 tracking-[0.2px]">Voymate • v1.0.0</Text>
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
