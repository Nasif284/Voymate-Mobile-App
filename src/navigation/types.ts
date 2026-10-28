import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  VerifyEmail: { email: string; password?: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

export type OnboardingStackParamList = {
  ReferralSource: undefined;
  ProfileDetails: undefined;
  TravelStyle: undefined;
  InitialTripPlan: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  MatchesTab: undefined;
  ExploreTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  TravelerDetail: { userId: string };
  UserProfile: {
    userId: string;
    matchId?: string;
    tripId?: string;
    variant?: 'MATCH' | 'COMPANION' | 'NEARBY' | 'PUBLIC';
    distanceKm?: number;
    initialName?: string;
    initialAvatar?: string;
  };
  Connections: {
    initialTab?: 'connections' | 'requests';
    initialSubTab?: 'incoming' | 'sent';
  };
  ChatRoom: {
    conversationId?: string;
    targetUserId: string;
    targetUserName: string;
    targetUserAvatar?: string;
  };
  ActiveCall: {
    callId: string;
    targetUserId: string;
    targetUserName: string;
    mediaType: 'audio' | 'video';
    isIncoming?: boolean;
  };
  CreateTrip: undefined;
  EditProfile: undefined;
  KycVerification: undefined;
  Trips: {
    initialTab?: 'active' | 'past';
  };
};
