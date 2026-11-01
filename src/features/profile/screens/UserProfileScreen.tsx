import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  } = route.params;

  const relationships = useConnectionStore((s) => s.relationships);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // TanStack Query Hooks
  const {
    data: matchProfileData,
    isLoading: isLoadingMatchProfile,
    isError: isMatchProfileError,
  } = useGetMatchProfile(matchId, Boolean(matchId));

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
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading traveler profile...</Text>
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
    <View style={styles.root}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero
          user={user}
          variant={effectiveVariant}
          matchScore={matchData?.totalPoints}
          distanceKm={distanceKm}
          connectionStatus={connectionStatus}
          onBackPress={() => navigation.goBack()}
          onConnectPress={() => setShowConnectModal(true)}
          onAcceptPress={handleAcceptConnection}
          onMessagePress={handleMessagePress}
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

        {matchData && (
          <MatchCompatibilityCard
            score={matchData.totalPoints}
            reasons={matchData.explanation?.reasons}
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
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
});
