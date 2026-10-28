export interface TripDestination {
  id?: string;
  name?: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  coverUrl?: string | null;
}

export interface UserTrip {
  id: string;
  name: string;
  destinationId?: string;
  dateFrom: string | Date;
  dateTo: string | Date;
  budgetStyleCode?: string;
  travelStyleCode?: string;
  budgetStyle?: string;
  travelStyle?: string;
  statusCode?: string;
  destination?: TripDestination;
  createdAt?: string | Date;
}

export interface EditTripPayload {
  dateFrom: string | Date;
  dateTo: string | Date;
  budgetStyleCode: string;
  travelStyleCode: string;
}
