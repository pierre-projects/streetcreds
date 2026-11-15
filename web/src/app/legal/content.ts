import type { strings } from '../strings'

export const legalDetails = {
  operator: 'the StreetCreds team',
  contactEmail: 'contact@streetcreds.app',
  effectiveDate: '2026-11-15',
} as const

export type LegalPageId = keyof typeof strings.legal.pages
type Reference = keyof typeof strings.legal.references
export type LegalSection = { paragraphs: readonly string[]; references?: readonly Reference[] }
type LegalContent = {
  [Page in LegalPageId]: {
    intro: string
    sections: { [Key in keyof (typeof strings.legal.pages)[Page]['sections']]: LegalSection }
  }
}

export const legalReferences: Record<Reference, string> = {
  openStreetMap: 'https://www.openstreetmap.org/copyright',
  gemini: 'https://ai.google.dev/gemini-api/docs',
  solana: 'https://solana.com/docs/references/clusters',
}

// Keyed like strings.ts: translate values, keeping page and section keys unchanged.
// Keep collection and feature descriptions aligned with the implemented screens
// and routes.
export const legalContent = {
  privacy: {
    intro: `This policy explains how ${legalDetails.operator} collects and uses information when you play.`,
    sections: {
      stored: { paragraphs: [
        'We store your nickname, neighborhood, player ID and game activity, including points, reports and demo deal redemptions. Reports include a photo, location, description and submission details. If points are recorded on the test network, we also store a public wallet address and transaction details.',
        'We use this information to run the game, display reports and scores, and limit misuse.',
      ] },
      device: { paragraphs: [
        'Your browser saves a player ID so you can return to the game. No email or password is required. We do not use advertising or analytics trackers.',
      ] },
      public: { paragraphs: [
        'Player profiles and submitted reports can be viewed by others. Leaderboards show nicknames and scores. Report photos, locations and descriptions appear on the public map. Use a nickname that does not identify you.',
      ] },
      services: { paragraphs: [
        'AWS hosts the app and stores game data. Uploaded photos are sent to Google Gemini to identify street problems. OpenStreetMap supplies map tiles. Hosting and map providers receive your IP address; service logs may include request details and player IDs.',
        'Point transactions on Solana devnet are public and may contain a wallet address or player ID. We cannot delete those records from the network.',
        '“Send to Tempe 311” copies a report’s location or details to your clipboard and opens the City of Tempe’s service request form in a new tab. That form is run for the city by Accela. StreetCreds sends it nothing, and what you enter there is covered by the city’s policies, not this one.',
      ] },
      photos: { paragraphs: [
        'Location access is required to join and submit reports in Tempe. We use your joining location to assign a neighborhood without saving those coordinates. Reports use your current location and show it publicly. We do not track you in the background. Keep faces, license plates and private spaces out of photos.',
      ] },
      retention: { paragraphs: [
        'Game data and photos remain stored until we delete them. There is no automatic deletion schedule.',
      ] },
      choices: { paragraphs: [
        'To request removal, email us with your nickname and neighborhood or a link to the report. Clearing your browser data does not delete information stored by StreetCreds.',
      ] },
      children: { paragraphs: [
        'StreetCreds is not intended for children under 13. Contact us if you believe a child has provided personal information.',
      ] },
      changes: { paragraphs: [
        'Updates to this policy will appear here with a revised date.',
      ] },
    },
  },
  terms: {
    intro: `By joining StreetCreds, you agree to these terms. The game is operated by ${legalDetails.operator}.`,
    sections: {
      project: { paragraphs: [
        'StreetCreds is an experimental civic game built for sunhacks 2026. Features may change, become unavailable or be discontinued.',
      ] },
      city: { paragraphs: [
        'StreetCreds is independent of the City of Tempe. Submitting a report does not notify the city or request a repair. To request a repair, use the city’s own service request form. StreetCreds can open that form with your report’s details ready to paste, and you submit it there yourself. For emergencies, call 911.',
      ] },
      points: { paragraphs: [
        'CIVIC points are game rewards recorded on Solana devnet, a test network. They have no cash value and cannot be exchanged for money. Demo deals do not guarantee a real offer or discount. Points and transaction records may be reset.',
      ] },
      conduct: { paragraphs: [
        'Report only from places you can safely and lawfully access. Submit your own photos and keep people, license plates and private spaces out of frame.',
        'Do not submit false reports, harmful or illegal content, spam or automated activity. Do not use offensive nicknames or impersonate others. We may remove content or reset points for misuse.',
      ] },
      permission: { paragraphs: [
        'You retain ownership of your photos. Submitting a photo gives us permission to store it and display or share it with your report. Only upload photos you have the right to share.',
      ] },
      ai: { paragraphs: [
        'Automated photo descriptions and map records may be inaccurate or outdated. Review your report before submitting it. Information in the game does not establish whether a location is safe.',
      ] },
      liability: { paragraphs: [
        'You are responsible for your actions and safety. The game is provided as available, without warranties. To the extent permitted by law, the team is not liable for harm or losses arising from its use, errors, lost data or interruptions. Your rights under applicable law remain unaffected.',
      ] },
      law: { paragraphs: [
        'Arizona law governs these terms, except where applicable law requires otherwise.',
      ] },
    },
  },
  about: {
    intro: 'StreetCreds is a neighborhood game for Tempe. Report street problems, earn points and follow your neighborhood on the leaderboard. Play in your browser with a nickname and neighborhood.',
    sections: {
      project: { paragraphs: [
        'Built by Sarah and Pierre at sunhacks 2026. StreetCreds is an independent project and is not affiliated with the City of Tempe. Reports are not sent to the city. You can pass one on yourself with “Send to Tempe 311”, which opens the city’s own form.',
      ] },
      services: { paragraphs: [
        'Map tiles: © OpenStreetMap contributors. City records: City of Tempe open data. Photo descriptions: Google Gemini. Game points: Solana devnet.',
      ], references: ['openStreetMap', 'gemini', 'solana'] },
      credits: { paragraphs: [
        'Development assistance: Claude, Cursor and Codex. Typeface: Outfit, under the SIL Open Font License. Full credits are in the project README.',
      ] },
    },
  },
} as const satisfies LegalContent
