import type { LocationFix, NeighborhoodId } from './types';

export const LOCATION_MAX_AGE_MS = 60_000;
export const LOCATION_MAX_ACCURACY_METERS = 100;
export const LOCATION_FUTURE_TOLERANCE_MS = 10_000;

export const locationMessages = {
  required: 'Allow location access to play. You can still view the live board.',
  unavailable: 'We could not find your location. Check your device settings and try again.',
  denied: 'Location access is blocked. Allow it in your browser settings and try again.',
  timeout: 'Finding your location took too long. Move somewhere with a clear signal and try again.',
  invalid: 'We could not read your location. Please try again.',
  inaccurate: 'Your location is not precise enough. Move somewhere with a clear signal and try again.',
  stale: 'Your location has expired. Please try again for a fresh reading.',
  outside: 'You need to be in Tempe to join or submit reports. You can still view the live board.',
  boundaryUnavailable: 'We could not check the play area. Please try again shortly.',
} as const;

/** Returns a player-facing error, or null. The API separately checks the city polygon. */
export function locationFixError(fix: LocationFix, now = Date.now()): string | null {
  if (!Number.isFinite(fix.lat) || !Number.isFinite(fix.lng)
    || fix.lat < -90 || fix.lat > 90 || fix.lng < -180 || fix.lng > 180) {
    return locationMessages.invalid;
  }
  if (!Number.isFinite(fix.accuracyMeters) || fix.accuracyMeters < 0) return locationMessages.invalid;
  if (fix.accuracyMeters > LOCATION_MAX_ACCURACY_METERS) return locationMessages.inaccurate;
  const age = now - Date.parse(fix.capturedAt);
  if (!Number.isFinite(age)) return locationMessages.invalid;
  if (age > LOCATION_MAX_AGE_MS || age < -LOCATION_FUTURE_TOLERANCE_MS) return locationMessages.stale;
  return null;
}

// Demo game zones, not official neighborhood or residency boundaries.
// Assignment order resolves shared edges. The API clips every zone to Tempe's
// published city polygon BEFORE calling this function. Never use nearest-zone fallback.
export const GAME_ZONES = {
  campus: { south: 33.413, north: 33.434, west: -111.940, east: -111.925 },
  downtown: { south: 33.414, north: 33.435, west: -111.956, east: -111.940 },
  northStartsAt: 33.435,
} as const;

export function assignGameNeighborhood(position: Pick<LocationFix, 'lat' | 'lng'>): NeighborhoodId {
  const within = (zone: typeof GAME_ZONES.campus | typeof GAME_ZONES.downtown) =>
    position.lat >= zone.south && position.lat <= zone.north
    && position.lng >= zone.west && position.lng <= zone.east;
  if (within(GAME_ZONES.campus)) return 'asu-campus';
  if (within(GAME_ZONES.downtown)) return 'downtown-tempe';
  return position.lat >= GAME_ZONES.northStartsAt ? 'north-tempe' : 'south-tempe';
}

export type BoundaryRing = readonly (readonly [number, number])[];

/** Even/odd membership supports multiple outer rings and interior holes (e.g. Guadalupe). */
export function pointInBoundary(position: Pick<LocationFix, 'lat' | 'lng'>, rings: readonly BoundaryRing[]): boolean {
  const { lng: x, lat: y } = position;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      // Include the actual boundary, with a tolerance below a millimeter.
      const cross = (x - xi) * (yj - yi) - (y - yi) * (xj - xi);
      if (Math.abs(cross) < 1e-12 && x >= Math.min(xi, xj) && x <= Math.max(xi, xj)
        && y >= Math.min(yi, yj) && y <= Math.max(yi, yj)) return true;
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
