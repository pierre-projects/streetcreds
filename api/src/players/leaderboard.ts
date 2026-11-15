// Turns the list of players into the leaderboard. Pure: no database, no clock.
import { NEIGHBORHOODS } from '../../../shared/constants';
import type { LeaderboardRow, Player, TopPlayer } from '../../../shared/types';
import { HIDDEN_NICKNAME, isBlockedNickname } from './nickname';

const TOP_PLAYERS = 3;
/** How many players the players board lists. */
const TOP_OVERALL = 10;

type Ranked = Pick<Player, 'nickname' | 'neighborhood' | 'points'>;

/** Most points first, then by nickname, so two players level on points keep the same order every time. */
const byPoints = (a: Ranked, b: Ranked) => b.points - a.points || a.nickname.localeCompare(b.nickname);

/** A nickname that fails the check shows as "Player". The player keeps their points. */
const shownNickname = (player: Ranked) => (isBlockedNickname(player.nickname) ? HIDDEN_NICKNAME : player.nickname);

/**
 * One row per neighborhood, always all four, zeros included.
 * Rows are sorted by points, highest first, then by neighborhood name.
 * Each row lists its top 3 players by points, then by nickname.
 * A nickname that fails the check shows as "Player". This catches names saved before the check
 * existed, or before a word was added to it. The player keeps their points.
 */
export function aggregateLeaderboard(players: Ranked[]): LeaderboardRow[] {
  return NEIGHBORHOODS.map((neighborhood) => {
    const members = players.filter((player) => player.neighborhood === neighborhood.id);
    const row: LeaderboardRow = {
      neighborhood: neighborhood.id,
      points: members.reduce((total, player) => total + player.points, 0),
      playerCount: members.length,
      topPlayers: [...members]
        .sort(byPoints)
        .slice(0, TOP_PLAYERS)
        .map((player) => ({ nickname: shownNickname(player), points: player.points })),
    };
    return { row, name: neighborhood.name };
  })
    .sort((a, b) => b.row.points - a.row.points || a.name.localeCompare(b.name))
    .map((entry) => entry.row);
}

/**
 * The players board: the 10 players with the most points, from every neighborhood together.
 * A player reports wherever they are in the city, so this ranks people on all they earned, while
 * the neighborhood rows rank the teams they joined. Players with no points yet are left out: a
 * board of zeros says nothing.
 */
export function topPlayersOverall(players: Ranked[]): TopPlayer[] {
  return players
    .filter((player) => player.points > 0)
    .sort(byPoints)
    .slice(0, TOP_OVERALL)
    .map((player) => ({ nickname: shownNickname(player), points: player.points, neighborhood: player.neighborhood }));
}
