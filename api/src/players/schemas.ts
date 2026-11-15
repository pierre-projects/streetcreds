// What POST /players accepts. The messages are written for the player and shown on screen.
import { z } from 'zod';
import { NEIGHBORHOODS, NICKNAME_MAX, NICKNAME_MIN } from '../../../shared/constants';
import type { NeighborhoodId } from '../../../shared/types';

const NICKNAME_MESSAGE = `Nickname must be ${NICKNAME_MIN} to ${NICKNAME_MAX} characters.`;
const NEIGHBORHOOD_MESSAGE = 'Pick one of the four neighborhoods.';

const NEIGHBORHOOD_IDS = NEIGHBORHOODS.map((n) => n.id) as [NeighborhoodId, ...NeighborhoodId[]];

export const CreatePlayerSchema = z.object({
  // Trimmed first, so spaces around a nickname do not count toward its length.
  nickname: z.string({ error: NICKNAME_MESSAGE }).trim().min(NICKNAME_MIN, NICKNAME_MESSAGE).max(NICKNAME_MAX, NICKNAME_MESSAGE),
  neighborhood: z.enum(NEIGHBORHOOD_IDS, { error: NEIGHBORHOOD_MESSAGE }),
});
