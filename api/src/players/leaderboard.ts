// Turns the list of players into the leaderboard. Pure: no database, no clock.
import { NEIGHBORHOODS } from '../../../shared/constants';
import type { LeaderboardRow, Player } from '../../../shared/types';
import { HIDDEN_NICKNAME, isBlockedNickname } from './nickname';

const TOP_PLAYERS = 3;

/**
 * One row per neighborhood, always all four, zeros included.
 * Rows are sorted by points, highest first, then by neighborhood name.
 * Each row lists its top 3 players by points, then by nickname.
 * A nickname that fails the check shows as "Player". This catches names saved before the check
 * existed, or before a word was added to it. The player keeps their points.
 */
export function aggregateLeaderboard(players: Pick<Player, 'nickname' | 'neighborhood' | 'points'>[]): LeaderboardRow[] {
  return NEIGHBORHOODS.map((neighborhood) => {
    const members = players.filter((player) => player.neighborhood === neighborhood.id);
    const row: LeaderboardRow = {
      neighborhood: neighborhood.id,
      points: members.reduce((total, player) => total + player.points, 0),
      playerCount: members.length,
      topPlayers: [...members]
        .sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname))
        .slice(0, TOP_PLAYERS)
        .map((player) => ({
          nickname: isBlockedNickname(player.nickname) ? HIDDEN_NICKNAME : player.nickname,
          points: player.points,
        })),
    };
    return { row, name: neighborhood.name };
  })
    .sort((a, b) => b.row.points - a.row.points || a.name.localeCompare(b.name))
    .map((entry) => entry.row);
}
