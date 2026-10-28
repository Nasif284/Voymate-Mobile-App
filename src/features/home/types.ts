export interface UserActiveTrip {
  id: string;
  name?: string;
  destination: string;
  destinationCity?: string | null;
  destinationState?: string | null;
  destinationCountry?: string | null;
  dateFrom: string;
  dateTo: string;
  travelStyle?: string | null;
  budgetStyle?: string | null;
}

export interface UserWithDetails {
  id: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  age: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  travelType?: string | null;
  travelPersonality?: string | null;
  interests?: string[];
  distanceKm?: number;
  isTraveling?: boolean;
  matchScore?: number;
  activeTrip?: UserActiveTrip | null;
}

export interface NearbyUsersResponse {
  users: UserWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  isFallback?: boolean;
}

export interface UsersForCardsResponse {
  users: UserWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}
