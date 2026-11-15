import { z } from 'zod';
import { locationMessages } from '../../../shared/location';
import { createPlayAreaLookup, PlayLocationError } from '../../../shared/playArea';
import type { LocationFix, NeighborhoodId } from '../../../shared/types';
import { ApiError } from '../lib/errors';

export const LocationFixSchema = z.object({
  lat: z.number({ error: locationMessages.invalid }).min(-90, locationMessages.invalid).max(90, locationMessages.invalid),
  lng: z.number({ error: locationMessages.invalid }).min(-180, locationMessages.invalid).max(180, locationMessages.invalid),
  accuracyMeters: z.number({ error: locationMessages.invalid }).min(0, locationMessages.invalid),
  capturedAt: z.iso.datetime({ error: locationMessages.invalid }),
}, { error: locationMessages.required });

const lookup = createPlayAreaLookup();

export async function requirePlayLocation(fix: LocationFix): Promise<NeighborhoodId> {
  try {
    return await lookup(fix);
  } catch (error) {
    if (error instanceof PlayLocationError) throw new ApiError(error.code, error.message);
    throw error;
  }
}
