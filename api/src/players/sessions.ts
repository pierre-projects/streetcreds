// Sessions: what keeps a signed-in player signed in on one device.
// The device holds a random token. The table holds only its SHA-256, so reading the table
// never gives anyone a working token. There is no signing key to keep secret.
import { createHash, randomBytes } from 'node:crypto';
import { DeleteCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SESSION_DAYS } from '../../../shared/constants';
import type { Session } from '../../../shared/types';
import { db, TABLES } from '../lib/db';

const DAY_SECONDS = 24 * 60 * 60;

/** 32 random bytes, safe to put in a header. */
export function newSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** The table key for a token. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** The session row for a token made at `now`. Pure, so the expiry can be tested. */
export function buildSession(token: string, playerId: string, now: Date): Session {
  return {
    id: hashToken(token),
    playerId,
    createdAt: now.toISOString(),
    expiresAt: Math.floor(now.getTime() / 1000) + SESSION_DAYS * DAY_SECONDS,
  };
}

/**
 * DynamoDB deletes expired rows on its own schedule, up to two days late, so an expired
 * session can still be read. This is the check that counts.
 */
export function isSessionLive(session: Pick<Session, 'expiresAt'>, now: Date): boolean {
  return session.expiresAt * 1000 > now.getTime();
}

/** Starts a session for the player and returns the token to hand to the device. */
export async function startSession(playerId: string, now: Date = new Date()): Promise<string> {
  const token = newSessionToken();
  await db.send(new PutCommand({ TableName: TABLES.sessions, Item: buildSession(token, playerId, now) }));
  return token;
}

export async function getSession(token: string): Promise<Session | null> {
  const result = await db.send(new GetCommand({ TableName: TABLES.sessions, Key: { id: hashToken(token) } }));
  return (result.Item as Session | undefined) ?? null;
}

/** Signing out. Deleting a session that is already gone is not an error. */
export async function endSession(token: string): Promise<void> {
  await db.send(new DeleteCommand({ TableName: TABLES.sessions, Key: { id: hashToken(token) } }));
}
