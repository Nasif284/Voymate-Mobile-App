/**
 * Utility functions for formatting values across the Voymate app.
 */

/**
 * Formats distance in kilometers for traveler cards and profiles.
 * Preserves exact sub-kilometer distances (e.g. 0.25 km, 0.4 km) for optimal UX
 * rather than displaying generic 'Nearby' placeholders.
 *
 * Examples:
 * - 0 => '< 0.1 km away'
 * - 0.05 => '0.05 km away'
 * - 0.2 => '0.2 km away'
 * - 0.75 => '0.75 km away'
 * - 1.2 => '1.2 km away'
 * - 14.8 => '15 km away'
 * - null/undefined => 'Within 50 km'
 */
export function formatDistanceKm(distanceKm?: number | string | null): string {
  if (distanceKm === undefined || distanceKm === null || distanceKm === '') {
    return 'Within 50 km';
  }

  const d = typeof distanceKm === 'number' ? distanceKm : parseFloat(String(distanceKm));
  if (isNaN(d)) {
    return 'Within 50 km';
  }

  if (d <= 0) {
    return '< 0.1 km away';
  }

  if (d < 1) {
    const formatted = parseFloat(d.toFixed(2));
    if (formatted === 0) {
      return '< 0.1 km away';
    }
    return `${formatted} km away`;
  }

  if (d < 10) {
    const formatted = parseFloat(d.toFixed(1));
    return `${formatted} km away`;
  }

  return `${Math.round(d)} km away`;
}
