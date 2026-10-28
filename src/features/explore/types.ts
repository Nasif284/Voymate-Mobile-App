export interface ExploreFilters {
  destinationName?: string;
  dateFrom?: string;
  dateTo?: string;
  travelStyle?: string;
  budgetStyle?: string;
}

export const TRAVEL_STYLES = [
  { id: 'ADVENTURE', label: 'Adventure', icon: '🏔️' },
  { id: 'LEISURE', label: 'Leisure', icon: '🏖️' },
  { id: 'CULTURAL', label: 'Cultural', icon: '🏛️' },
];

export const BUDGET_STYLES = [
  { id: 'BUDGET', label: 'Budget', icon: '🪙' },
  { id: 'MODERATE', label: 'Moderate', icon: '⚖️' },
  { id: 'PREMIUM', label: 'Premium', icon: '🌟' },
  { id: 'LUXURY', label: 'Luxury', icon: '✨' },
];
