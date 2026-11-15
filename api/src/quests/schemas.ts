// What the report routes accept. Messages are written for the player and shown on screen.
import { z } from 'zod';
import { CATEGORIES } from '../../../shared/constants';
import type { Category } from '../../../shared/types';
import { LocationFixSchema } from '../players/location';

const CATEGORY_IDS = CATEGORIES as unknown as [Category, ...Category[]];

const PLAYER_ID_MESSAGE = 'A player id is required.';
const PHOTO_KEY_MESSAGE = 'A photo key is required.';
const CATEGORY_MESSAGE = 'Pick one of the problem categories.';

export const CreateReportSchema = z.object({
  playerId: z.string({ error: PLAYER_ID_MESSAGE }).min(1, PLAYER_ID_MESSAGE),
  photoKey: z.string({ error: PHOTO_KEY_MESSAGE }).min(1, PHOTO_KEY_MESSAGE),
});

export const SubmitReportSchema = z.object({
  playerId: z.string({ error: PLAYER_ID_MESSAGE }).min(1, PLAYER_ID_MESSAGE),
  location: LocationFixSchema,
  category: z.enum(CATEGORY_IDS, { error: CATEGORY_MESSAGE }).optional(),
});
