// Sign-in routes (Pierre): POST /auth/google, POST /auth/signout.
// The steps for each are in docs/TECHNICAL.md section 5.
//
// An account never has points or reports of its own. It only says which player a Google
// account owns, so signing in on any device leads back to the same player.
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import type { SignInResponse, SignOutResponse } from '../../../shared/api';
import type { Account, Player } from '../../../shared/types';
import { ApiError } from '../lib/errors';
import { deleteAccount, getAccount, googleAccountKey, putNewAccount } from './accounts';
import { bearerToken } from './auth';
import { verifyGoogleCredential } from './google';
import { GoogleSignInSchema } from './schemas';
import { endSession, startSession } from './sessions';
import { getPlayer, linkAccount } from './store';

export const authRoutes = new Hono();

const NO_SAVED_PLAYER_MESSAGE = 'There is no saved player for this Google account yet.';

async function signedIn(player: Player, switched: boolean): Promise<SignInResponse> {
  return { player, sessionToken: await startSession(player.id), switched };
}

/** The account's player, or null when the account or its player is gone. A dead link is removed. */
async function savedPlayer(accountKey: string): Promise<Player | null> {
  const account = await getAccount(accountKey);
  if (!account) return null;
  const player = await getPlayer(account.playerId);
  // The player row was deleted (see "An offensive nickname" in TECHNICAL.md). Free the Google
  // account so the person can save a new player to it.
  if (!player) await deleteAccount(accountKey);
  return player;
}

authRoutes.post('/auth/google', async (c) => {
  const input = GoogleSignInSchema.parse(await c.req.json());
  const { sub } = await verifyGoogleCredential(input.credential);
  const accountKey = googleAccountKey(sub);

  // 1. A returning person: this Google account already owns a player.
  const saved = await savedPlayer(accountKey);
  if (saved) {
    const switched = input.playerId !== undefined && input.playerId !== saved.id;
    return c.json(await signedIn(saved, switched));
  }

  // 2. "Save your player": link the guest player on this device to the Google account.
  const guest = input.playerId === undefined ? null : await getPlayer(input.playerId);
  if (guest && !guest.accountId) {
    const account: Account = {
      id: accountKey,
      accountId: randomUUID(),
      playerId: guest.id,
      createdAt: new Date().toISOString(),
    };
    if (!(await putNewAccount(account))) {
      // Another device finished signing in to this Google account a moment ago. Use its player.
      const winner = await savedPlayer(accountKey);
      if (!winner) throw new ApiError('not_found', NO_SAVED_PLAYER_MESSAGE);
      return c.json(await signedIn(winner, winner.id !== guest.id));
    }
    const linked = await linkAccount(guest.id, account.accountId);
    if (!linked) {
      // The guest was saved to a different account in the meantime. Undo this half-made link.
      await deleteAccount(accountKey);
      throw new ApiError('not_found', NO_SAVED_PLAYER_MESSAGE);
    }
    return c.json(await signedIn(linked, false));
  }

  // 3. A new person. The join screen asks for a nickname and calls POST /players with the credential.
  throw new ApiError('not_found', NO_SAVED_PLAYER_MESSAGE);
});

authRoutes.post('/auth/signout', async (c) => {
  const token = bearerToken(c);
  if (token !== null) await endSession(token);
  const body: SignOutResponse = { ok: true };
  return c.json(body);
});
