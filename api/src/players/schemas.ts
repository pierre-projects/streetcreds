// What POST /players accepts. The messages are written for the player and shown on screen.
import { z } from 'zod';
import { NICKNAME_MAX, NICKNAME_MIN } from '../../../shared/constants';
import { LocationFixSchema } from './location';
import { isBlockedNickname, NICKNAME_BLOCKED_MESSAGE } from './nickname';

const NICKNAME_MESSAGE = `Nickname must be ${NICKNAME_MIN} to ${NICKNAME_MAX} characters.`;
const SIGN_IN_MESSAGE = 'Google sign-in did not work. Try again.';

export const CreatePlayerSchema = z.object({
  // Trimmed first, so spaces around a nickname do not count toward its length.
  // A refused nickname gets the usual validation_failed error, so the contract does not change.
  nickname: z
    .string({ error: NICKNAME_MESSAGE })
    .trim()
    .min(NICKNAME_MIN, NICKNAME_MESSAGE)
    .max(NICKNAME_MAX, NICKNAME_MESSAGE)
    .refine((nickname) => !isBlockedNickname(nickname), NICKNAME_BLOCKED_MESSAGE),
  location: LocationFixSchema,
  // Google's ID token, when the person chose "Continue with Google". Checked in google.ts.
  credential: z.string({ error: SIGN_IN_MESSAGE }).min(1, SIGN_IN_MESSAGE).optional(),
});

// What POST /auth/google accepts.
export const GoogleSignInSchema = z.object({
  credential: z.string({ error: SIGN_IN_MESSAGE }).min(1, SIGN_IN_MESSAGE),
  // The guest player on this device, if there is one.
  playerId: z.string({ error: SIGN_IN_MESSAGE }).min(1, SIGN_IN_MESSAGE).optional(),
});
