// Mock mode: a stand-in for the whole API that lives in the browser tab.
// Turn it on with VITE_USE_MOCKS=true in web/.env and restart `npm run dev`.
//
// It keeps a little state while the tab is open (the player's points, reports you submit,
// council items you answer), so a screen can be built and clicked through before its route exists.
// Reloading the page resets everything.
//
// To see an error state on the report screen, change MOCK_REPORT_RESULT below.
import { NICKNAME_MAX, NICKNAME_MIN, POINTS } from '../../../../shared/constants'
import type { ErrorCode } from '../../../../shared/api'
import type { LocationPurpose } from '../../../../shared/location'
import { createPlayAreaLookup, PlayLocationError } from '../../../../shared/playArea'
import { TEMPE_BOUNDARY } from '../../../../shared/tempeBoundary'
import type { Award, DealUnlockView, Player, PublicReport, QuestType, Report } from '../../../../shared/types'
import type { Api } from '../api'
import { ApiError } from '../apiError'
import {
  MOCK_PHOTO_URL,
  mockCouncilItems,
  mockLabel,
  mockLeaderboard,
  mockOwnReports,
  mockPlayer,
  mockReports,
  mockSavedPlayer,
} from './fixtures'
import { distanceMeters, mockPartners } from './partners'

/** What POST /reports does with every photo: 'ok', or one of the errors the real route can return. */
const MOCK_REPORT_RESULT: 'ok' | 'not_street_problem' | 'label_failed' | 'rate_limited' = 'ok'

/** How the reward looks: 'pending' shows "On-chain confirmation pending", 'off' shows nothing. */
const MOCK_CHAIN_STATUS: Award['chainStatus'] = 'pending'

/**
 * What the mock Google account is. 'none': it has no saved player, so "Continue with Google"
 * on the join screen leads to the nickname form and "Save your player" links the guest.
 * 'exists': it already owns a saved player (Riya), so signing in brings her back, and signing
 * in over a guest shows the "your guest points will not move" warning.
 */
const MOCK_SAVED_PLAYER = 'none' as 'none' | 'exists'

const DELAY_MS = 400
const wait = (ms = DELAY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms))
// The same check the API makes, with the bundled copy of the boundary behind it, so mock mode
// also works with no network. There is no clock allowance: the reading and this check share a clock.
const lookupLocation = createPlayAreaLookup(undefined, { fallback: TEMPE_BOUNDARY })

async function requireMockLocation(location: Parameters<typeof lookupLocation>[0], purpose: LocationPurpose) {
  try {
    return await lookupLocation(location, purpose)
  } catch (error) {
    if (error instanceof PlayLocationError) fail(error.code, error.message)
    throw error
  }
}

const STATUS: Record<ErrorCode, number> = {
  validation_failed: 400,
  unauthorized: 401,
  not_found: 404,
  already_linked: 409,
  already_submitted: 409,
  already_awarded: 409,
  insufficient_points: 409,
  not_street_problem: 422,
  rate_limited: 429,
  label_failed: 502,
  internal: 500,
}

const MESSAGE: Record<ErrorCode, string> = {
  validation_failed: 'Something in that request is not right. Check it and try again.',
  unauthorized: 'Sign in again to keep playing.',
  not_found: 'We could not find that.',
  already_linked: 'That Google account already has a saved player. Sign in instead.',
  already_submitted: 'This report was already submitted.',
  already_awarded: 'You already earned these points.',
  insufficient_points: 'You do not have enough CIVIC for this deal yet.',
  not_street_problem: 'That photo does not look like a street problem. Try another photo.',
  rate_limited: 'You have sent 5 reports in the last hour. Try again later.',
  label_failed: 'We could not read that photo. Try again.',
  internal: 'Something went wrong on our side. Try again.',
}

function fail(code: ErrorCode, message: string = MESSAGE[code]): never {
  throw new ApiError(STATUS[code], code, message)
}

// State for this browser tab.
let player: Player = { ...mockPlayer }
/** The player the mock Google account owns, once there is one. */
let saved: Player | null = MOCK_SAVED_PLAYER === 'exists' ? { ...mockSavedPlayer } : null
/** Earlier reports of whoever is playing. A player who has just joined has none. */
let ownFixtures: PublicReport[] = mockOwnReports
/** The guest who was playing before a sign-in switched players, in case the switch is declined. */
let guestBefore: { player: Player; ownFixtures: PublicReport[] } | null = null
const drafts = new Map<string, Report>()
const submitted: PublicReport[] = []
const answered = new Set<string>()
/** Partner ids with an active neighborhood-rate unlock. */
const activeUnlocks = new Set<string>()
let counter = 0

