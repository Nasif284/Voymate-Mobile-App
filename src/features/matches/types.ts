export interface ActiveTrip {
  id: string;
  name: string;
  destination: {
    id?: string;
    name: string;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    coverUrl?: string | null;
  };
  dateFrom: string;
  dateTo: string;
  travelStyle?: string | null;
  budgetStyle?: string | null;
}

export interface MatchData {
  id: string;
  matchedTripId?: string;
  totalPoints?: number | null;
  dateFrom?: string;
  dateTo?: string;
  destination: string;
  connectionStatus?: 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
  requestId?: string;
  forTrip?: {
    id: string;
    name: string;
  };
  forTripName?: string;
}

export interface TripMatchItem {
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    age?: number | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    interests?: string[];
    travelPersonality?: string | null;
    travelType?: string | null;
    bio?: string | null;
  };
  tripMatch: MatchData;
  mode?: 'TRIP' | 'SEARCH';
  connectionStatus?: 'CONNECTED' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
  requestId?: string;
}

export interface TripMatchesResponse {
  matches: TripMatchItem[];
  buddiesOnRoad?: TripMatchItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
