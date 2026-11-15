// Player routes (Pierre): POST /players, GET /players/:id, GET /leaderboard.
// The steps for each are in docs/TECHNICAL.md section 5.
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import type { LeaderboardResponse, PlayerResponse } from '../../../shared/api';
import type { Player } from '../../../shared/types';
import { ApiError } from '../lib/errors';
import { aggregateLeaderboard } from './leaderboard';
import { CreatePlayerSchema } from './schemas';
import { getPlayer, putNewPlayer, scanPlayers } from './store';

export const playerRoutes = new Hono();

playerRoutes.post('/players', async (c) => {
  const input = CreatePlayerSchema.parse(await c.req.json());
  const player: Player = {
    id: randomUUID(),
    nickname: input.nickname,
    neighborhood: input.neighborhood,
    points: 0,
    // Phase 2 gives each player a devnet address here when SOLANA_MODE is per-player.
    walletAddress: null,
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
