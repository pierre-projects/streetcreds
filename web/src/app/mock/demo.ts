// The populated StreetCreds for the demo video (docs/VIDEO-SCRIPT.md). Mock mode serves this set
// instead of fixtures.ts when VITE_MOCK_DEMO=true as well as VITE_USE_MOCKS=true, which
// `vite --mode demo` turns on (the "streetcreds-web-demo" preview in .claude/launch.json).
//
// The numbers are chosen so the video's story works: Sam joins ASU Campus with 0 points, sitting
// 30 behind Downtown Tempe. One report (+50) puts ASU Campus first, and one council answer (+30) follows.
//
// Photos: drop a real photo named after a report id into ./demo-photos/ (for example
// demo-pothole-1.jpg) and that report shows it. Every other report shows a drawn placeholder.
import type { Category, LeaderboardRow, Player, PublicReport, Severity } from '../../../../shared/types'

/** The player before joining. Joining sets the nickname and the neighborhood from the location. */
export const demoPlayer: Player = {
  id: 'demo-player-sam',
  nickname: 'Sam',
  neighborhood: 'asu-campus',
  points: 0,
  // The treasury's public address, so the wallet link on the home screen has somewhere to go.
  walletAddress: 'ETt92Vzd3AwTKztSKyF7VzKgkKzyg9zoUqXJqdRqMtnR',
  recentReportTimes: [],
  createdAt: new Date().toISOString(),
  accountId: null,
}

/**
 * The other players' totals. Mock mode adds the playing player's points and one player on top,
 * so with Sam at 0 the board reads Downtown 2,340, ASU Campus 2,310 (44 players).
 * Every total is a sum of 50s, 30s and 20s, the points a quest pays.
 */
export const demoLeaderboard: LeaderboardRow[] = [
  {
    neighborhood: 'downtown-tempe',
    points: 2340,
    playerCount: 31,
    topPlayers: [
      { nickname: 'Dee', points: 310 },
      { nickname: 'Luis', points: 260 },
      { nickname: 'Ana', points: 210 },
    ],
  },
  {
    neighborhood: 'asu-campus',
    points: 2310,
    playerCount: 43,
    topPlayers: [
      { nickname: 'Riya', points: 280 },
      { nickname: 'Marcus', points: 240 },
      { nickname: 'Kai', points: 190 },
    ],
  },
  {
    neighborhood: 'south-tempe',
    points: 1480,
    playerCount: 19,
    topPlayers: [
      { nickname: 'Jo', points: 220 },
      { nickname: 'Priya', points: 170 },
      { nickname: 'Ken', points: 150 },
    ],
  },
  {
    neighborhood: 'north-tempe',
    points: 960,
    playerCount: 12,
    topPlayers: [
      { nickname: 'Talia', points: 180 },
      { nickname: 'Ben', points: 140 },
      { nickname: 'Rosa', points: 90 },
    ],
  },
]

// --- Photos -------------------------------------------------------------------------------------

const realPhotos = import.meta.glob<string>('./demo-photos/*.{jpg,jpeg,png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const PLACEHOLDER_STYLE: Record<Category, { from: string; to: string; label: string; glyph: string }> = {
  pothole: {
    from: '#2b2b2e',
    to: '#121214',
    label: 'Pothole',
    glyph: '<ellipse cx="320" cy="250" rx="150" ry="62" fill="#08080a" stroke="#ffd60a" stroke-width="6"/>',
  },
  streetlight: {
    from: '#1a2033',
    to: '#07090f',
    label: 'Streetlight',
    glyph:
      '<rect x="312" y="150" width="16" height="200" fill="#3a3f4d"/><rect x="270" y="138" width="100" height="22" rx="8" fill="#3a3f4d"/>' +
      '<circle cx="320" cy="168" r="14" fill="#08080a" stroke="#ffd60a" stroke-width="5"/>',
  },
  graffiti: {
    from: '#2f2a33',
    to: '#121014',
    label: 'Graffiti',
    glyph:
      '<path d="M190 280 C 240 180, 300 320, 350 220 S 450 260, 460 200" fill="none" stroke="#ffd60a" stroke-width="16" stroke-linecap="round"/>',
  },
  'blocked-sidewalk': {
    from: '#2a2d2b',
    to: '#101211',
    label: 'Blocked sidewalk',
    glyph:
      '<rect x="160" y="270" width="320" height="26" fill="#3d423f"/><path d="M260 270 L320 170 L380 270 Z" fill="#08080a" stroke="#ffd60a" stroke-width="6"/>' +
      '<rect x="316" y="205" width="8" height="34" fill="#ffd60a"/><rect x="316" y="246" width="8" height="8" fill="#ffd60a"/>',
  },
  other: {
    from: '#2b2b2e',
    to: '#121214',
    label: 'Street problem',
    glyph: '<circle cx="320" cy="240" r="60" fill="none" stroke="#ffd60a" stroke-width="6"/>',
  },
}

