import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { useConnectionStore } from '../../../store/connectionStore';
import {
  useGetUserProfile,
  useGetMatchProfile,
  useGetProfileUpcomingTrips,
} from '../hooks/profile.hooks';
import {
  useSendConnectionRequest,
  useAcceptConnectionRequest,
} from '../../connections/hooks/connection.hooks';
import { ProfileVariant } from '../types';
import { ProfileHero } from '../components/ProfileHero';
import { MatchCompatibilityCard } from '../components/MatchCompatibilityCard';
import { MatchedTripCard } from '../components/MatchedTripCard';
import { TripCompanionBanner } from '../components/TripCompanionBanner';
import { ProfileBioCard } from '../components/ProfileBioCard';
import { ProfileAttributesCard } from '../components/ProfileAttributesCard';
import { ProfileUpcomingTrips } from '../components/ProfileUpcomingTrips';
import { ConnectModal } from '../../home/components/ConnectModal';
import { UserSafetyModal } from '../../../components/common/UserSafetyModal';
import { theme } from '../../../config/theme';
import * as Haptics from 'expo-haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

export const UserProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const {
    userId,
    matchId,
    tripId,
    variant = 'PUBLIC',
    distanceKm,
    badgeMode = 'STRICT_MATCH',
    filterLabel,
    initialMatchScore,
    initialReasons,
  } = route.params;

  const relationships = useConnectionStore((s) => s.relationships);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // TanStack Query Hooks
  const {
    data: matchProfileData,
    isLoading: isLoadingMatchProfile,
    isError: isMatchProfileError,
  } = useGetMatchProfile(matchId, {
    enabled: Boolean(matchId),
    sourceTripId: tripId,
    mode: variant === 'MATCH' ? 'TRIP' : 'SEARCH',
  });

  const {
    data: regularUserProfile,
    isLoading: isLoadingUserProfile,
    isError: isUserProfileError,
  } = useGetUserProfile(userId, !matchId);

  const { data: upcomingTrips = [] } = useGetProfileUpcomingTrips(userId);

  const sendConnectionMutation = useSendConnectionRequest();
  const acceptConnectionMutation = useAcceptConnectionRequest();

  const user = matchId ? matchProfileData?.user : regularUserProfile;
  const matchData = matchId
    ? matchProfileData?.match
    : regularUserProfile?.match
      ? {
          id: 'generated',
          totalPoints: regularUserProfile.match.totalPoints,
          explanation: { reasons: regularUserProfile.match.reasons },
        }
      : null;
  const matchedTrip = matchId ? matchProfileData?.matchedTrip : null;

  // Determine effective match score & explanation reasons.
  // Honor initialMatchScore passed from the card so there is never a stale discrepancy
  // between the card tapped in Explore and this screen.
  const effectiveMatchScore =
    initialMatchScore !== undefined
      ? initialMatchScore
      : matchData?.totalPoints;

  const effectiveReasons =
    initialReasons && initialReasons.length > 0
      ? initialReasons
      : matchData?.explanation?.reasons;

  const isLoading = matchId ? isLoadingMatchProfile : isLoadingUserProfile;
  const isError = matchId ? isMatchProfileError : isUserProfileError;

  useEffect(() => {
    if (isError) {
      Alert.alert(
        'Profile Unavailable',
        'Unable to load the traveler profile at this moment.',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
    }
  }, [isError, navigation]);

  const effectiveTargetId = user?.id || userId;
  const connectionStatus =
    relationships[effectiveTargetId]?.status ||
    user?.connectionStatus ||
    'NONE';

  // Handle Send Connection
  const handleSendConnection = async (message: string) => {
    if (!user) return;
    await sendConnectionMutation.mutateAsync({
      receiverId: user.id,
      message,
    });
    Alert.alert('Mate Request Sent', `Your request was sent to ${user.fullName}!`);
  };

  // Handle Accept Connection
  const handleAcceptConnection = () => {
    if (!user) return;
    acceptConnectionMutation.mutate(
      {
        targetUserId: user.id,
        requestId: user.requestId,
      },
      {
        onSuccess: () => {
          Alert.alert('Connected!', `You and ${user.fullName} are now travel mates.`);
        },
      }
    );
  };

  // Handle Direct Message
  const handleMessagePress = () => {
    if (!user) return;
    navigation.navigate('ChatRoom', {
      targetUserId: user.id,
      targetUserName: user.fullName,
      targetUserAvatar: user.avatarUrl || undefined,
    });
  };

  if (isLoading && !user) {
    return (
      <View className="flex-1 bg-background justify-center items-center gap-3">
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text className="text-[13px] font-semibold text-text-secondary">Loading traveler profile...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  const featuredCompanionTrip =
    tripId && upcomingTrips.length > 0
      ? upcomingTrips.find((t) => t.id === tripId) || upcomingTrips[0]
      : upcomingTrips[0];

  const effectiveVariant: ProfileVariant = matchId
    ? 'MATCH'
    : tripId || variant === 'COMPANION'
      ? 'COMPANION'
      : variant;

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        bounces={true}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero
          user={user}
          variant={effectiveVariant}
          matchScore={effectiveMatchScore}
          badgeMode={badgeMode}
          filterLabel={filterLabel}
          distanceKm={distanceKm}
          connectionStatus={connectionStatus}
          onBackPress={() => navigation.goBack()}
          onConnectPress={() => setShowConnectModal(true)}
          onAcceptPress={handleAcceptConnection}
          onMessagePress={handleMessagePress}
          onSafetyPress={() => setShowSafetyModal(true)}
        />

        {effectiveVariant === 'COMPANION' && featuredCompanionTrip && (
          <TripCompanionBanner
            userName={user.fullName}
            destination={
              featuredCompanionTrip.destination?.name ||
              featuredCompanionTrip.name ||
              'Upcoming Destination'
            }
            dateFrom={featuredCompanionTrip.dateFrom}
            dateTo={featuredCompanionTrip.dateTo}
            onMessagePress={handleMessagePress}
          />
        )}

        {(effectiveMatchScore != null ||
          badgeMode === 'INTENT_MATCH' ||
          badgeMode === 'LOCATION_DISCOVERY' ||
          badgeMode === 'DATES_DISCOVERY' ||
          badgeMode === 'STYLE_DISCOVERY' ||
          badgeMode === 'BUDGET_DISCOVERY' ||
          badgeMode === 'OPEN_BROWSING' ||
          matchData) && (
          <MatchCompatibilityCard
            score={effectiveMatchScore ?? 0}
            reasons={effectiveReasons}
            badgeMode={badgeMode}
            travelType={user.travelType}
            filterLabel={filterLabel}
          />
        )}

        {matchedTrip && <MatchedTripCard trip={matchedTrip} />}

        <ProfileBioCard name={user.fullName} bio={user.bio} />

        <ProfileAttributesCard
          travelType={user.travelType}
          travelPersonality={user.travelPersonality}
          languages={user.languages}
          skills={user.skills}
          interests={user.interests}
        />

        <ProfileUpcomingTrips
          trips={upcomingTrips}
          onTripPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />
      </ScrollView>

      <ConnectModal
        visible={showConnectModal}
        recipientName={user.fullName}
        onClose={() => setShowConnectModal(false)}
        onSend={handleSendConnection}
      />

      <UserSafetyModal
        visible={showSafetyModal}
        targetUserId={user.id}
        targetUserName={user.fullName}
        targetUserAvatar={user.avatarUrl || undefined}
        onClose={() => setShowSafetyModal(false)}
        onUserBlocked={() => {
          navigation.goBack();
        }}
      />
    </View>
  );
};
