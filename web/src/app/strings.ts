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

  join: {
    nicknameLabel: 'Pick a nickname',
    nicknameHint: (min: number, max: number) => `${min} to ${max} characters. No email or password.`,
    nicknameInvalid: (min: number, max: number) => `Nickname must be ${min} to ${max} characters.`,
    neighborhoodLabel: 'Your neighborhood',
    neighborhoodInvalid: 'Pick your neighborhood.',
    submit: 'Start playing',
    submitting: 'Joining…',
  },

  home: {
    pointsLabel: 'Your points',
    rank: (neighborhood: string, rank: number, total: number) => `${neighborhood} is #${rank} of ${total}`,
    neighborhoodPoints: (points: number) => `${points} pts as a neighborhood`,
    rankLoading: 'Loading the leaderboard…',
    rankError: 'Could not load the leaderboard.',
    questsTitle: 'Earn points',
    reportTitle: 'Report a street problem',
    reportBody: 'Take a photo of a pothole, a broken light, graffiti or a blocked sidewalk.',
    councilTitle: 'Council quest',
    councilBody: 'Read a short summary of a real council item and answer one question.',
    reward: (points: number) => `+${points} pts`,
    walletNote: 'Every point is also a token on Solana.',
    walletLink: 'See your wallet',
    loading: 'Loading your points…',
    retry: 'Try again',
  },

  leaderboard: {
    title: 'Leaderboard',
    subtitle: 'Points earned by each neighborhood. Updates as people play.',
    yours: 'Your neighborhood',
    rank: (rank: number) => `#${rank}`,
    points: (points: number) => `${points} pts`,
    players: (count: number) => (count === 1 ? '1 player' : `${count} players`),
    noPlayers: 'Nobody here yet.',
    loading: 'Loading the leaderboard…',
    error: 'Could not load the leaderboard.',
    retry: 'Try again',
  },

  comingSoon: {
    body: 'This part of the game is still being built.',
    backHome: 'Back to home',
    report: 'Report a street problem',
    council: 'Council quest',
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