function placeholderPhoto(category: Category): string {
  const style = PLACEHOLDER_STYLE[category]
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">' +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${style.from}"/><stop offset="1" stop-color="${style.to}"/></linearGradient></defs>` +
        '<rect width="640" height="480" fill="url(#g)"/>' +
        style.glyph +
        `<text x="320" y="410" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="700" fill="#ffffff">${style.label}</text>` +
        '<text x="320" y="446" text-anchor="middle" font-family="monospace" font-size="16" fill="#9a9aa0">DEMO PHOTO</text>' +
        '</svg>',
    )
  )
}

function photoFor(id: string, category: Category): string {
  const match = Object.entries(realPhotos).find(([path]) => path.slice(path.lastIndexOf('/') + 1).startsWith(`${id}.`))
  return match ? match[1] : placeholderPhoto(category)
}

// --- Reports ------------------------------------------------------------------------------------

/** Minutes before the page loaded, so the map always reads as the last two days. */
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

type Seed = [id: string, category: Category, severity: Severity, lat: number, lng: number, minutesAgo: number, description: string]

// Each point sits inside the game zone of the neighborhood it is filed under (shared/location.ts).
// count stays 1: merging duplicates is not built yet (docs/TRACKS.md), so the demo does not imply it.
const SEEDS: Seed[] = [
  // Downtown Tempe
  ['demo-pothole-1', 'pothole', 'high', 33.4244, -111.9409, 12, 'Deep pothole in the right lane near the crosswalk.'],
  ['demo-pothole-2', 'pothole', 'medium', 33.4291, -111.9452, 95, 'Pothole filled with gravel at the edge of the bike lane.'],
  ['demo-streetlight-1', 'streetlight', 'high', 33.4268, -111.9418, 240, 'Streetlight is dark over the crosswalk.'],
  ['demo-graffiti-1', 'graffiti', 'low', 33.4310, -111.9431, 410, 'Spray paint on the side wall of the underpass.'],
  ['demo-sidewalk-1', 'blocked-sidewalk', 'medium', 33.4222, -111.9447, 620, 'Two scooters and a sign block most of the sidewalk.'],
  ['demo-pothole-3', 'pothole', 'low', 33.4199, -111.9488, 1300, 'Small pothole forming at the storm drain.'],
  ['demo-graffiti-2', 'graffiti', 'medium', 33.4290, -111.9500, 1820, 'Tags across the utility box at the corner.'],
  // ASU Campus
  ['demo-sidewalk-curb', 'blocked-sidewalk', 'high', 33.4265, -111.93825, 38, 'The sidewalk ends at a full-height curb at the corner, with no ramp down to the street.'],
  ['demo-streetlight-2', 'streetlight', 'medium', 33.4189, -111.9335, 150, 'Path light is out between the library and the bus stop.'],
  ['demo-pothole-4', 'pothole', 'high', 33.4161, -111.9296, 320, 'Wide pothole in the lane next to the light rail crossing.'],
  ['demo-sidewalk-2', 'blocked-sidewalk', 'medium', 33.4210, -111.9367, 540, 'Construction fence covers the whole sidewalk with no detour sign.'],
  ['demo-graffiti-3', 'graffiti', 'low', 33.4235, -111.9289, 900, 'Stickers and marker tags on the crosswalk signal pole.'],
  ['demo-streetlight-3', 'streetlight', 'high', 33.4142, -111.9318, 1450, 'Two streetlights in a row are dark on the walk to the parking garage.'],
  // South Tempe
  ['demo-pothole-5', 'pothole', 'high', 33.3920, -111.9262, 70, 'Pothole in the left turn lane, cars swerve around it.'],
  ['demo-sidewalk-3', 'blocked-sidewalk', 'low', 33.3786, -111.9405, 480, 'Overgrown bushes push walkers into the street.'],
  ['demo-streetlight-4', 'streetlight', 'medium', 33.4002, -111.9098, 760, 'Streetlight flickers on and off at the bus stop.'],
  ['demo-pothole-6', 'pothole', 'medium', 33.3655, -111.9310, 1150, 'Cracked patch has opened into a pothole by the curb.'],
  ['demo-graffiti-4', 'graffiti', 'medium', 33.3850, -111.9178, 1600, 'Large tag on the canal path bridge.'],
  ['demo-sidewalk-4', 'blocked-sidewalk', 'high', 33.3712, -111.9221, 2100, 'A fallen palm frond pile blocks the sidewalk and the curb ramp.'],
  // North Tempe
  ['demo-pothole-7', 'pothole', 'medium', 33.4455, -111.9262, 180, 'Pothole at the edge of the crosswalk, easy to trip on.'],
  ['demo-streetlight-5', 'streetlight', 'medium', 33.4430, -111.9150, 700, 'Streetlight is out on the corner by the park entrance.'],
  ['demo-graffiti-5', 'graffiti', 'low', 33.4498, -111.9331, 1250, 'Spray paint on the back of the bus shelter.'],
  ['demo-sidewalk-5', 'blocked-sidewalk', 'medium', 33.4420, -111.9055, 1700, 'Trash bins left on the sidewalk all week.'],
  ['demo-pothole-8', 'pothole', 'low', 33.4410, -111.9390, 2400, 'Shallow pothole across the middle of the bike lane.'],
  ['demo-streetlight-6', 'streetlight', 'high', 33.4520, -111.9200, 2650, 'Whole block of streetlights is dark.'],
]

export const demoReports: PublicReport[] = SEEDS.map(([id, category, severity, lat, lng, minutesAgo, description], index) => {
  const submittedAt = ago(minutesAgo)
  return {
    id,
    playerId: `demo-player-${(index % 9) + 1}`,
    photoKey: `reports/demo/${id}.jpg`,
    photoUrl: photoFor(id, category),
    lat,
    lng,
    category,
    severity,
    description,
    count: 1,
    status: 'open',
    createdAt: ago(minutesAgo + 1),
    submittedAt,
  }
})
