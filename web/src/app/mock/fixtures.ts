// Example data for mock mode (VITE_USE_MOCKS=true). Typed against the contract in shared/, so a
// change to the contract breaks the build here instead of letting the examples drift.
// None of this is real: the council items in particular are made up for layout only.
// Sarah: the report and council fixtures are yours to change.
import { MAP_CENTER } from '../../../../shared/constants'
import type { CouncilItem, LeaderboardRow, Player, PublicReport } from '../../../../shared/types'

/** A grey placeholder picture, so mock reports need no image files. */
export const MOCK_PHOTO_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">' +
      '<rect width="640" height="480" fill="#cfd8d1"/>' +
      '<text x="320" y="250" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#55635a">Mock photo</text>' +
      '</svg>',
  )

export const mockPlayer: Player = {
  id: 'mock-player-1',
  nickname: 'Sam',
  neighborhood: 'asu-campus',
  points: 130,
  // The treasury's public address, so the wallet link on the home screen has somewhere to go.
  walletAddress: 'ETt92Vzd3AwTKztSKyF7VzKgkKzyg9zoUqXJqdRqMtnR',
  recentReportTimes: [],
  createdAt: '2026-11-14T17:40:03.000Z',
}

/** The other players' totals. The mock player's own points are added on top of these. */
export const mockLeaderboard: LeaderboardRow[] = [
  {
    neighborhood: 'asu-campus',
    points: 300,
    playerCount: 2,
    topPlayers: [
      { nickname: 'Riya', points: 180 },
      { nickname: 'Marcus', points: 120 },
    ],
  },
  {
    neighborhood: 'downtown-tempe',
    points: 310,
    playerCount: 3,
    topPlayers: [
      { nickname: 'Dee', points: 150 },
      { nickname: 'Luis', points: 110 },
      { nickname: 'Ana', points: 50 },
    ],
  },
  {
    neighborhood: 'south-tempe',
    points: 120,
    playerCount: 1,
    topPlayers: [{ nickname: 'Jo', points: 120 }],
  },
  { neighborhood: 'north-tempe', points: 0, playerCount: 0, topPlayers: [] },
]

export const mockReports: PublicReport[] = [
  {
    id: 'mock-report-1',
    playerId: 'mock-player-2',
    photoKey: 'reports/mock-player-2/mock-1.jpg',
    photoUrl: MOCK_PHOTO_URL,
    lat: MAP_CENTER.lat - 0.004,
    lng: MAP_CENTER.lng + 0.006,
    category: 'pothole',
    severity: 'high',
    description: 'Deep pothole in the right lane near the crosswalk.',
    count: 3,
    status: 'open',
    createdAt: '2026-11-14T18:01:40.000Z',
    submittedAt: '2026-11-14T18:02:11.000Z',
  },
  {
    id: 'mock-report-2',
    playerId: 'mock-player-3',
    photoKey: 'reports/mock-player-3/mock-2.jpg',
    photoUrl: MOCK_PHOTO_URL,
    lat: MAP_CENTER.lat + 0.003,
    lng: MAP_CENTER.lng - 0.004,
    category: 'streetlight',
    severity: 'medium',
    description: 'Streetlight is dark at the corner by the bus stop.',
    count: 1,
    status: 'open',
    createdAt: '2026-11-14T18:20:05.000Z',
    submittedAt: '2026-11-14T18:21:30.000Z',
  },
  {
    id: 'mock-report-3',
    playerId: 'mock-player-4',
    photoKey: 'reports/mock-player-4/mock-3.jpg',
    photoUrl: MOCK_PHOTO_URL,
    lat: MAP_CENTER.lat + 0.006,
    lng: MAP_CENTER.lng + 0.002,
    category: 'graffiti',
    severity: 'low',
    description: 'Spray paint on the side wall of the underpass.',
    count: 1,
    status: 'open',
    createdAt: '2026-11-14T18:40:00.000Z',
    submittedAt: '2026-11-14T18:41:12.000Z',
  },
]

/** What Gemini "says" about every photo in mock mode. */
export const mockLabel = {
  category: 'pothole',
  severity: 'high',
  description: 'Deep pothole in the right lane near the crosswalk.',
} as const

/** Made-up items for layout only. Real items come from a checked agenda, in api/src/quests/council.json. */
export const mockCouncilItems: CouncilItem[] = [
  {
    id: 'mock-item-1',
    title: 'Sample item: shade structures at bus stops',
    summary:
      'This is example text, not a real agenda item. The council would vote on adding shade at ten bus stops. The money would come from the transit fund.',
    question: 'What would this item pay for?',
    options: ['New bus routes', 'Shade at bus stops', 'A parking garage'],
    answerIndex: 1,
    sourceUrl: 'https://example.com/sample-agenda',
  },
  {
    id: 'mock-item-2',
    title: 'Sample item: later hours at a city pool',
    summary:
      'This is example text, not a real agenda item. The proposal keeps one city pool open two hours later in summer. Staff would report back on the cost after one season.',
    question: 'When would the later hours apply?',
    options: ['All year', 'Only in summer', 'Only on weekends', 'Only on holidays'],
    answerIndex: 1,
    sourceUrl: 'https://example.com/sample-agenda',
  },
  {
    id: 'mock-item-3',
    title: 'Sample item: repaving a neighborhood street',
    summary:
      'This is example text, not a real agenda item. The contract would repave one mile of a residential street. Work would start next spring and take about six weeks.',
    question: 'About how long would the work take?',
    options: ['Six days', 'Six weeks', 'Six months'],
    answerIndex: 1,
    sourceUrl: 'https://example.com/sample-agenda',
  },
]
