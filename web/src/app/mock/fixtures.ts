// Example data for mock mode (VITE_USE_MOCKS=true). Typed against the contract in shared/, so a
// change to the contract breaks the build here instead of letting the examples drift.
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
  {
    // A few meters from a real City record (a corner with no curb ramp on S Myrtle Ave, in
    // web/public/data/city-records.json), so mock mode shows a report matched to the City's survey.
    id: 'mock-report-4',
    playerId: 'mock-player-5',
    photoKey: 'reports/mock-player-5/mock-4.jpg',
    photoUrl: MOCK_PHOTO_URL,
    lat: 33.4265,
    lng: -111.93825,
    category: 'blocked-sidewalk',
    severity: 'high',
    description: 'The sidewalk ends at a full-height curb at the corner, with no ramp down to the street.',
    count: 2,
    status: 'open',
    createdAt: '2026-11-14T19:05:00.000Z',
    submittedAt: '2026-11-14T19:06:20.000Z',
  },
]

/** What Gemini "says" about every photo in mock mode. */
export const mockLabel = {
  category: 'pothole',
  severity: 'high',
  description: 'Deep pothole in the right lane near the crosswalk.',
} as const

/** Same checked Tempe agenda items as api/src/quests/council.json (Nov 5, 2026 regular meeting). */
export const mockCouncilItems: CouncilItem[] = [
  {
    id: '2026-11-05-7b8-solar-group-buy',
    title: '7B8: Residential solar and energy storage group purchase',
    summary:
      'Council is asked to award a one-year contract, with four one-year renewal options, to Solar United Neighbors to run a Residential Solar and Energy Storage Group Purchasing Program. The program is meant to help Tempe homeowners get solar panels and optional battery storage at lower cost through group buying. The City estimates the contract value will exceed $100,000 over the term, but the City will not pay for equipment, installation, warranties, or financing and will not be a party to homeowner contracts.',
    question: 'Who pays for the solar equipment and installation under this program?',
    options: [
      'The City of Tempe pays the full cost',
      'Homeowners, under their own agreements with installers',
      'Arizona State University',
      'A federal grant that requires a City match',
    ],
    answerIndex: 1,
    sourceUrl: 'https://tempe.hylandcloud.com/AgendaOnline/Meetings/ViewMeeting?id=1976&doctype=1',
  },
  {
    id: '2026-11-05-7c9-flash-bus',
    title: '7C9: Flash bus funding agreement with ASU',
    summary:
      'Council is asked to adopt a resolution authorizing the Mayor to sign Amendment One to an intergovernmental agreement with the Arizona Board of Regents, for Arizona State University, to fund Flash (Free Local Area Shuttle) bus service. For fiscal year 2026-27, ASU will pay a total of $491,406 for Flash operations. Of that total, $480,875 comes from ASU and $10,531 from Federal Preventive Maintenance Funds.',
    question: 'How much will ASU pay in total for Flash bus service in FY 2026-27?',
    options: ['$10,531', '$150,000', '$491,406', '$3,508,491'],
    answerIndex: 2,
    sourceUrl: 'https://tempe.hylandcloud.com/AgendaOnline/Meetings/ViewMeeting?id=1976&doctype=1',
  },
  {
    id: '2026-11-05-8a3-rio-salado-bridge',
    title: '8A3: Rio Salado Upstream Pedestrian Bridge design',
    summary:
      'Council is asked to award a professional services contract to T.Y. Lin International, Inc. for Project No. 6011191, the Rio Salado Upstream Pedestrian Bridge. The contract amount is $3,508,491.32. Funds for the contract and related costs are appropriated for fiscal year 2026/27 in Capital Improvement Project No. 6011191.',
    question: 'What is this professional services contract for?',
    options: [
      'Playground equipment for city parks',
      'Powdered activated carbon for water treatment',
      'The Rio Salado Upstream Pedestrian Bridge project',
      'Two-way radios for public safety',
    ],
    answerIndex: 2,
    sourceUrl: 'https://tempe.hylandcloud.com/AgendaOnline/Meetings/ViewMeeting?id=1976&doctype=1',
  },
]
