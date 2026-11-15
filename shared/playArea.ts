import {
  assignGameNeighborhood,
  locationFixError,
  locationMessages,
  MAX_ACCURACY_METERS,
  pointInBoundary,
  type BoundaryRing,
  type LocationPurpose,
} from './location';
import type { LocationFix, NeighborhoodId } from './types';

// Public geometry only. Neither real nor mock mode sends a player's position here.
export const TEMPE_BOUNDARY_URL = 'https://services.arcgis.com/lQySeXwbBg53XWDi/ArcGIS/rest/services/City_Boundary/FeatureServer/0/query?where=1%3D1&outFields=Name&outSR=4326&f=json';
const CACHE_MS = 24 * 60 * 60 * 1000;
/** After a download fails, how long the boundary already in hand is used before asking the City again. */
const RETRY_MS = 5 * 60 * 1000;

/** The city as polygons, each a list of rings: outer edges and holes. */
export type Boundary = readonly (readonly BoundaryRing[])[];

export interface PlayAreaOptions {
  /**
   * A checked copy of the boundary (shared/tempeBoundary.ts), used when the live one cannot be
   * loaded. Without it the lookup fails closed: no boundary, no joining and no reports.
   */
  fallback?: Boundary;
  /** Set where the clock checking a reading is not the device's own, which is the API. See LOCATION_CLOCK_SKEW_MS. */
  clockSkewMs?: number;
  /** Told each time the live boundary could not be loaded, and what is used in its place. */
  onLoadFailed?: (using: 'cached' | 'bundled' | 'nothing') => void;
}

export class PlayLocationError extends Error {
  readonly code: 'validation_failed' | 'internal';

  constructor(code: 'validation_failed' | 'internal', message: string) {
    super(message);
    this.name = 'PlayLocationError';
    this.code = code;
  }
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('invalid_boundary');
  return value as Record<string, unknown>;
}

/** Validate the full response before caching. ArcGIS may return an error with HTTP 200. */
export function readBoundary(value: unknown): BoundaryRing[][] {
  const body = object(value);
  if (object(body.spatialReference).wkid !== 4326 || body.exceededTransferLimit === true) throw new Error('invalid_boundary');
  if (!Array.isArray(body.features) || body.features.length === 0) throw new Error('invalid_boundary');
  return body.features.map((value: unknown) => {
    const feature = object(value);
    const name = object(feature.attributes).Name;
    if (typeof name !== 'string' || !/tempe/i.test(name)) throw new Error('wrong_boundary');
    const featureRings = object(feature.geometry).rings;
    if (!Array.isArray(featureRings) || featureRings.length === 0) throw new Error('invalid_boundary');
    return featureRings.map((ring: unknown) => {
      if (!Array.isArray(ring) || ring.length < 4) throw new Error('invalid_boundary');
      const points = ring.map((point: unknown): [number, number] => {
        if (!Array.isArray(point) || point.length !== 2) throw new Error('invalid_boundary');
        const [lng, lat] = point;
        // Bounds also detect a wrong dataset or coordinate system.
        if (typeof lng !== 'number' || typeof lat !== 'number' || !Number.isFinite(lng) || !Number.isFinite(lat)
          || lng < -112.1 || lng > -111.8 || lat < 33.2 || lat > 33.6) throw new Error('wrong_boundary');
        return [lng, lat];
      });
      const first = points[0];
      const last = points[points.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) throw new Error('unclosed_boundary');
      return points;
    });
  });
}

/** One cache per process/tab. Concurrent requests share a single download. */
export function createPlayAreaLookup(load: typeof fetch = fetch, options: PlayAreaOptions = {}) {
  let cache: { polygons: Boundary; loadedAt: number } | null = null;
  let pending: Promise<Boundary> | null = null;
  let failedAt = Number.NEGATIVE_INFINITY;

  async function boundary(): Promise<Boundary> {
    if (cache && Date.now() - cache.loadedAt < CACHE_MS) return cache.polygons;
    // The City's service failed a moment ago and there is a boundary in hand: use it, so that
    // requests do not each wait out the download's time limit while the service is down.
    const inHand = cache?.polygons ?? options.fallback;
    if (inHand && Date.now() - failedAt < RETRY_MS) return inHand;
    if (pending) return pending;
    pending = Promise.resolve().then(async () => {
      try {
        const response = await load(TEMPE_BOUNDARY_URL, { signal: AbortSignal.timeout(4_000) });
        if (!response.ok) throw new Error('boundary_http_error');
        const polygons = readBoundary(await response.json());
        cache = { polygons, loadedAt: Date.now() };
        return polygons;
      } catch {
        failedAt = Date.now();
        options.onLoadFailed?.(cache ? 'cached' : options.fallback ? 'bundled' : 'nothing');
        if (cache) return cache.polygons;
        if (options.fallback) return options.fallback;
        throw new PlayLocationError('internal', locationMessages.boundaryUnavailable);
      } finally {
        pending = null;
      }
    });
    return pending;
  }

  return async (fix: LocationFix, purpose: LocationPurpose = 'report'): Promise<NeighborhoodId> => {
    const limits = { maxAccuracyMeters: MAX_ACCURACY_METERS[purpose], clockSkewMs: options.clockSkewMs };
    const error = locationFixError(fix, Date.now(), limits);
    if (error) throw new PlayLocationError('validation_failed', error);
    const polygons = await boundary();
    const expired = locationFixError(fix, Date.now(), limits);
    if (expired) throw new PlayLocationError('validation_failed', expired);
    if (!polygons.some((rings) => pointInBoundary(fix, rings))) throw new PlayLocationError('validation_failed', locationMessages.outside);
    return assignGameNeighborhood(fix);
  };
}
