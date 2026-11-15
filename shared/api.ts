// StreetCreds shared contract: the API table as types.
// One request type and one response type per route. See TECHNICAL.md section 5
// for the steps each route runs.
// Agreed between Sarah and Pierre. Change only after both say yes.

import type {
  Award,
  Category,
  CouncilItemView,
  DealPartnerView,
  DealRedemption,
  DealUnlockView,
  LeaderboardRow,
  LocationFix,
  Player,
  PublicReport,
  Report,
} from './types';

// GET /health (Pierre)
export interface HealthResponse {
  ok: true;
}

// POST /players (Pierre) -> 201
export interface CreatePlayerRequest {
  nickname: string;
  /** The server assigns the neighborhood from this device reading. */
  location: LocationFix;
}

// POST /players, GET /players/:id (Pierre)
export interface PlayerResponse {
  player: Player;
}

// GET /leaderboard (Pierre)
export interface LeaderboardResponse {
  /** All four neighborhoods, highest points first. */
  neighborhoods: LeaderboardRow[];
  updatedAt: string;
}

// GET /upload-url?playerId={id} (Sarah)
export interface UploadUrlResponse {
  /** PUT the JPEG here with the header Content-Type: image/jpeg. Valid for 5 minutes. */
  uploadUrl: string;
  photoKey: string;
}

// POST /reports (Sarah) -> 201. Labels the photo and saves a draft. No points yet.
export interface CreateReportRequest {
  playerId: string;
  photoKey: string;
}
export interface CreateReportResponse {
  /** status is 'draft'. */
  report: Report;
}

// POST /reports/:id/submit (Sarah). Publishes the report and awards points.
export interface SubmitReportRequest {
  playerId: string;
  /** The report is placed at this device reading; arbitrary pins are not accepted. */
  location: LocationFix;
  /** Present when the player corrected Gemini's category. */
  category?: Category;
}
export interface SubmitReportResponse {
  /** The published report, or the existing report this one was merged into. */
  report: Report;
  award: Award;
  player: Player;
  merged: boolean;
  /** Present when the report was within walking distance of a curated partner. */
  unlock?: DealUnlockView;
}

// GET /reports (Sarah). Open reports only, newest first, at most 200.
export interface ListReportsResponse {
  reports: PublicReport[];
}

// GET /quests/council?playerId={id} (Sarah)
export interface CouncilListResponse {
  items: CouncilItemView[];
}

// POST /quests/council/answer (Sarah)
export interface CouncilAnswerRequest {
  playerId: string;
  itemId: string;
  answerIndex: number;
}
export interface CouncilAnswerResponse {
  correct: boolean;
  /** Null when the answer was wrong. */
  award: Award | null;
  player: Player;
}

// GET /deals?playerId={id} (Pierre)
export interface ListDealsResponse {
  partners: DealPartnerView[];
}

// POST /deals/:partnerId/redeem (Pierre)
export interface RedeemDealRequest {
  playerId: string;
}
export interface RedeemDealResponse {
  redemption: DealRedemption;
  player: Player;
}

// Errors. Every non-2xx response has this body.
export const ERROR_CODES = {
  validation_failed: 400,
  not_found: 404,
  already_submitted: 409,
  already_awarded: 409,
  insufficient_points: 409,
  not_street_problem: 422,
  rate_limited: 429,
  label_failed: 502,
  internal: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    /** Written for the player. Safe to show on screen. */
    message: string;
  };
}
