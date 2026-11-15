// What a player's "street cred" card says. Pure: the same facts feed the picture, the text that
// goes with it and the preview on screen.
//
// The card never carries a location, and nothing about a player beyond what the public
// leaderboard already shows: a nickname, a neighborhood and points.
import { NEIGHBORHOODS } from '../../../../../shared/constants'
import type { Category, LeaderboardRow, Player } from '../../../../../shared/types'
import { questStrings } from '../strings'

/** Where the card sends people. */
export const SHARE_URL = 'https://streetcreds.app'

/** What was just earned, when the card is shown right after a report. */
export interface Earned {
  points: number
  category: Category
}

export interface ShareCred {
  nickname: string
  points: number
  neighborhood: string
  /** The neighborhood's place on the leaderboard, from 1. Null until the leaderboard has loaded. */
  rank: number | null
  earned: Earned | null
}

/**
 * `rows` is the leaderboard as GET /leaderboard returns it: highest points first, so a
 * neighborhood's rank is its position in the list.
 */
export function buildShareCred(
  player: Pick<Player, 'nickname' | 'points' | 'neighborhood'>,
  rows: readonly LeaderboardRow[] | undefined,
  earned?: Earned,
): ShareCred {
  const index = rows?.findIndex((row) => row.neighborhood === player.neighborhood) ?? -1
  return {
    nickname: player.nickname,
    points: player.points,
    neighborhood: NEIGHBORHOODS.find((n) => n.id === player.neighborhood)?.name ?? player.neighborhood,
    rank: index === -1 ? null : index + 1,
    earned: earned ?? null,
  }
}

/** The words that travel with the picture. The link is added by whoever sends it. */
export function buildShareText(cred: ShareCred): string {
  const text = questStrings.share
  const place = cred.rank === null ? cred.neighborhood : text.placeRanked(cred.neighborhood, cred.rank)
  return cred.earned
    ? text.messageEarned(text.reported[cred.earned.category], cred.earned.points, cred.points, place)
    : text.message(cred.points, place)
}
