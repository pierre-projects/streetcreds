import { describe, expect, it } from 'vitest';
import { aggregateLeaderboard, topPlayersOverall } from './leaderboard';

describe('aggregateLeaderboard', () => {
  it('returns all four neighborhoods with zeros for no players, sorted by name', () => {
    const rows = aggregateLeaderboard([]);
    expect(rows.map((row) => row.neighborhood)).toEqual(['asu-campus', 'downtown-tempe', 'north-tempe', 'south-tempe']);
    for (const row of rows) {
      expect(row).toMatchObject({ points: 0, playerCount: 0, topPlayers: [] });
    }
  });

  it('adds up points and counts players per neighborhood', () => {
    const rows = aggregateLeaderboard([
      { nickname: 'Sam', neighborhood: 'asu-campus', points: 50 },
      { nickname: 'Riya', neighborhood: 'asu-campus', points: 80 },
      { nickname: 'Dee', neighborhood: 'south-tempe', points: 30 },
    ]);
    expect(rows[0]).toMatchObject({ neighborhood: 'asu-campus', points: 130, playerCount: 2 });
    expect(rows[1]).toMatchObject({ neighborhood: 'south-tempe', points: 30, playerCount: 1 });
  });

  it('keeps a neighborhood with no players, with zeros', () => {
    const rows = aggregateLeaderboard([{ nickname: 'Sam', neighborhood: 'asu-campus', points: 50 }]);
    expect(rows).toHaveLength(4);
    expect(rows.find((row) => row.neighborhood === 'north-tempe')).toEqual({
      neighborhood: 'north-tempe',
      points: 0,
      playerCount: 0,
      topPlayers: [],
    });
  });

  it('breaks a tie between neighborhoods by name', () => {
    const rows = aggregateLeaderboard([
      { nickname: 'Jo', neighborhood: 'south-tempe', points: 100 },
      { nickname: 'Ana', neighborhood: 'downtown-tempe', points: 100 },
    ]);
    expect(rows.map((row) => row.neighborhood)).toEqual(['downtown-tempe', 'south-tempe', 'asu-campus', 'north-tempe']);
  });

  it('lists at most the top 3 players, highest first, ties by nickname', () => {
    const rows = aggregateLeaderboard([
      { nickname: 'Dee', neighborhood: 'asu-campus', points: 20 },
      { nickname: 'Cal', neighborhood: 'asu-campus', points: 70 },
      { nickname: 'Bea', neighborhood: 'asu-campus', points: 70 },
      { nickname: 'Abe', neighborhood: 'asu-campus', points: 90 },
    ]);
    expect(rows[0]?.topPlayers).toEqual([
      { nickname: 'Abe', points: 90 },
      { nickname: 'Bea', points: 70 },
      { nickname: 'Cal', points: 70 },
    ]);
    expect(rows[0]?.playerCount).toBe(4);
  });

  it('shows an offensive nickname as Player and keeps its points', () => {
    const rows = aggregateLeaderboard([
      { nickname: 'sh1t', neighborhood: 'asu-campus', points: 90 },
      { nickname: 'Sam', neighborhood: 'asu-campus', points: 50 },
    ]);
    expect(rows[0]).toMatchObject({ points: 140, playerCount: 2 });
    expect(rows[0]?.topPlayers).toEqual([
      { nickname: 'Player', points: 90 },
      { nickname: 'Sam', points: 50 },
    ]);
  });
});

describe('topPlayersOverall', () => {
  it('is empty when nobody has points', () => {
    expect(topPlayersOverall([])).toEqual([]);
    expect(topPlayersOverall([{ nickname: 'Sam', neighborhood: 'asu-campus', points: 0 }])).toEqual([]);
  });

  it('ranks players from every neighborhood together, highest first, ties by nickname', () => {
    const players = topPlayersOverall([
      { nickname: 'Dee', neighborhood: 'south-tempe', points: 20 },
      { nickname: 'Cal', neighborhood: 'north-tempe', points: 70 },
      { nickname: 'Bea', neighborhood: 'asu-campus', points: 70 },
      { nickname: 'Abe', neighborhood: 'downtown-tempe', points: 90 },
    ]);
    expect(players).toEqual([
      { nickname: 'Abe', points: 90, neighborhood: 'downtown-tempe' },
      { nickname: 'Bea', points: 70, neighborhood: 'asu-campus' },
      { nickname: 'Cal', points: 70, neighborhood: 'north-tempe' },
      { nickname: 'Dee', points: 20, neighborhood: 'south-tempe' },
    ]);
  });

  it('lists at most 10 players', () => {
    const many = Array.from({ length: 14 }, (_, index) => ({
      nickname: 'Player' + index,
      neighborhood: 'asu-campus' as const,
      points: 10 * (index + 1),
    }));
    const players = topPlayersOverall(many);
    expect(players).toHaveLength(10);
    expect(players[0]).toMatchObject({ nickname: 'Player13', points: 140 });
    expect(players[9]).toMatchObject({ nickname: 'Player4', points: 50 });
  });

  it('can list more than three players from one neighborhood', () => {
    const players = topPlayersOverall([
      { nickname: 'Abe', neighborhood: 'asu-campus', points: 90 },
      { nickname: 'Bea', neighborhood: 'asu-campus', points: 80 },
      { nickname: 'Cal', neighborhood: 'asu-campus', points: 70 },
      { nickname: 'Dee', neighborhood: 'asu-campus', points: 60 },
      { nickname: 'Eve', neighborhood: 'north-tempe', points: 50 },
    ]);
    expect(players.map((player) => player.nickname)).toEqual(['Abe', 'Bea', 'Cal', 'Dee', 'Eve']);
  });

  it('shows an offensive nickname as Player and keeps its place', () => {
    const players = topPlayersOverall([
      { nickname: 'sh1t', neighborhood: 'asu-campus', points: 90 },
      { nickname: 'Sam', neighborhood: 'north-tempe', points: 50 },
    ]);
    expect(players).toEqual([
      { nickname: 'Player', points: 90, neighborhood: 'asu-campus' },
      { nickname: 'Sam', points: 50, neighborhood: 'north-tempe' },
    ]);
  });

  it('does not change the list it is given', () => {
    const given = [
      { nickname: 'Dee', neighborhood: 'south-tempe' as const, points: 20 },
      { nickname: 'Abe', neighborhood: 'downtown-tempe' as const, points: 90 },
    ];
    topPlayersOverall(given);
    expect(given.map((player) => player.nickname)).toEqual(['Dee', 'Abe']);
  });
});
