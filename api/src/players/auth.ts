// Who may act for a player. Every route that takes a player id calls requirePlayer.
//
//   const player = await requirePlayer(c, playerId);
//
// A guest player (no account) is trusted by id alone, as before accounts existed.
// A player saved to an account needs that player's session token in the Authorization header.
import type { Context } from 'hono';
import type { Player } from '../../../shared/types';
import { ApiError } from '../lib/errors';
import { getSession, isSessionLive } from './sessions';
import { getPlayer } from './store';

/** The token from `Authorization: Bearer {token}`, or null. */
export function bearerToken(c: Context): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(c.req.header('authorization') ?? '');
  return match?.[1] ?? null;
}

/**
 * Loads the player and checks the caller may act for them.
 * @throws ApiError('not_found') when there is no such player.
 * @throws ApiError('unauthorized') when the player is saved to an account and the request does
 *   not carry a live session for that player.
 */
export async function requirePlayer(c: Context, playerId: string): Promise<Player> {
  const player = await getPlayer(playerId);
  if (!player) throw new ApiError('not_found', 'We could not find that player.');
  if (!player.accountId) return player;

  const token = bearerToken(c);
  const session = token === null ? null : await getSession(token);
  if (session === null || session.playerId !== player.id || !isSessionLive(session, new Date())) {
    throw new ApiError('unauthorized');
  }
  return player;
}
