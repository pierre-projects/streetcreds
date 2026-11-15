import { describe, expect, it } from 'vitest';
import { SESSION_DAYS } from '../../../shared/constants';
import { buildSession, hashToken, isSessionLive, newSessionToken } from './sessions';

const NOW = new Date('2026-11-15T12:00:00.000Z');
const daysLater = (days: number) => new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);

describe('session tokens', () => {
  it('makes a different token every time', () => {
    expect(newSessionToken()).not.toBe(newSessionToken());
  });

  it('makes a token that fits in a header', () => {
    expect(newSessionToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('stores the hash of the token, never the token', () => {
    const token = newSessionToken();
    const session = buildSession(token, 'player-1', NOW);
    expect(session.id).toBe(hashToken(token));
    expect(session.id).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(session)).not.toContain(token);
  });

  it('records the player and when it began', () => {
    expect(buildSession('token', 'player-1', NOW)).toMatchObject({ playerId: 'player-1', createdAt: NOW.toISOString() });
  });
});

describe('isSessionLive', () => {
  const session = buildSession('token', 'player-1', NOW);

  it('is live when it begins', () => {
    expect(isSessionLive(session, NOW)).toBe(true);
  });

  it('is live the day before it ends', () => {
    expect(isSessionLive(session, daysLater(SESSION_DAYS - 1))).toBe(true);
  });

  it('is over exactly when it ends', () => {
    expect(isSessionLive(session, daysLater(SESSION_DAYS))).toBe(false);
  });

  it('is over afterwards, even while the row is still in the table', () => {
    expect(isSessionLive(session, daysLater(SESSION_DAYS + 1))).toBe(false);
  });
});
