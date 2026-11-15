// Player routes (Pierre): POST /players, GET /players/:id, GET /players/:id/reports, GET /leaderboard.
// The steps for each are in docs/TECHNICAL.md section 5.
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import type { LeaderboardResponse, PlayerReportsResponse, PlayerResponse } from '../../../shared/api';
import type { Account, Player } from '../../../shared/types';
import { env } from '../lib/env';
import { ApiError } from '../lib/errors';
import { deleteAccount, googleAccountKey, putNewAccount } from './accounts';
import { requirePlayer } from './auth';
import { verifyGoogleCredential } from './google';
import { aggregateLeaderboard } from './leaderboard';
import { requirePlayLocation } from './location';
import { ownReports, scanReportsByPlayer, withPhotoUrls } from './playerReports';
import { CreatePlayerSchema } from './schemas';
import { startSession } from './sessions';
import { putNewPlayer, scanPlayers } from './store';

export const playerRoutes = new Hono();

playerRoutes.post('/players', async (c) => {
  const input = CreatePlayerSchema.parse(await c.req.json());
  const neighborhood = await requirePlayLocation(input.location);
  const playerId = randomUUID();
  const createdAt = new Date().toISOString();

  // "Continue with Google": the new player is saved to that account from the start.
  // The account row is written first; its condition is what stops one Google account
  // from ever owning two players.
  let account: Account | null = null;
  if (input.credential !== undefined) {
    const { sub } = await verifyGoogleCredential(input.credential);
    account = { id: googleAccountKey(sub), accountId: randomUUID(), playerId, createdAt };
    if (!(await putNewAccount(account))) throw new ApiError('already_linked');
  }

  // In per-player mode each player gets a devnet address of their own to hold their points.
  // The Solana library is loaded only here and in awardPoints, so other routes start quickly.
  let walletAddress: string | null = null;
  if (env.SOLANA_MODE === 'per-player') {
    const { newWalletAddress } = await import('../points/solana');
    walletAddress = newWalletAddress();
  }

  const player: Player = {
    id: playerId,
    nickname: input.nickname,
    neighborhood,
    points: 0,
    walletAddress,
    recentReportTimes: [],
    createdAt,
    accountId: account?.accountId ?? null,
  };
  try {
    await putNewPlayer(player);
  } catch (error) {
    // Do not leave an account pointing at a player that was never written.
    if (account) await deleteAccount(account.id);
    throw error;
  }

  const body: PlayerResponse = account ? { player, sessionToken: await startSession(player.id) } : { player };
  return c.json(body, 201);
});

playerRoutes.get('/players/:id', async (c) => {
  const body: PlayerResponse = { player: await requirePlayer(c, c.req.param('id')) };
  return c.json(body);
});

playerRoutes.get('/players/:id/reports', async (c) => {
  const player = await requirePlayer(c, c.req.param('id'));
  const reports = await withPhotoUrls(ownReports(await scanReportsByPlayer(player.id)));
  const body: PlayerReportsResponse = { reports };
  return c.json(body);
});

playerRoutes.get('/leaderboard', async (c) => {
  const body: LeaderboardResponse = {
    neighborhoods: aggregateLeaderboard(await scanPlayers()),
    updatedAt: new Date().toISOString(),
  };
  return c.json(body);
});
