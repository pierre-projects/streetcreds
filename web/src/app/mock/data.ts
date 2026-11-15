// Picks the example data mock mode serves: the small set in fixtures.ts, or the populated set for
// the demo video in demo.ts when VITE_MOCK_DEMO=true (`vite --mode demo`).
import { demoLeaderboard, demoPlayer, demoReports } from './demo'
import * as fixtures from './fixtures'

export const MOCK_DEMO = import.meta.env.VITE_MOCK_DEMO === 'true'

export const { mockCouncilItems, mockLabel, mockSavedPlayer } = fixtures
/** The photo a report you submit shows. In the demo, the hero pothole's, to match the pothole label. */
export const MOCK_PHOTO_URL = MOCK_DEMO ? demoReports[0].photoUrl : fixtures.MOCK_PHOTO_URL
export const mockPlayer = MOCK_DEMO ? demoPlayer : fixtures.mockPlayer
export const mockLeaderboard = MOCK_DEMO ? demoLeaderboard : fixtures.mockLeaderboard
export const mockReports = MOCK_DEMO ? demoReports : fixtures.mockReports
/** A player who joins for the demo has no earlier reports. */
export const mockOwnReports = MOCK_DEMO ? [] : fixtures.mockOwnReports
