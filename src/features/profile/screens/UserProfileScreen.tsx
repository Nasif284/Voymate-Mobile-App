import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { profileService } from '../services/profile.service';
import { connectionService } from '../../connections/services/connection.service';
import {
  UserProfileData,
  MatchProfileData,
  ProfileUpcomingTrip,
  ProfileVariant,
} from '../types';
import { ProfileHero } from '../components/ProfileHero';
import { MatchCompatibilityCard } from '../components/MatchCompatibilityCard';
import { MatchedTripCard } from '../components/MatchedTripCard';
import { TripCompanionBanner } from '../components/TripCompanionBanner';
import { ProfileBioCard } from '../components/ProfileBioCard';
import { ProfileAttributesCard } from '../components/ProfileAttributesCard';
import { ProfileUpcomingTrips } from '../components/ProfileUpcomingTrips';
import { ConnectModal } from '../../home/components/ConnectModal';
import * as Haptics from 'expo-haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

export const UserProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const {
    userId,
    matchId,
    tripId,
    variant = 'PUBLIC',
    distanceKm,
    initialName,
    initialAvatar,
  } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [matchData, setMatchData] = useState<MatchProfileData['match'] | null>(null);
  const [matchedTrip, setMatchedTrip] = useState<MatchProfileData['matchedTrip'] | null>(null);
  const [upcomingTrips, setUpcomingTrips] = useState<ProfileUpcomingTrip[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE'
  >('NONE');

  const [showConnectModal, setShowConnectModal] = useState(false);

  // Load Profile Data
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      if (matchId) {
        // Fetch full match profile
        const matchRes = await profileService.getMatchProfile(matchId);
        setUser(matchRes.user);
        setMatchData(matchRes.match);
        if (matchRes.matchedTrip) {
          setMatchedTrip(matchRes.matchedTrip);
        }
        if (matchRes.user?.connectionStatus) {
          setConnectionStatus(matchRes.user.connectionStatus);
        }
      } else {
        // Fetch regular user profile
        const userRes = await profileService.getUserProfile(userId);
        setUser(userRes);
        if (userRes.match) {
          setMatchData({
            id: 'generated',
            totalPoints: userRes.match.totalPoints,
            explanation: { reasons: userRes.match.reasons },
          });
        }
        if (userRes.connectionStatus) {
          setConnectionStatus(userRes.connectionStatus);
        }
      }

      // Fetch user's upcoming trips in parallel
      try {
        const trips = await profileService.getUserUpcomingTrips(userId);
        setUpcomingTrips(trips);
      } catch {
        // Soft-fail for upcoming trips
      }
    } catch (err: any) {
      console.warn('Error loading user profile:', err);
      Alert.alert(
        'Profile Unavailable',
        'Unable to load the traveler profile at this moment.',
        [{ text: 'Go Back', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId, matchId, navigation]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle Send Connection
  const handleSendConnection = async (message: string) => {
    if (!user) return;
    try {
      await connectionService.sendRequest({
        receiverId: user.id,
        message,
      });
      setConnectionStatus('REQUEST_SENT');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Mate Request Sent', `Your request was sent to ${user.fullName}!`);
    } catch (err) {
      Alert.alert('Error', 'Could not send mate request. Please try again.');
      throw err;
    }
  };

  // Handle Accept Connection
  const handleAcceptConnection = async () => {
    if (!user) return;
    try {
      await connectionService.acceptRequest(user.id);
      setConnectionStatus('CONNECTED');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Connected!', `You and ${user.fullName} are now travel mates.`);
    } catch {
      Alert.alert('Error', 'Could not accept connection request.');
    }
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
        <ActivityIndicator size="large" color="#005440" />
        <Text style={styles.loadingText}>Discovering traveler details...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  // Find companion trip if on COMPANION variant
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
        {/* Profile Hero Section */}
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

        {/* Variant: Companion Invitation Banner */}
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

        {/* Variant: Match Compatibility Card */}
        {matchData && (
          <MatchCompatibilityCard
            score={matchData.totalPoints}
            reasons={matchData.explanation?.reasons}
          />
        )}

        {/* Variant: Matched Trip Plan Card */}
        {matchedTrip && <MatchedTripCard trip={matchedTrip} />}

        {/* About Bio Card */}
        <ProfileBioCard name={user.fullName} bio={user.bio} />

        {/* Travel Identity & Attributes */}
        <ProfileAttributesCard
          travelType={user.travelType}
          travelPersonality={user.travelPersonality}
          languages={user.languages}
          skills={user.skills}
          interests={user.interests}
        />

        {/* Upcoming Journeys (excluding matched trip if already shown) */}
        <ProfileUpcomingTrips
          trips={upcomingTrips}
          onTripPress={(trip) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />
      </ScrollView>

      {/* Connect Message Modal */}
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
    backgroundColor: '#F8FAF8',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAF8',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C6B64',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
});