function unlockNear(lat: number, lng: number): DealUnlockView | undefined {
  let nearest = null as (typeof mockPartners)[number] | null
  let nearestDistance = Infinity
  for (const partner of mockPartners) {
    const d = distanceMeters({ lat, lng }, { lat: partner.lat, lng: partner.lng })
    if (d <= partner.radiusMeters && d < nearestDistance) {
      nearest = partner
      nearestDistance = d
    }
  }
  if (!nearest) return undefined
  activeUnlocks.add(nearest.id)
  return {
    partnerId: nearest.id,
    partnerName: nearest.name,
    baseCost: nearest.baseCost,
    unlockedCost: nearest.unlockedCost,
  }
}

function award(questType: QuestType, refId: string): Award {
  const points = POINTS[questType]
  player = { ...player, points: player.points + points }
  return {
    id: `${questType}#${refId}#${player.id}`,
    playerId: player.id,
    questType,
    points,
    txSignature: null,
    chainStatus: MOCK_CHAIN_STATUS,
    createdAt: new Date().toISOString(),
  }
}

export const mockApi: Api = {
  async getHealth() {
    await wait(100)
    return { ok: true }
  },

  async createPlayer(body) {
    await wait()
    const nickname = body.nickname.trim()
    if (nickname.length < NICKNAME_MIN || nickname.length > NICKNAME_MAX) {
      fail('validation_failed', `Nickname must be ${NICKNAME_MIN} to ${NICKNAME_MAX} characters.`)
    }
    const neighborhood = await requireMockLocation(body.location, 'join')
    if (body.credential !== undefined && saved) fail('already_linked')
    player = { ...mockPlayer, nickname, neighborhood, points: 0, createdAt: new Date().toISOString() }
    ownFixtures = []
    if (body.credential === undefined) return { player }
    // "Continue with Google" for a new person: the player is saved from the start.
    player = { ...player, accountId: 'mock-account-1' }
    saved = player
    return { player, sessionToken: 'mock-session' }
  },

  async getPlayer(playerId) {
    await wait(150)
    // Any id works except 'missing', which lets you see what happens when a player is not found.
    if (playerId === 'missing') fail('not_found')
    // While a switch to the saved player waits for a yes, the guest's id still answers as the guest.
    if (guestBefore && playerId === guestBefore.player.id) return { player: guestBefore.player }
    return { player }
  },

  async getLeaderboard() {
    await wait(150)
    const neighborhoods = mockLeaderboard
      .map((row) =>
        row.neighborhood === player.neighborhood
          ? {
              ...row,
              points: row.points + player.points,
              playerCount: row.playerCount + 1,
              topPlayers: [...row.topPlayers, { nickname: player.nickname, points: player.points }]
                .sort((a, b) => b.points - a.points)
                .slice(0, 3),
            }
          : row,
      )
      .sort((a, b) => b.points - a.points)
    // The players board. The fixtures only name each neighborhood's top three, which is enough to fill it.
    const players = [
      ...mockLeaderboard.flatMap((row) => row.topPlayers.map((top) => ({ ...top, neighborhood: row.neighborhood }))),
      { nickname: player.nickname, points: player.points, neighborhood: player.neighborhood },
    ]
      .filter((entry) => entry.points > 0)
      .sort((a, b) => b.points - a.points || a.nickname.localeCompare(b.nickname))
      .slice(0, 10)
    return { neighborhoods, players, updatedAt: new Date().toISOString() }
  },

  async getUploadUrl(playerId) {
    await wait(150)
    counter += 1
    return { uploadUrl: 'mock://upload', photoKey: `reports/${playerId}/mock-${counter}.jpg` }
  },

  async uploadPhoto() {
    await wait(600)
  },

  async createReport(body) {
    // Labeling takes a few seconds for real, so the mock is slow on purpose.
    await wait(1500)
    if (MOCK_REPORT_RESULT !== 'ok') fail(MOCK_REPORT_RESULT)
    counter += 1
    const report: Report = {
      id: `mock-draft-${counter}`,
      playerId: body.playerId,
      photoKey: body.photoKey,
      lat: null,
      lng: null,
      ...mockLabel,
      count: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
      submittedAt: null,
    }
    drafts.set(report.id, report)
    return { report }
  },

  async submitReport(reportId, body) {
    await wait(700)
    await requireMockLocation(body.location, 'report')
    const { lat, lng } = body.location
    const draft = drafts.get(reportId)
    if (!draft) fail('not_found')
    if (draft.status !== 'draft') fail('already_submitted')
    const report: Report = {
      ...draft,
      lat,
      lng,
      category: body.category ?? draft.category,
      status: 'open',
      submittedAt: new Date().toISOString(),
    }
    drafts.set(reportId, report)
    submitted.unshift({ ...report, photoUrl: MOCK_PHOTO_URL })
    const unlock = unlockNear(lat, lng)
    return { report, award: award('report-new', report.id), player, merged: false, ...(unlock ? { unlock } : {}) }
  },

  async listReports() {
    await wait(200)
    return { reports: [...submitted, ...mockReports] }
  },

  async listCouncilItems() {
    await wait(200)
    const items = mockCouncilItems.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      question: item.question,
      options: item.options,
      sourceUrl: item.sourceUrl,
      answered: answered.has(item.id),
    }))
    return { items }
  },

  async answerCouncilItem(body) {
    await wait()
    const item = mockCouncilItems.find((candidate) => candidate.id === body.itemId)
    if (!item) fail('not_found')
    if (body.answerIndex !== item.answerIndex) {
      return { correct: false, award: null, player }
    }
    if (answered.has(item.id)) fail('already_awarded')
    answered.add(item.id)
    return { correct: true, award: award('council', item.id), player }
  },

  async listDeals() {
    await wait(200)
    return {
      partners: mockPartners.map((partner) => {
        const unlocked = activeUnlocks.has(partner.id)
        return {
          id: partner.id,
          name: partner.name,
          neighborhood: partner.neighborhood,
          category: partner.category,
          lat: partner.lat,
          lng: partner.lng,
          baseCost: partner.baseCost,
          unlockedCost: partner.unlockedCost,
          offer: partner.offer,
          unlocked,
          currentCost: unlocked ? partner.unlockedCost : partner.baseCost,
        }
      }),
    }
  },

  async redeemDeal(partnerId) {
    await wait()
    const partner = mockPartners.find((p) => p.id === partnerId)
    if (!partner) fail('not_found')
    const usedUnlock = activeUnlocks.has(partner.id)
    const cost = usedUnlock ? partner.unlockedCost : partner.baseCost
    if (player.points < cost) fail('insufficient_points', `You need ${cost} CIVIC for this deal.`)
    player = { ...player, points: player.points - cost }
    if (usedUnlock) activeUnlocks.delete(partner.id)
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)]
    return {
      redemption: {
        id: `mock-redeem-${++counter}`,
        playerId: player.id,
        partnerId: partner.id,
        pointsSpent: cost,
        usedUnlock,
        code,
        txSignature: null,
        chainStatus: MOCK_CHAIN_STATUS,
        createdAt: new Date().toISOString(),
        accountId: null,
      },
      player,
    }
  },

  async signInWithGoogle(body) {
    await wait()
    // A returning person: the Google account already owns a player.
    if (saved) {
      const switched = body.playerId !== undefined && body.playerId !== saved.id
      if (switched) {
        guestBefore = { player, ownFixtures }
        ownFixtures = mockOwnReports.map((report) => ({ ...report, playerId: mockSavedPlayer.id }))
      }
      player = saved
      return { player, sessionToken: 'mock-session', switched }
    }
    // "Save your player": link the guest on this device.
    if (body.playerId !== undefined && player.accountId === null) {
      player = { ...player, accountId: 'mock-account-1' }
      saved = player
      return { player, sessionToken: 'mock-session', switched: false }
    }
    // A new person: the join screen asks for a nickname next.
    fail('not_found', 'There is no saved player for this Google account yet.')
  },

  async signOut(sessionToken) {
    await wait(150)
    // A token passed in means "Stay as a guest" after the switch warning: put the guest back.
    if (sessionToken !== undefined && guestBefore) {
      player = guestBefore.player
      ownFixtures = guestBefore.ownFixtures
    }
    guestBefore = null
    return { ok: true }
  },

  async listPlayerReports(playerId) {
    await wait(200)
    return { reports: [...submitted, ...ownFixtures].filter((report) => report.playerId === playerId) }
  },
}
