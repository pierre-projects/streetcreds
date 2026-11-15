import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { assignGameNeighborhood, locationFixError, locationMessages, pointInBoundary } from '../../../shared/location';
import { createPlayAreaLookup, TEMPE_BOUNDARY_URL } from '../../../shared/playArea';
import type { LocationFix } from '../../../shared/types';

const now = Date.parse('2026-11-15T12:00:00Z');
const fix = (overrides: Partial<LocationFix> = {}): LocationFix => ({
  lat: 33.418, lng: -111.934, accuracyMeters: 20, capturedAt: new Date(now).toISOString(), ...overrides,
});

// Synthetic geometry for unit tests, not a substitute for Tempe's published boundary.
const outer: [number, number][] = [[-111.98, 33.3], [-111.89, 33.3], [-111.89, 33.47], [-111.98, 33.47], [-111.98, 33.3]];
const hole: [number, number][] = [[-111.97, 33.35], [-111.95, 33.35], [-111.95, 33.38], [-111.97, 33.38], [-111.97, 33.35]];
const geometry = () => ({ spatialReference: { wkid: 4326 }, features: [{ attributes: { Name: 'Tempe' }, geometry: { rings: [outer, hole] } }] });
const response = () => new Response(JSON.stringify(geometry()), { status: 200 });

beforeEach(() => { vi.spyOn(Date, 'now').mockReturnValue(now); });
afterEach(() => { vi.restoreAllMocks(); });

describe('location freshness and precision', () => {
  it('accepts a fresh reading with useful accuracy', () => {
    expect(locationFixError(fix(), now)).toBeNull();
    expect(locationFixError(fix({ accuracyMeters: 100, capturedAt: new Date(now - 60_000).toISOString() }), now)).toBeNull();
  });
  it.each([61_000, -11_000])('rejects a stale or future reading (%i ms)', (age) => {
    expect(locationFixError(fix({ capturedAt: new Date(now - age).toISOString() }), now)).toBe(locationMessages.stale);
  });
  it('rejects poor accuracy', () => {
    expect(locationFixError(fix({ accuracyMeters: 101 }), now)).toBe(locationMessages.inaccurate);
  });
  it.each([{ lat: NaN }, { lng: Infinity }, { lat: 91 }, { lng: -181 }, { accuracyMeters: -1 }, { accuracyMeters: NaN }, { capturedAt: 'bad' }])('rejects invalid readings: %j', (value) => {
    expect(locationFixError(fix(value), now)).toBe(locationMessages.invalid);
  });
});

describe('game neighborhoods (after city validation)', () => {
  it.each([
    [33.418, -111.934, 'asu-campus'],
    [33.425, -111.944, 'downtown-tempe'],
    [33.45, -111.93, 'north-tempe'],
    [33.36, -111.92, 'south-tempe'],
    [33.425, -111.940, 'asu-campus'],
    [33.435, -111.944, 'downtown-tempe'],
    [33.435, -111.92, 'north-tempe'],
  ] as const)('assigns %s, %s to %s with deterministic edges', (lat, lng, expected) => {
    expect(assignGameNeighborhood({ lat, lng })).toBe(expected);
  });
});

describe('polygon membership', () => {
  it('distinguishes the city interior, exterior, holes and boundary', () => {
    expect(pointInBoundary(fix(), [outer, hole])).toBe(true);
    expect(pointInBoundary({ lat: 33.37, lng: -111.96 }, [outer, hole])).toBe(false);
    expect(pointInBoundary({ lat: 33.5, lng: -111.94 }, [outer, hole])).toBe(false);
    expect(pointInBoundary({ lat: 33.3, lng: -111.94 }, [outer, hole])).toBe(true);
  });
  it('supports disjoint areas and reversed ring winding', () => {
    const island: [number, number][] = [[-111.88, 33.4], [-111.87, 33.4], [-111.87, 33.41], [-111.88, 33.41], [-111.88, 33.4]];
    expect(pointInBoundary({ lat: 33.405, lng: -111.875 }, [outer, island])).toBe(true);
    expect(pointInBoundary(fix(), [[...outer].reverse(), [...hole].reverse()])).toBe(true);
  });
});

