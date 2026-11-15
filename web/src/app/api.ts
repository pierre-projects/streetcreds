// The only place the web app talks to the API. One typed function per route in
// docs/TECHNICAL.md section 5, using the request and response types from shared/api.ts.
//
//   import { api, ApiError } from '../../app/api'
//   const { report } = await api.createReport({ playerId, photoKey })
//
// Every function throws ApiError on failure. Its `message` is safe to show to the player.
// With VITE_USE_MOCKS=true the same functions answer from app/mock/ instead of the network.
import type {
  ApiErrorBody,
  CouncilAnswerRequest,
  CouncilAnswerResponse,
  CouncilListResponse,
  CreatePlayerRequest,
  CreateReportRequest,
  CreateReportResponse,
  GoogleSignInRequest,
  HealthResponse,
  LeaderboardResponse,
  ListDealsResponse,
  ListReportsResponse,
  PlayerReportsResponse,
  PlayerResponse,
  RedeemDealRequest,
  RedeemDealResponse,
  SignInResponse,
  SignOutResponse,
  SubmitReportRequest,
  SubmitReportResponse,
  UploadUrlResponse,
} from '../../../shared/api'
import type { Player } from '../../../shared/types'
import { ApiError } from './apiError'
import { mockApi } from './mock'
import { playerKey, queryClient } from './queryClient'
import { getSessionToken } from './session'
import { strings } from './strings'

export { ApiError } from './apiError'

export interface Api {
  /** GET /health */
  getHealth(): Promise<HealthResponse>
  /** POST /players */
  createPlayer(body: CreatePlayerRequest): Promise<PlayerResponse>
  /** GET /players/:id */
  getPlayer(playerId: string): Promise<PlayerResponse>
  /** GET /leaderboard */
  getLeaderboard(): Promise<LeaderboardResponse>
  /** GET /upload-url */
  getUploadUrl(playerId: string): Promise<UploadUrlResponse>
  /** Not an API route: PUTs the JPEG straight to the bucket, using the link from getUploadUrl. */
  uploadPhoto(uploadUrl: string, photo: Blob): Promise<void>
  /** POST /reports */
  createReport(body: CreateReportRequest): Promise<CreateReportResponse>
  /** POST /reports/:id/submit */
  submitReport(reportId: string, body: SubmitReportRequest): Promise<SubmitReportResponse>
  /** GET /reports */
  listReports(): Promise<ListReportsResponse>
  /** GET /quests/council */
  listCouncilItems(playerId: string): Promise<CouncilListResponse>
  /** POST /quests/council/answer */
  answerCouncilItem(body: CouncilAnswerRequest): Promise<CouncilAnswerResponse>
  /** GET /deals */
  listDeals(playerId: string): Promise<ListDealsResponse>
  /** POST /deals/:partnerId/redeem */
  redeemDeal(partnerId: string, body: RedeemDealRequest): Promise<RedeemDealResponse>
  /** POST /auth/google. The caller stores the result with completeSignIn() in player.ts. */
  signInWithGoogle(body: GoogleSignInRequest): Promise<SignInResponse>
  /** POST /auth/signout. Ends this device's session, or the one whose token is given. */
  signOut(sessionToken?: string): Promise<SignOutResponse>
  /** GET /players/:id/reports */
  listPlayerReports(playerId: string): Promise<PlayerReportsResponse>
}

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (API_URL === '') {
    throw new ApiError(0, 'internal', strings.errors.notConfigured)
  }

  // A signed-in player's session goes with every API request. Guests have none.
  // uploadPhoto does not come through here, so the token is never sent to the photo bucket.
  const headers = new Headers(init?.headers)
  const token = getSessionToken()
  if (token !== null && !headers.has('authorization')) {
    headers.set('authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'internal', strings.errors.offline)
  }

  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    // An empty or non-JSON body. Handled below.
  }

  if (!response.ok) {
    const error = (body as Partial<ApiErrorBody> | null)?.error
    throw new ApiError(response.status, error?.code ?? 'internal', error?.message ?? strings.errors.generic)
  }
  return body as T
}

function post<T>(path: string, data: unknown, sessionToken?: string): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(sessionToken === undefined ? {} : { authorization: `Bearer ${sessionToken}` }),
    },
    body: JSON.stringify(data),
  })
}

const realApi: Api = {
  getHealth: () => request('/health'),
  createPlayer: (body) => post('/players', body),
  getPlayer: (playerId) => request(`/players/${encodeURIComponent(playerId)}`),
  getLeaderboard: () => request('/leaderboard'),
  getUploadUrl: (playerId) => request(`/upload-url?playerId=${encodeURIComponent(playerId)}`),
  uploadPhoto: async (uploadUrl, photo) => {
    let response: Response
    try {
      // The Content-Type must be exactly image/jpeg, or the signed link is rejected.
      response = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: photo })
    } catch {
      throw new ApiError(0, 'internal', strings.errors.offline)
    }
    if (!response.ok) {
      throw new ApiError(response.status, 'internal', strings.errors.uploadFailed)
    }
  },
  createReport: (body) => post('/reports', body),
  submitReport: (reportId, body) => post(`/reports/${encodeURIComponent(reportId)}/submit`, body),
  listReports: () => request('/reports'),
  listCouncilItems: (playerId) => request(`/quests/council?playerId=${encodeURIComponent(playerId)}`),
  answerCouncilItem: (body) => post('/quests/council/answer', body),
  listDeals: (playerId) => request(`/deals?playerId=${encodeURIComponent(playerId)}`),
  redeemDeal: (partnerId, body) => post(`/deals/${encodeURIComponent(partnerId)}/redeem`, body),
  signInWithGoogle: (body) => post('/auth/google', body),
  signOut: (sessionToken) => post('/auth/signout', {}, sessionToken),
  listPlayerReports: (playerId) => request(`/players/${encodeURIComponent(playerId)}/reports`),
}

const source: Api = USE_MOCKS ? mockApi : realApi

/** Any response that carries the player updates the cache, so the header shows new points at once. */
function remember<T extends { player: Player }>(response: T): T {
  queryClient.setQueryData(playerKey(response.player.id), response.player)
  return response
}

export const api: Api = {
  ...source,
  createPlayer: async (body) => remember(await source.createPlayer(body)),
  getPlayer: async (playerId) => remember(await source.getPlayer(playerId)),
  submitReport: async (reportId, body) => remember(await source.submitReport(reportId, body)),
  answerCouncilItem: async (body) => remember(await source.answerCouncilItem(body)),
  redeemDeal: async (partnerId, body) => remember(await source.redeemDeal(partnerId, body)),
  signInWithGoogle: async (body) => remember(await source.signInWithGoogle(body)),
}
