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
import type { Award, Player, PublicReport, QuestType, Report } from '../../../../shared/types'
import type { Api } from '../api'
import { ApiError } from '../apiError'
import { MOCK_PHOTO_URL, mockCouncilItems, mockLabel, mockLeaderboard, mockPlayer, mockReports } from './fixtures'

/** What POST /reports does with every photo: 'ok', or one of the errors the real route can return. */
const MOCK_REPORT_RESULT: 'ok' | 'not_street_problem' | 'label_failed' | 'rate_limited' = 'ok'

/** How the reward looks: 'pending' shows "On-chain confirmation pending", 'off' shows nothing. */
const MOCK_CHAIN_STATUS: Award['chainStatus'] = 'pending'

const DELAY_MS = 400
const wait = (ms = DELAY_MS) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const STATUS: Record<ErrorCode, number> = {
  validation_failed: 400,
  not_found: 404,
  already_submitted: 409,
  already_awarded: 409,
  not_street_problem: 422,
  rate_limited: 429,
  label_failed: 502,
  internal: 500,
}

const MESSAGE: Record<ErrorCode, string> = {
  validation_failed: 'Something in that request is not right. Check it and try again.',
  not_found: 'We could not find that.',
  already_submitted: 'This report was already submitted.',
  already_awarded: 'You already earned these points.',
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
const drafts = new Map<string, Report>()
const submitted: PublicReport[] = []
const answered = new Set<string>()
let counter = 0

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
    player = { ...mockPlayer, nickname, neighborhood: body.neighborhood, points: 0, createdAt: new Date().toISOString() }
    return { player }
  },

  async getPlayer(playerId) {
    await wait(150)
    // Any id works except 'missing', which lets you see what happens when a player is not found.
    if (playerId === 'missing') fail('not_found')
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
    return { neighborhoods, updatedAt: new Date().toISOString() }
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
    const draft = drafts.get(reportId)
    if (!draft) fail('not_found')
    if (draft.status !== 'draft') fail('already_submitted')
    const report: Report = {
      ...draft,
      lat: body.lat,
      lng: body.lng,
      category: body.category ?? draft.category,
      status: 'open',
      submittedAt: new Date().toISOString(),
    }
    drafts.set(reportId, report)
    submitted.unshift({ ...report, photoUrl: MOCK_PHOTO_URL })
    return { report, award: award('report-new', report.id), player, merged: false }
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
}
