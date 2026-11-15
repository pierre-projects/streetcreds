import { z } from 'zod';
import { LOCATION_CLOCK_SKEW_MS, locationMessages, type LocationPurpose } from '../../../shared/location';
import { createPlayAreaLookup, PlayLocationError } from '../../../shared/playArea';
import { TEMPE_BOUNDARY, TEMPE_BOUNDARY_COPIED_AT } from '../../../shared/tempeBoundary';
import type { LocationFix, NeighborhoodId } from '../../../shared/types';
import { ApiError } from '../lib/errors';

export const LocationFixSchema = z.object({
  lat: z.number({ error: locationMessages.invalid }).min(-90, locationMessages.invalid).max(90, locationMessages.invalid),
  lng: z.number({ error: locationMessages.invalid }).min(-180, locationMessages.invalid).max(180, locationMessages.invalid),
  accuracyMeters: z.number({ error: locationMessages.invalid }).min(0, locationMessages.invalid),
  capturedAt: z.iso.datetime({ error: locationMessages.invalid }),
}, { error: locationMessages.required });

// The City's live boundary first. If its service cannot be reached, the copy bundled with the
// API is used, so an outage there does not stop the game. The reading's time is the device's,
// so it gets some room for a clock that differs from this one.
const lookup = createPlayAreaLookup(undefined, {
  fallback: TEMPE_BOUNDARY,
  clockSkewMs: LOCATION_CLOCK_SKEW_MS,
  onLoadFailed: (using) => {
    console.warn(JSON.stringify({
      level: 'warn',
      where: 'playArea',
      message: 'The City boundary could not be loaded.',
      using,
      ...(using === 'bundled' ? { copiedAt: TEMPE_BOUNDARY_COPIED_AT } : {}),
    }));
  },
});

/** `purpose` sets how precise the reading has to be: a report is pinned at it, joining only picks a team. */
export async function requirePlayLocation(fix: LocationFix, purpose: LocationPurpose = 'report'): Promise<NeighborhoodId> {
  try {
    return await lookup(fix, purpose);
  } catch (error) {
    if (error instanceof PlayLocationError) throw new ApiError(error.code, error.message);
    throw error;
  }
}
