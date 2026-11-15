// requirePlayer against stand-in tables: a guest is trusted by id, a saved player needs their session.
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiErrorBody } from '../../../shared/api';
import type { Player, Session } from '../../../shared/types';
import { handleError } from '../lib/errors';
import { requirePlayer } from './auth';
import { getSession } from './sessions';
import { getPlayer } from './store';

vi.mock('./store', () => ({ getPlayer: vi.fn() }));
vi.mock('./sessions', async (original) => ({ ...(await original<typeof import('./sessions')>()), getSession: vi.fn() }));

const guest: Player = {
  id: 'guest-1',
  nickname: 'Sam',
  neighborhood: 'asu-campus',
  points: 70,
  walletAddress: null,
  recentReportTimes: [],
  createdAt: '2026-11-14T00:00:00.000Z',
  accountId: null,
};
const saved: Player = { ...guest, id: 'saved-1', accountId: 'account-1' };

const inAnHour = () => Math.floor(Date.now() / 1000) + 3600;
const session = (fields: Partial<Session> = {}): Session => ({
  id: 'hash',
  playerId: saved.id,
  createdAt: '2026-11-14T00:00:00.000Z',
  expiresAt: inAnHour(),
  ...fields,
});

const app = new Hono();
app.get('/who/:id', async (c) => c.json({ id: (await requirePlayer(c, c.req.param('id'))).id }));
app.onError(handleError);

const ask = (id: string, token?: string) =>
  app.request(`/who/${id}`, token === undefined ? undefined : { headers: { authorization: `Bearer ${token}` } });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getPlayer).mockImplementation(async (id) => (id === guest.id ? guest : id === saved.id ? saved : null));
});

describe('requirePlayer', () => {
  it('answers not_found for a player that does not exist', async () => {
    const result = await ask('nobody');
    expect(result.status).toBe(404);
    expect(((await result.json()) as ApiErrorBody).error.code).toBe('not_found');
  });

  it('trusts a guest player by id alone and never looks for a session', async () => {
    expect((await ask(guest.id)).status).toBe(200);
    expect(getSession).not.toHaveBeenCalled();
  });

  it('treats a row from before accounts existed as a guest', async () => {
    const { accountId: _accountId, ...old } = guest;
    vi.mocked(getPlayer).mockResolvedValue(old as Player);
    expect((await ask(guest.id)).status).toBe(200);
  });

  it('refuses a saved player with no session token', async () => {
    const result = await ask(saved.id);
    expect(result.status).toBe(401);
    expect(((await result.json()) as ApiErrorBody).error.code).toBe('unauthorized');
  });

  it('refuses a token that is not a session', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await ask(saved.id, 'made-up')).status).toBe(401);
  });

  it("refuses another player's session", async () => {
    vi.mocked(getSession).mockResolvedValue(session({ playerId: 'someone-else' }));
    expect((await ask(saved.id, 'theirs')).status).toBe(401);
  });

  it('refuses a session that has ended', async () => {
    vi.mocked(getSession).mockResolvedValue(session({ expiresAt: Math.floor(Date.now() / 1000) - 1 }));
    expect((await ask(saved.id, 'old')).status).toBe(401);
  });

  it("accepts the saved player's own live session", async () => {
    vi.mocked(getSession).mockResolvedValue(session());
    const result = await ask(saved.id, 'mine');
    expect(result.status).toBe(200);
    expect(getSession).toHaveBeenCalledWith('mine');
  });
});
