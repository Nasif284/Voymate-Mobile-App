export type ProfileVariant = 'MATCH' | 'COMPANION' | 'NEARBY' | 'PUBLIC';

export interface UserProfileData {
  id: string;
  fullName: string;
  status?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  phone?: string | null;
  isPhoneVerified?: boolean;
  dob?: string | Date;
  age?: number | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  travelType?: string | null;
  travelPersonality?: string | null;
  gender?: string | null;
  isTraveling?: boolean;
  isEmailVerified?: boolean;
  interests?: string[];
  skills?: string[];
  languages?: string[];
  createdAt?: string | Date;
  onboardingCompleted?: boolean;
  matchWith?: string;
  tripCount?: number;
  connectionsCount?: number;
  connectionStatus?: 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
  match?: {
    totalPoints: number;
    reasons: string[];
  } | null;
}

export interface MatchProfileData {
  user: UserProfileData;
  match: {
    id: string;
    totalPoints: number;
    explanation?: {
      reasons: string[];
    };
  };
  matchedTrip?: {
    id: string;
    name: string;
    dateFrom: string | Date;
    dateTo: string | Date;
    destination: {
      id?: string;
      name: string;
      city?: string | null;
      state?: string | null;
      country?: string;
      coverUrl?: string | null;
    };
    budgetStyle?: string;
    travelStyle?: string;
  };
}

export interface ProfileUpcomingTrip {
  id: string;
  name: string;
  destinationId?: string;
  dateFrom: string | Date;
  dateTo: string | Date;
  budgetStyleCode?: string;
  travelStyleCode?: string;
  budgetStyle?: string;
  travelStyle?: string;
  destination?: {
    id?: string;
    name: string;
    city?: string | null;
    state?: string | null;
    country?: string;
    coverUrl?: string | null;
  };
}

export interface UpdatePersonalProfilePayload {
  fullName?: string;
  bio?: string;
  isTraveling?: boolean;
  travelPersonalityCode?: string;
  travelType?: string;
  interests?: string[];
  languages?: string[];
  skills?: string[];
}

export interface UserSettings {
  profileVisibilityCode?: string;
  requestsFromCode?: string;
  showOnlineStatus?: boolean;
  showTravelingStatus?: boolean;
  phone?: string | null;
  isPhoneVerified?: boolean;
}
