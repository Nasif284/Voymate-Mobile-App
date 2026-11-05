export interface LocationFields {
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

/**
 * Format a traveler's home location relative to the current viewer:
 * - If the viewer and traveler are from the same country: "City, State"
 * - If from different countries (international): "State, Country" (or "City, Country" if state is not available)
 * - Deduplicates overlapping names (e.g. "Singapore, Singapore" -> "Singapore")
 */
export function formatTravelerLocation(
  target?: LocationFields | null,
  viewerCountry?: string | null,
  fallback = 'Solo Explorer'
): string {
  if (!target) return fallback;

  const city = target.city?.trim() || '';
  const state = target.state?.trim() || '';
  const country = target.country?.trim() || '';
  const myCountry = viewerCountry?.trim() || '';

  const isSameCountry =
    Boolean(myCountry && country) &&
    myCountry.toLowerCase() === country.toLowerCase();

  const joinUnique = (parts: string[]) => {
    const unique: string[] = [];
    for (const part of parts) {
      if (part && !unique.some((u) => u.toLowerCase() === part.toLowerCase())) {
        unique.push(part);
      }
    }
    return unique.join(', ');
  };

  if (isSameCountry) {
    // Domestic viewer: "City, State" (or fallback to country if missing)
    return joinUnique([city, state]) || country || fallback;
  }

  // Cross-border / international viewer: "State, Country" (fallback to "City, Country" if state is empty)
  const primaryIntl = state || city;
  return joinUnique([primaryIntl, country]) || primaryIntl || country || fallback;
}
