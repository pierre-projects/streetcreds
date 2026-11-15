// Every user-facing string for the app shell and the player screens, keyed by name.
// Screens read from here instead of hard-coding text, which keeps the wording in one place
// and makes a second language a small job later.
// Quest screens keep their own strings in features/quests/strings.ts, in the same shape.
import { APP_NAME } from '../../../shared/constants'
import type { Category, Severity } from '../../../shared/types'
import type {
  CityLayer,
  CityRecordKind,
  FoodType,
  ObstructionDetail,
  RestroomType,
  Shade,
} from '../features/players/cityRecords'

const yesNo = (value: boolean) => (value ? 'yes' : 'no')

export const strings = {
  appName: APP_NAME,
  tagline: 'Earn points for making your neighborhood better.',

  legal: {
    navigation: 'Legal and contact',
    back: 'Back to StreetCreds',
    lastUpdated: 'Last updated',
    effectiveDate: 'November 15, 2026',
    contact: 'Contact',
    joinPrefix: 'By joining you agree to the',
    joinAnd: 'and',
    privacyPolicy: 'Privacy Policy',
    references: {
      openStreetMap: 'OpenStreetMap copyright',
      gemini: 'Google Gemini',
      solana: 'Solana devnet',
    },
    pages: {
      privacy: {
        label: 'Privacy', title: 'Privacy Policy',
        sections: {
          stored: 'What we store', device: 'On your device', public: 'What is public',
          services: 'Other services', photos: 'Photos and location', retention: 'How long we keep data',
          choices: 'Your choices', children: 'Children', changes: 'Policy changes',
        },
      },
      terms: {
        label: 'Terms', title: 'Terms of Service',
        sections: {
          project: 'Using StreetCreds', city: 'City services', points: 'Game points',
          conduct: 'Acceptable use', permission: 'Photo permissions', ai: 'Accuracy',
          liability: 'Responsibility', law: 'Governing law',
        },
      },
      about: {
        label: 'About', title: 'About StreetCreds',
        sections: { project: 'The project', services: 'Data and services', credits: 'Credits' },
      },
    },
  },

  nav: {
    label: 'Main',
    home: 'Home',
    leaderboard: 'Leaderboard',
    map: 'Map',
  },

  header: {
    pointsLabel: 'CIVIC',
    points: (points: number) => `${points}`,
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
    reportCta: 'Report a problem',
    reportBody: 'Take a photo of a pothole, a broken light, graffiti or a blocked sidewalk.',
    councilTitle: 'Council quest',
    councilShort: 'Council',
    councilBody: 'Read a short summary of a real council item and answer one question.',
    dealsTitle: 'Local Deals',
    dealsShort: 'Deals',
    dealsBody: 'Spend CIVIC at curated neighborhood spots. Report nearby for a better rate.',
    recenter: 'Recenter map',
    mapLabel: 'Neighborhood radar map',
    reward: (points: number) => `+${points} pts`,
    walletNote: 'Every point is also a token on Solana.',
    walletLink: 'See your wallet',
    loading: 'Loading your points…',
    retry: 'Try again',
  },

  deals: {
    title: 'Local Deals',
    subtitle: 'Report a street problem within about two blocks of a shop to unlock the neighborhood rate.',
    loading: 'Loading deals…',
    loadError: 'Could not load Local Deals.',
    missing: 'We could not find that deal.',
    back: 'All deals',
    cost: (points: number) => `${points} CIVIC`,
    costUnlocked: (current: number, base: number) => `${current} (was ${base})`,
    unlockedHint: 'Neighborhood rate unlocked',
    detailBase: (cost: number) => `${cost} CIVIC for this offer`,
    detailUnlocked: (current: number, base: number) => `${current} CIVIC neighborhood rate (usually ${base})`,
    yourBalance: (points: number) => `You have ${points} CIVIC`,
    needMore: (points: number) => `You need ${points} more CIVIC for this deal.`,
    redeem: 'Redeem',
    redeeming: 'Redeeming…',
    redeemError: 'Could not redeem that deal.',
    codeLabel: 'Show this code',
    codeHint: 'Show this at the counter (demo).',
    spent: (points: number) => `Spent ${points} CIVIC`,
    demoNote: 'Demo deal · CIVIC on Solana devnet · not cash',
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

  // The names players see for the contract's categories and severities. Quest screens use these too.
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

  map: {
    title: 'Map',
    subtitle: 'Street problems players have reported. Tap a pin for details.',
    loading: 'Loading reports…',
    error: 'Could not load the reports.',
    retry: 'Try again',
    empty: 'No reports yet. Be the first to report a problem.',
    count: (count: number) => (count === 1 ? '1 open report' : `${count} open reports`),
    legend:
      'Color shows how serious it is. A number on a colored pin is how many times it has been reported. A black pin is several reports close together: tap it to zoom in.',
    countFiltered: (shown: number, total: number) => `Showing ${shown} of ${total} open reports`,
    noMatch: 'No open reports match these filters.',
    showAll: 'Show all',
    filtersLabel: 'Filter the reports',
    severityToggle: (severity: string, count: number) =>
      `${severity} severity, ${count === 1 ? '1 report' : `${count} reports`}`,
    typeLabel: 'Type',
    allTypes: 'All types',
    typeOption: (type: string, count: number) => `${type} (${count})`,
    groupLabel: (count: number) => `${count} reports here. Zoom in to see them.`,
    pinLabel: (category: string, severity: string, count: number) =>
      `${category}, ${severity.toLowerCase()} severity, reported ${count === 1 ? 'once' : `${count} times`}`,
    severity: (label: string) => `${label} severity`,
    reportedTimes: (count: number) => (count === 1 ? 'Reported once' : `Reported ${count} times`),
    photoAlt: (category: string) => `Photo of the reported problem: ${category.toLowerCase()}`,
    copy: 'Copy city report',
    copyHint: 'Makes a report you can paste into the city’s own form.',
    copied: 'Copied. Paste it into the city’s report form.',
    copyFailed: 'Could not copy. Try again.',
  },

  // The City of Tempe's own accessibility records, drawn on the map as square pins.
  city: {
    title: 'From the City of Tempe',
    // The arrow on the board's folded panel, where only the letter keys show.
    showDetails: 'From the City of Tempe: show the names and details',
    hideDetails: 'Fold down to the letter keys',
    intro:
      'Barriers the City’s own ADA survey found and still lists as awaiting repair, and helpful places from its open data. Switch a group on to see it on the map.',
    barriersLabel: 'Barriers awaiting repair',
    resourcesLabel: 'Helpful places',
    layers: {
      'bus-stops': 'Bus stops',
      'curb-ramps': 'Curb ramps',
      sidewalk: 'Sidewalk',
      water: 'Water and restrooms',
      food: 'Food help',
    } satisfies Record<CityLayer, string>,
    layerLetter: {
      'bus-stops': 'B',
      'curb-ramps': 'R',
      sidewalk: 'S',
      water: 'W',
      food: 'F',
    } satisfies Record<CityLayer, string>,
    layerToggle: (layer: string, count: number | null) =>
      count === null ? `From the City: ${layer}` : `From the City: ${layer}, ${count}`,
    loading: 'Loading the City records…',
    error: 'The City records could not be loaded. Player reports are not affected.',
    zoomHint: 'These are the small dots on the map: black for barriers, white for helpful places. Zoom in to tap one.',
    credit: (copiedAt: string) => `Source: City of Tempe ADA Transition Plan survey and open data, copied ${copiedAt}.`,
    eyebrow: 'City record',
    resourceEyebrow: 'Helpful place',
    kinds: {
      'bus-stop': 'Bus stop',
      'curb-ramp': 'Curb ramp',
      'uneven-sidewalk': 'Uneven sidewalk',
      obstruction: 'Blocked sidewalk',
      gap: 'Gap in the sidewalk',
      fountain: 'Drinking fountain',
      restroom: 'Public restroom',
      food: 'Food help',
    } satisfies Record<CityRecordKind, string>,
    // Helpful places.
    // The City gives a fountain only the short name of its park or site, such as "Clark".
    park: (name: string) => `Where: ${name}`,
    ada: (is: boolean) => `ADA accessible: ${yesNo(is)}`,
    bottleFiller: (has: boolean) => `Bottle filler: ${yesNo(has)}`,
    chilled: (is: boolean) => `Chilled: ${yesNo(is)}`,
    restrooms: {
      family: 'family',
      female: 'women',
      male: 'men',
    } satisfies Record<RestroomType, string>,
    restroomList: (rooms: string[]) => `Rooms: ${rooms.join(', ')}`,
    hours: (hours: string) => `Open: ${hours}`,
    lit: (is: boolean) => `Lit at night: ${yesNo(is)}`,
    foodTypes: {
      distribution: 'Food pantry or meals',
      produce: 'Produce pickup',
      'farm-bus': 'Farm Express bus stop',
    } satisfies Record<FoodType, string>,
    resourceSource: 'From the City of Tempe’s open data. Details can change: check before you go.',
    resourcePinLabel: (kind: string, where: string | null) => (where ? `${kind}, ${where}` : kind),
    // What the survey found, as a sentence.
    busStop: 'This stop does not meet the ADA.',
    curbRamp: 'This corner has no curb ramp.',
    lifted: (inches: number | undefined) =>
      inches === undefined ? 'A slab is lifted an inch or more.' : `A slab is lifted ${inches} in.`,
    obstruction: {
      plants: 'Plants block the sidewalk.',
      'fixed-object': 'A fixed object blocks the sidewalk.',
      grate: 'A grate or manhole cover is in the path.',
      other: 'Something blocks the sidewalk.',
    } satisfies Record<ObstructionDetail, string>,
    gap: 'There is a gap in the sidewalk.',
    shelter: (has: boolean) => `Shelter: ${yesNo(has)}`,
    bench: (has: boolean) => `Bench: ${yesNo(has)}`,
    shade: (shade: Shade) => `Shade: ${shade}`,
    surfaceTemp: (degrees: number) => `Surface temperature: ${degrees} °F (City heat study, 2015 to 2020)`,
    cityFix: (fix: string) => `City’s proposed fix: ${fix}`,
    source: (surveyed: string | null) =>
      `City ADA survey, ${surveyed ?? '2016 to 2020'}. Listed as awaiting repair. It may have been fixed since.`,
    reported: 'A player has reported a problem here.',
    // Links in a barrier's popup, and beside "Copy city report".
    // Kept short: the two links share one line of a popup.
    tell311: 'Tell Tempe 311',
    tell311Label: 'Open the City of Tempe’s service request form in a new tab',
    reportHere: (points: number) => `Report: +${points} pts`,
    reportHereLabel: (points: number) => `Report it in StreetCreds for ${points} points`,
    openForm: 'Open the form',
    pinLabel: (kind: string, where: string | null) => (where ? `City record: ${kind}, ${where}` : `City record: ${kind}`),
    // On a player's report that is at a spot the City recorded too.
    matchNote: (finding: string) => `Also in the City’s ADA survey, awaiting repair: ${finding}`,
    // The line added to "Copy city report".
    copyLine: (finding: string, where: string | null, ref: string, surveyed: string | null) =>
      `City ADA survey: ${finding}${where ? ` ${where}.` : ''} ${ref}${surveyed ? `, surveyed ${surveyed}` : ''}, listed as awaiting repair.`,
    recordRef: (id: string) => `Record ${id}`,
    rowRef: (layer: string, row: string) => `Survey layer ${layer}, row ${row}`,
    matched: (count: number) =>
      count === 1
        ? '1 player report is at a spot the City’s survey also recorded.'
        : `${count} player reports are at a spot the City’s survey also recorded.`,
  },

  // The big-screen board at /board. It reuses the leaderboard and map strings where they fit.
  board: {
    title: 'Live board',
    live: 'Live',
    open: 'Live board',
    play: 'Play',
    playAt: 'Play on your phone at streetcreds.app',
    mapLabel: 'Map of open reports',
    standingsTitle: 'Neighborhood standings',
    topPlayer: (nickname: string) => `${nickname} leads`,
    reportsTitle: 'Open reports',
    reportsHint: 'Pick a report to see it on the map.',
    showMore: (count: number) => `Show ${count} more`,
    sortLabel: 'Sort the list',
    sorts: {
      serious: 'Most serious',
      newest: 'Newest',
      most: 'Most reported',
    },
    // How long ago a report was made, on its row. Older than a day shows the date instead.
    justNow: 'Just now',
    minutesAgo: (minutes: number) => `${minutes} min ago`,
    hoursAgo: (hours: number) => `${hours} h ago`,
    newTag: 'New',
    inCitySurvey: 'Also in the City’s survey',
  },

  comingSoon: {
    body: 'This part of the game is still being built.',
    backHome: 'Back to home',
    report: 'Report a street problem',
    council: 'Council quest',
  },

  errors: {
    generic: 'Something went wrong. Try again.',
    offline: 'Could not reach StreetCreds. Check your connection and try again.',
    notConfigured: 'This copy of the app has no API address. Set VITE_API_URL in web/.env.',
    uploadFailed: 'The photo did not upload. Try again.',
    playerLoad: 'Could not load your points.',
  },
} as const
