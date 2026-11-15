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

/** 1st, 2nd, 3rd, 4th, ... */
function ordinal(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

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
    profile: 'Profile',
  },

  header: {
    pointsLabel: 'CIVIC',
    points: (points: number) => `${points}`,
    coinLabel: (points: number) => `${points} CIVIC`,
    loading: 'Loading…',
  },

  join: {
    nicknameLabel: 'Pick a nickname',
    nicknameHint: (min: number, max: number) => `${min} to ${max} characters. No email or password.`,
    nicknameInvalid: (min: number, max: number) => `Nickname must be ${min} to ${max} characters.`,
    neighborhoodLabel: 'Your neighborhood',
    // Read out before the four neighborhood names on the join screen.
    teamsLabel: 'The four neighborhoods',
    locationHint: 'Your current location assigns your neighborhood. You need to be in Tempe to play. We do not save your joining location.',
    locating: 'Finding your location.',
    locationError: 'We could not find your location. Please try again.',
    watchBoard: 'View the live board',
    submit: 'Use my location and join',
    submitting: 'Joining…',
  },

  // What to do when the browser refuses to give a position. The general wording is in
  // shared/location.ts; these are the cases where the player needs exact steps.
  location: {
    blockedOnIphone:
      'Location is blocked for this browser. In iPhone Settings, go to Privacy & Security, then Location Services, then Safari Websites (or the app you opened this page in), and pick While Using the App. Then reload this page and tap Allow.',
    notSecure: 'Location only works on a secure address. Open the app from its https:// link and try again.',
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
    subtitle: 'Points by neighborhood. Updates as people play.',
    yours: 'Yours',
    rank: (rank: number) => `#${rank}`,
    points: (points: number) => `${points} pts`,
    players: (count: number) => (count === 1 ? '1 player' : `${count} players`),
    noPlayers: 'Nobody here yet.',
    empty: 'No neighborhoods to show yet.',
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
    // Under the name of the player's own neighborhood, where its edges are drawn on the map.
    yourNeighborhood: 'Your neighborhood',
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
    // Links in a barrier's popup.
    // Kept short: the two links share one line of a popup.
    tell311: 'Tell Tempe 311',
    tell311Label: 'Open the City of Tempe’s service request form in a new tab',
    reportHere: (points: number) => `Report: +${points} pts`,
    reportHereLabel: (points: number) => `Report it in StreetCreds for ${points} points`,
    // "Send to Tempe 311": passing one report on to the City's own form (CityHandoff.tsx).
    // The City's form has an Address box, a Description box and "Add a photo"; those names are its own.
    handoff: {
      // The button in a report's popup on the map, and the line under it.
      send: 'Send to Tempe 311',
      sendHint: 'Opens the City’s form with this report ready to paste.',
      eyebrow: 'Tell the City',
      title: 'Send this to Tempe 311',
      intro: 'StreetCreds does not send reports to the City. Paste these into the City’s form and submit it there.',
      locationLabel: '1. Location, for the form’s Address box',
      copyLocation: 'Copy location',
      noLocation: 'This report has no location. Move the pin on the City’s map instead.',
      detailsLabel: '2. Details, for the form’s Description box',
      copyDetails: 'Copy details',
      photoLabel: '3. Photo, for the form’s “Add a photo”',
      savePhoto: 'Save photo',
      photoFileName: 'streetcreds-report.jpg',
      open: 'Open Tempe’s form',
      newTab: '(opens in a new tab)',
      // Where the City's form opens. `name` is the City's own name for that page.
      opens: {
        form: (name: string) => `It opens on the City’s “${name}” form.`,
        list: (name: string) => `It opens on the City’s “${name}” list. Pick the closest match.`,
        picker: 'It opens on the City’s list of issues. Pick the closest match.',
      },
      // The status line. It always says what to do next.
      idle: 'Opening the form copies the location for you.',
      idleNoLocation: 'Copy the details, then open the form.',
      locationCopied: 'Location copied. Paste it into Address, then come back for the details.',
      detailsCopied: 'Details copied. Paste them into Description.',
      copyFailed: 'Could not copy. Press and hold the text to copy it.',
      cityPage: 'Form not opening? Use the City’s 311 page',
      close: 'Close',
    },
    pinLabel: (kind: string, where: string | null) => (where ? `City record: ${kind}, ${where}` : `City record: ${kind}`),
    // On a player's report that is at a spot the City recorded too.
    matchNote: (finding: string) => `Also in the City’s ADA survey, awaiting repair: ${finding}`,
    // The line added to the details a player copies for the City's form.
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

  // The game design: Mayor Patch's lines and the new Home and Join screens.
  game: {
    home: {
      welcome: (nickname: string) => `Welcome back, ${nickname}.`,
      leading: (name: string) => `${name} is in first place. Keep it there.`,
      catchUp: (name: string, reports: number, place: number) =>
        `${reports === 1 ? 'One more report puts' : `${reports} more reports put`} ${name} in ${ordinal(place)} place.`,
      rankLeading: (total: number, ahead: number) => `1st of ${total} · ${ahead} points ahead`,
      rankBehind: (rank: number, total: number, behind: number) =>
        `${ordinal(rank)} of ${total} · ${behind} ${behind === 1 ? 'point' : 'points'} behind`,
      questsEyebrow: 'Quests',
      reportTitle: 'Report',
      reportBody: 'Snap a street problem',
      councilTitle: 'Council',
      councilBody: 'Read one item, answer one question',
      dealsTitle: 'Local Deals',
      dealsBody: 'Spend CIVIC at neighborhood spots',
      budgetTitle: 'Budget',
      budgetBody: 'See where $100 of taxes goes',
      soon: 'Soon',
      plus: (points: number) => `+${points}`,
      mapTitle: 'Live map',
      mapBody: (count: number) => (count === 1 ? '1 open report. Tap to explore.' : `${count} open reports. Tap to explore.`),
    },
    join: {
      mayor: "I'm Mayor Patch. Help me fix this town and I'll make it worth your while.",
      nickname: 'Nickname',
      teams: 'The four neighborhoods',
      start: 'Start playing',
      finePrint: 'No email, no password. Points are for fun and have no cash value.',
    },
  },

  comingSoon: {
    body: 'This part of the game is still being built.',
    backHome: 'Back to home',
    report: 'Report a street problem',
    council: 'Council quest',
  },

  auth: {
    continueWithGoogle: 'Continue with Google',
    joinHint: 'Optional. Signing in keeps your points and reports on any phone.',
    newPerson: 'Signed in with Google. Pick a nickname to finish.',
    signingIn: 'Signing in…',
    failed: 'Google sign-in did not work. Try again.',
    unavailable: 'Google sign-in could not load here. Open streetcreds.app in your phone’s own browser and try again.',
    switchTitle: 'Switch to your saved player?',
    switchBody: (saved: string, savedPoints: number, guestPoints: number) =>
      `This Google account already has a saved player: ${saved}, with ${savedPoints} pts. ` +
      (guestPoints > 0
        ? `You have ${guestPoints} pts on this phone as a guest. They will not move to your saved player.`
        : 'The guest player on this phone will be left behind.'),
    switchConfirm: 'Switch to my saved player',
    switchCancel: 'Stay as a guest',
  },

  profile: {
    title: 'Profile',
    loading: 'Loading your profile…',
    pointsLabel: 'Street cred',
    points: (points: number) => `${points} pts`,
    joined: (date: string) => `Playing since ${date}`,
    walletNote: 'Every point is also a token on Solana.',
    wallet: 'See your wallet',
    reportsTitle: 'Your reports',
    reportsCount: (count: number) => (count === 1 ? '1 report sent in' : `${count} reports sent in`),
    reportsLoading: 'Loading your reports…',
    reportsError: 'Could not load your reports.',
    reportsEmpty: 'You have not reported anything yet.',
    reportsEmptyAction: 'Report a street problem',
    reportsMapLabel: 'Map of your reports',
    reportedOn: (date: string) => `Reported ${date}`,
    guestTitle: 'Save your player',
    guestBody:
      'You are playing as a guest, and this player lives on this phone only. Sign in with Google to keep your points and reports on any phone. We keep an ID from Google, never your email, name or picture.',
    guestOnly: 'You are playing as a guest. This player lives on this phone only.',
    signedInTitle: 'Signed in with Google',
    signedInBody: 'Your points and reports are saved. Sign in on any phone to pick up where you left off.',
    signOut: 'Sign out',
    signingOut: 'Signing out…',
  },

  errors: {
    generic: 'Something went wrong. Try again.',
    offline: 'Could not reach StreetCreds. Check your connection and try again.',
    notConfigured: 'This copy of the app has no API address. Set VITE_API_URL in web/.env.',
    uploadFailed: 'The photo did not upload. Try again.',
    playerLoad: 'Could not load your points.',
  },
} as const
