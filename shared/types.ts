// StreetCreds shared contract: data fields.
// Player, Report and Award are stored in DynamoDB exactly as written here:
// the attribute names are the field names. See TECHNICAL.md section 4.
// Agreed between Sarah and Pierre. Change only after both say yes.

import type { CATEGORIES, NEIGHBORHOODS, POINTS, SEVERITIES } from './constants';

export type NeighborhoodId = (typeof NEIGHBORHOODS)[number]['id'];
export type Category = (typeof CATEGORIES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type QuestType = keyof typeof POINTS;

export type ReportStatus = 'draft' | 'open' | 'merged';
export type ChainStatus = 'off' | 'sent' | 'pending';

/** A one-time device reading. Joining locations are validated but never stored. */
export interface LocationFix {
  lat: number;
  lng: number;
  accuracyMeters: number;
  capturedAt: string;
}

/** Table streetcreds-players. Key: id. */
export interface Player {
  /** uuid, made by the server. */
  id: string;
  /** 2 to 20 characters, trimmed. */
  nickname: string;
  neighborhood: NeighborhoodId;
  /** Running total. Changed only by awardPoints (add) or spendPoints (subtract), atomically. */
  points: number;
  /** Solana devnet public key. Null unless SOLANA_MODE is per-player. */
  walletAddress: string | null;
  /** ISO times of reports submitted in the last hour, for the rate limit. */
  recentReportTimes: string[];
  /** ISO 8601 UTC. */
  createdAt: string;
}

/** Table streetcreds-reports. Key: id. */
export interface Report {
  id: string;
  /** The player who took the photo. */
  playerId: string;
  /** S3 key: reports/{playerId}/{uuid}.jpg */
  photoKey: string;
  /** Null while the report is a draft. */
  lat: number | null;
  lng: number | null;
  /** From Gemini; the player may correct it when submitting. */
  category: Category;
  severity: Severity;
  /** One sentence from Gemini. */
  description: string;
  /** 1, plus one for each duplicate merged into this report. */
  count: number;
  status: ReportStatus;
  createdAt: string;
  /** Null while the report is a draft. */
  submittedAt: string | null;
}

/** Table streetcreds-awards. Key: id. */
export interface Award {
  /** `${questType}#${refId}#${playerId}`. Deterministic, so an award is paid once. */
  id: string;
  playerId: string;
  questType: QuestType;
  points: number;
  /** Solana devnet transaction signature, once the mint is sent. */
  txSignature: string | null;
  chainStatus: ChainStatus;
  createdAt: string;
}

/** Kept in api/src/quests/council.json, not in the database. */
export interface CouncilItem {
  id: string;
  title: string;
  /** Three sentences, plain language, checked by a person. */
  summary: string;
  question: string;
  /** Three or four answers. */
  options: string[];
  /** Index of the right answer. Never sent to the client. */
  answerIndex: number;
  /** The official agenda page. */
  sourceUrl: string;
}

// Shapes that only exist in API responses.

/** A report as the map receives it: with a temporary link to its photo. */
export type PublicReport = Report & { photoUrl: string };

/** A council item as the client receives it: no answer, plus whether this player has earned it. */
export type CouncilItemView = Omit<CouncilItem, 'answerIndex'> & { answered: boolean };

export interface LeaderboardRow {
  neighborhood: NeighborhoodId;
  points: number;
  playerCount: number;
  /** Up to 3, highest first. Nicknames only. */
  topPlayers: { nickname: string; points: number }[];
}

/** Curated Local Deals partner. Kept in api/src/deals/partners.json, not in the database. */
export interface Partner {
  id: string;
  name: string;
  neighborhood: NeighborhoodId;
  category: string;
  lat: number;
  lng: number;
  /** Meters. Usually DEAL_UNLOCK_RADIUS_M. */
  radiusMeters: number;
  /** CIVIC at full price. */
  baseCost: number;
  /** CIVIC after a nearby report unlock. Must be < baseCost. */
  unlockedCost: number;
  /** What the player gets (same text at either cost). */
  offer: string;
}

export type DealUnlockStatus = 'active' | 'redeemed';

/** Table streetcreds-deal-unlocks. Key: id = unlock:{playerId}:{partnerId}. */
export interface DealUnlock {
  id: string;
  playerId: string;
  partnerId: string;
  reportId: string;
  createdAt: string;
  status: DealUnlockStatus;
  /** Empty until accounts link this player. */
  accountId: string | null;
}

/** Table streetcreds-deal-redemptions. Key: id. */
export interface DealRedemption {
  id: string;
  playerId: string;
  partnerId: string;
  pointsSpent: number;
  usedUnlock: boolean;
  /** Six-character demo code shown at the counter. */
  code: string;
  txSignature: string | null;
  chainStatus: ChainStatus;
  createdAt: string;
  /** Empty until accounts link this player. */
  accountId: string | null;
}

/** Partner row as the client receives it on GET /deals. */
export interface DealPartnerView {
  id: string;
  name: string;
  neighborhood: NeighborhoodId;
  category: string;
  lat: number;
  lng: number;
  baseCost: number;
  unlockedCost: number;
  offer: string;
  unlocked: boolean;
  currentCost: number;
}

/** Unlock payload attached to a successful report submit when proximity hits. */
export interface DealUnlockView {
  partnerId: string;
  partnerName: string;
  baseCost: number;
  unlockedCost: number;
}
