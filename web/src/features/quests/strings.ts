import type { Category, Severity } from '../../../../shared/types'

export const questStrings = {
  report: {
    title: 'Report a street problem',
    captureHint: 'Take a clear photo of the problem, not of people.',
    takePhoto: 'Take a photo',
    chooseGallery: 'Choose from gallery',
    resizing: 'Preparing your photo…',
    uploading: 'Uploading…',
    labeling: 'Checking the photo…',
    confirmTitle: 'Does this look right?',
    categoryLabel: 'What kind of problem?',
    severityLabel: 'How serious?',
    submit: 'Submit report',
    locating: 'Finding your location…',
    locationDenied: 'We could not get your location. Tap the map to place the pin.',
    useMap: 'Pick on map',
    submitting: 'Sending…',
    tryAnother: 'Try another photo',
    retry: 'Try again',
  },
  reward: {
    eyebrow: 'Points earned',
    total: (points: number) => `${points} pts total`,
    pending: 'On-chain confirmation pending',
    explorer: 'See the transaction',
    unlock: (name: string, unlocked: number, base: number) =>
      `Unlocked a better rate at ${name} — ${unlocked} CIVIC instead of ${base}.`,
    dealsLink: 'See Local Deals',
    homeLink: 'Back home',
  },
  categories: {
    pothole: 'Pothole',
    streetlight: 'Streetlight',
    graffiti: 'Graffiti',
    'blocked-sidewalk': 'Blocked sidewalk',
    other: 'Other',
  } satisfies Record<Category, string>,
  severities: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  } satisfies Record<Severity, string>,
}
