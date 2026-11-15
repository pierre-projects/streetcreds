// Player routes (Pierre): POST /players, GET /players/:id, GET /leaderboard.
// The steps for each are in docs/TECHNICAL.md section 5.
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import type { LeaderboardResponse, PlayerResponse } from '../../../shared/api';
import type { Player } from '../../../shared/types';
import { env } from '../lib/env';
import { ApiError } from '../lib/errors';
import { aggregateLeaderboard } from './leaderboard';
import { requirePlayLocation } from './location';
import { CreatePlayerSchema } from './schemas';
import { getPlayer, putNewPlayer, scanPlayers } from './store';

export const playerRoutes = new Hono();

playerRoutes.post('/players', async (c) => {
  const input = CreatePlayerSchema.parse(await c.req.json());
  const neighborhood = await requirePlayLocation(input.location, 'join');

  // In per-player mode each player gets a devnet address of their own to hold their points.
  // The Solana library is loaded only here and in awardPoints, so other routes start quickly.
  let walletAddress: string | null = null;
  if (env.SOLANA_MODE === 'per-player') {
    const { newWalletAddress } = await import('../points/solana');
    walletAddress = newWalletAddress();
  }

  const player: Player = {
    id: randomUUID(),
    nickname: input.nickname,
    neighborhood,
    points: 0,
    walletAddress,
    recentReportTimes: [],
    createdAt: new Date().toISOString(),
  };
  await putNewPlayer(player);
  const body: PlayerResponse = { player };
  return c.json(body, 201);
});

playerRoutes.get('/players/:id', async (c) => {
  const player = await getPlayer(c.req.param('id'));
  if (!player) {
    throw new ApiError('not_found', 'We could not find that player.');
  }
  const body: PlayerResponse = { player };
  return c.json(body);
});

playerRoutes.get('/leaderboard', async (c) => {
  const body: LeaderboardResponse = {
    neighborhoods: aggregateLeaderboard(await scanPlayers()),
    updatedAt: new Date().toISOString(),
  };
  return c.json(body);
});
