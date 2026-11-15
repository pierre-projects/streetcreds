// Player routes (Pierre): POST /players, GET /players/:id, GET /leaderboard.
// Phase 0 has only a stand-in leaderboard. Phase 1 adds the other two routes.
import { Hono } from 'hono';
import type { LeaderboardResponse } from '../../../shared/api';
import { NEIGHBORHOODS } from '../../../shared/constants';

export const playerRoutes = new Hono();

// Stand-in for Phase 0: every neighborhood with zero points, sorted by name.
// Phase 1 replaces the body with a scan of the players table and aggregateLeaderboard().
playerRoutes.get('/leaderboard', (c) => {
  const body: LeaderboardResponse = {
    neighborhoods: [...NEIGHBORHOODS]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((n) => ({ neighborhood: n.id, points: 0, playerCount: 0, topPlayers: [] })),
    updatedAt: new Date().toISOString(),
  };
  return c.json(body);
});
