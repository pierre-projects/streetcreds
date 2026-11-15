// Every user-facing string for the app shell and the player screens, keyed by name.
// Screens read from here instead of hard-coding text, which keeps the wording in one place
// and makes a second language a small job later.
// Quest screens keep their own strings in features/quests/strings.ts, in the same shape.
import { APP_NAME } from '../../../shared/constants'

export const strings = {
  appName: APP_NAME,
  tagline: 'Earn points for making your neighborhood better.',

  nav: {
    label: 'Main',
    home: 'Home',
    leaderboard: 'Leaderboard',
    map: 'Map',
  },

  header: {
    points: (points: number) => `${points} pts`,
    loading: 'Loading…',
  },

  comingSoon: {
    body: 'This part of the game is still being built.',
    backHome: 'Back to home',
    join: 'Joining opens soon',
    joinBody: 'The game is being built at sunhacks 2026. Check back shortly.',
    home: 'Home',
    report: 'Report a street problem',
    council: 'Council quest',
    leaderboard: 'Leaderboard',
    map: 'Map',
  },

  errors: {
    generic: 'Something went wrong. Try again.',
    offline: 'Could not reach StreetCreds. Check your connection and try again.',
    notConfigured: 'This copy of the app has no API address. Set VITE_API_URL in web/.env.',
    uploadFailed: 'The photo did not upload. Try again.',
    playerLoad: 'Could not load your points.',
  },
} as const
