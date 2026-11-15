import type { LocationFix, NeighborhoodId } from './types';

export const LOCATION_MAX_AGE_MS = 60_000;
export const LOCATION_FUTURE_TOLERANCE_MS = 10_000;

/** What a reading is for. A report is pinned at it; joining only uses it to pick a team. */
export type LocationPurpose = 'join' | 'report';
/** The widest accuracy radius accepted for a report, which is drawn on the map at the reading. */
export const LOCATION_MAX_ACCURACY_METERS = 100;
/** For joining. A laptop on Wi-Fi often reports a few hundred meters, which is enough to pick a team. */
export const JOIN_MAX_ACCURACY_METERS = 500;
export const MAX_ACCURACY_METERS: Record<LocationPurpose, number> = {
  join: JOIN_MAX_ACCURACY_METERS,
  report: LOCATION_MAX_ACCURACY_METERS,
};

/**
 * How far a device's clock may be from the server's. `capturedAt` is stamped by the device, so
 * without this a phone running a little fast or slow is refused every time and a retry never
 * helps. The device still checks the reading's age against its own clock, which is exact, and the
 * timestamp was never proof of anything: a modified client can send any time it likes.
 */
export const LOCATION_CLOCK_SKEW_MS = 120_000;

export interface LocationLimits {
  /** Defaults to the limit for a report. */
  maxAccuracyMeters?: number;
  /** Set when `now` comes from a different clock than the reading's: the allowed difference between the two. */
  clockSkewMs?: number;
}

export const locationMessages = {
  required: 'Allow location access to play. You can still view the live board.',
  unavailable: 'We could not find your location. Check your device settings and try again.',
  denied: 'Location access is blocked. Allow it in your browser settings and try again.',
  timeout: 'Finding your location took too long. Move somewhere with a clear signal and try again.',
  invalid: 'We could not read your location. Please try again.',
  inaccurate: 'Your location is not precise enough. Turn on precise location if it is off, or move somewhere with a clear signal, then try again.',
  stale: 'Your location has expired. Please try again for a fresh reading.',
  clock: 'The time on your device looks wrong. Turn on automatic date and time, then try again.',
  outside: 'You need to be in Tempe to join or submit reports. You can still view the live board.',
  boundaryUnavailable: 'We could not check the play area. Please try again shortly.',
} as const;

/** Returns a player-facing error, or null. The API separately checks the city polygon. */
export function locationFixError(fix: LocationFix, now = Date.now(), limits: LocationLimits = {}): string | null {
  if (!Number.isFinite(fix.lat) || !Number.isFinite(fix.lng)
    || fix.lat < -90 || fix.lat > 90 || fix.lng < -180 || fix.lng > 180) {
    return locationMessages.invalid;
  }
  if (!Number.isFinite(fix.accuracyMeters) || fix.accuracyMeters < 0) return locationMessages.invalid;
  if (fix.accuracyMeters > (limits.maxAccuracyMeters ?? LOCATION_MAX_ACCURACY_METERS)) return locationMessages.inaccurate;
  const age = now - Date.parse(fix.capturedAt);
  if (!Number.isFinite(age)) return locationMessages.invalid;
  const skew = limits.clockSkewMs ?? 0;
  if (age > LOCATION_MAX_AGE_MS + skew || age < -(LOCATION_FUTURE_TOLERANCE_MS + skew)) {
    // The device already found its own reading fresh. Still outside the wider window on another
    // clock means the two clocks disagree, and asking for a fresh reading would not help.
    return limits.clockSkewMs === undefined ? locationMessages.stale : locationMessages.clock;
  }
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
