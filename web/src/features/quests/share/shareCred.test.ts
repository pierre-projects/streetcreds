import { describe, expect, it } from 'vitest'
import type { LeaderboardRow, Player } from '../../../../../shared/types'
import { buildShareCred, buildShareText } from './shareCred'

const player: Pick<Player, 'nickname' | 'points' | 'neighborhood'> = {
  nickname: 'Sam',
  points: 180,
  neighborhood: 'asu-campus',
}

const row = (neighborhood: LeaderboardRow['neighborhood'], points: number): LeaderboardRow => ({
  neighborhood,
  points,
  playerCount: 1,
  topPlayers: [],
})

// As GET /leaderboard returns it: highest points first.
const leaderboard = [row('downtown-tempe', 310), row('asu-campus', 300), row('south-tempe', 120), row('north-tempe', 0)]

describe('buildShareCred', () => {
  it("names the neighborhood and gives its place on the leaderboard", () => {
    expect(buildShareCred(player, leaderboard)).toEqual({
      nickname: 'Sam',
      points: 180,
      neighborhood: 'ASU Campus',
      rank: 2,
      earned: null,
    })
  })

  it('has no rank until the leaderboard has loaded', () => {
    expect(buildShareCred(player, undefined).rank).toBeNull()
  })

  it('has no rank when the leaderboard does not list the neighborhood', () => {
    expect(buildShareCred(player, [row('downtown-tempe', 310)]).rank).toBeNull()
  })

  it('carries what was just earned', () => {
    expect(buildShareCred(player, leaderboard, { points: 50, category: 'pothole' }).earned).toEqual({
      points: 50,
      category: 'pothole',
    })
  })

  it('says only what the public leaderboard already shows about a player', () => {
    const everything = { ...player, id: 'player-1', walletAddress: 'wallet', accountId: 'account-1', createdAt: 'then', recentReportTimes: [] }
    expect(Object.keys(buildShareCred(everything, leaderboard)).sort()).toEqual(['earned', 'neighborhood', 'nickname', 'points', 'rank'])
  })
})

describe('buildShareText', () => {
  it('says the points and the team', () => {
    expect(buildShareText(buildShareCred(player, leaderboard))).toBe(
      'I have 180 street cred on StreetCreds. ASU Campus · #2 in Tempe.',
    )
  })

  it('leaves the rank out when it is not known', () => {
    expect(buildShareText(buildShareCred(player, undefined))).toBe('I have 180 street cred on StreetCreds. ASU Campus.')
  })

  it('leads with the report when the card follows one', () => {
    expect(buildShareText(buildShareCred(player, leaderboard, { points: 50, category: 'pothole' }))).toBe(
      'I just reported a pothole and earned +50 street cred on StreetCreds. 180 pts total. ASU Campus · #2 in Tempe.',
    )
  })

  it.each([
    ['streetlight', 'a broken streetlight'],
    ['graffiti', 'graffiti'],
    ['blocked-sidewalk', 'a blocked sidewalk'],
    ['other', 'a street problem'],
  ] as const)('reads naturally for a %s report', (category, words) => {
    expect(buildShareText(buildShareCred(player, leaderboard, { points: 50, category }))).toContain(`I just reported ${words} and`)
  })

  it('never includes a place more exact than the neighborhood', () => {
    const text = buildShareText(buildShareCred(player, leaderboard, { points: 50, category: 'pothole' }))
    expect(text).not.toMatch(/-?\d+\.\d{3,}/)
  })
})