describe('play area lookup', () => {
  it('caches the full boundary and never transmits a player coordinate', async () => {
    const load = vi.fn<typeof fetch>().mockImplementation(async () => response());
    const lookup = createPlayAreaLookup(load);
    expect(await lookup(fix())).toBe('asu-campus');
    expect(await lookup(fix({ lat: 33.425, lng: -111.944 }))).toBe('downtown-tempe');
    expect(load).toHaveBeenCalledTimes(1);
    expect(load.mock.calls[0][0]).toBe(TEMPE_BOUNDARY_URL);
    expect(TEMPE_BOUNDARY_URL).not.toContain('33.418');
  });
  it('shares the download across concurrent requests', async () => {
    const load = vi.fn<typeof fetch>().mockImplementation(async () => response());
    const lookup = createPlayAreaLookup(load);
    await Promise.all([lookup(fix()), lookup(fix())]);
    expect(load).toHaveBeenCalledTimes(1);
  });
  it.each([
    { lat: 33.5, lng: -111.94 }, // Outside the synthetic city.
    { lat: 33.37, lng: -111.96 }, // A hole inside its bounding box.
    { lat: 33.45, lng: -112.07 }, // Phoenix: do not assign nearest neighborhood.
    { lat: 33.45, lng: -111.84 }, // Mesa.
  ])('refuses out-of-area coordinates: %j', async (position) => {
    const lookup = createPlayAreaLookup(vi.fn<typeof fetch>().mockImplementation(async () => response()));
    await expect(lookup(fix(position))).rejects.toMatchObject({ code: 'validation_failed', message: locationMessages.outside });
  });
  it('rejects bad accuracy or age before loading the boundary', async () => {
    const load = vi.fn<typeof fetch>();
    const lookup = createPlayAreaLookup(load);
    await expect(lookup(fix({ accuracyMeters: 500 }))).rejects.toMatchObject({ code: 'validation_failed' });
    await expect(lookup(fix({ capturedAt: new Date(now - 61_000).toISOString() }))).rejects.toMatchObject({ code: 'validation_failed' });
    expect(load).not.toHaveBeenCalled();
  });
  it('fails closed when the service is unavailable and retries the next request', async () => {
    const load = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('offline')).mockImplementationOnce(async () => response());
    const lookup = createPlayAreaLookup(load);
    await expect(lookup(fix())).rejects.toMatchObject({ code: 'internal', message: locationMessages.boundaryUnavailable });
    await expect(lookup(fix())).resolves.toBe('asu-campus');
  });
  it('retries after a synchronous fetch failure instead of keeping a rejected request', async () => {
    const load = vi.fn<typeof fetch>().mockImplementationOnce(() => { throw new Error('offline'); }).mockImplementationOnce(async () => response());
    const lookup = createPlayAreaLookup(load);
    await expect(lookup(fix())).rejects.toMatchObject({ code: 'internal' });
    await expect(lookup(fix())).resolves.toBe('asu-campus');
  });
  it('treats separate city features as a union, including overlapping features', async () => {
    const body = geometry();
    body.features.push(body.features[0]);
    const lookup = createPlayAreaLookup(vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body))));
    await expect(lookup(fix())).resolves.toBe('asu-campus');
  });
  it.each([
    { error: { message: 'unavailable' } },
    { ...geometry(), exceededTransferLimit: true },
    { ...geometry(), spatialReference: { wkid: 2223 } },
    { ...geometry(), features: [] },
    { ...geometry(), features: [{ attributes: { Name: 'Other city' }, geometry: { rings: [outer] } }] },
    { ...geometry(), features: [{ attributes: { Name: 'Tempe' }, geometry: { rings: [outer.slice(0, -1)] } }] },
  ])('refuses malformed or incomplete boundary data', async (body) => {
    const lookup = createPlayAreaLookup(vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body))));
    await expect(lookup(fix())).rejects.toMatchObject({ code: 'internal' });
  });
  it('rechecks freshness after downloading', async () => {
    const load = vi.fn<typeof fetch>().mockImplementation(async () => {
      vi.mocked(Date.now).mockReturnValue(now + 61_000);
      return response();
    });
    await expect(createPlayAreaLookup(load)(fix())).rejects.toMatchObject({ message: locationMessages.stale });
  });
  it('uses the last valid boundary if the next-day refresh fails', async () => {
    const load = vi.fn<typeof fetch>().mockImplementationOnce(async () => response()).mockRejectedValueOnce(new Error('offline'));
    const lookup = createPlayAreaLookup(load);
    await lookup(fix());
    const tomorrow = now + 24 * 60 * 60 * 1000 + 1;
    vi.mocked(Date.now).mockReturnValue(tomorrow);
    await expect(lookup(fix({ capturedAt: new Date(tomorrow).toISOString() }))).resolves.toBe('asu-campus');
  });
});
