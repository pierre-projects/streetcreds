import type { strings } from '../strings'

export const legalDetails = {
  operator: 'the StreetCreds team',
  contactEmail: 'contact@streetcreds.app',
  effectiveDate: '2026-11-14',
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
// Evidence: player.ts; players/routes.ts; points/solana.ts; ReportsMap.tsx; App.tsx;
// api/src/index.ts; api/template.yaml; docs/TECHNICAL.md sections 4–7; README Credits.
// Report endpoints/screens are absent in this checkout. Do not turn the documented
// report design into a claim that uploads or location collection work today.
export const legalContent = {
  privacy: {
    intro: `StreetCreds is operated by ${legalDetails.operator}. This policy explains what happens to your information. Report and council quests are still being built in this version.`,
    sections: {
      stored: { paragraphs: [
        'When you join, we store your nickname, neighborhood, a random player ID, points and joining time. Player records include recent report times. Award records, when created, hold points and transaction status.',
        'Report records can include your player ID, photo, report location, category, severity, description and timestamps. You cannot submit a photo in this version.',
        'If your player has a devnet wallet, we store its public address. Its secret key is discarded when the address is created: neither you nor the team keeps that key. The team holds a separate treasury key to issue points.',
      ] },
      device: { paragraphs: [
        'Your browser keeps your player ID in localStorage under streetcreds.playerId. The game uses no cookies, analytics, tracking or ads. Joining needs no email, account or login.',
      ] },
      public: { paragraphs: [
        'Top players’ nicknames and points appear on the leaderboard. Anyone can view the live board without joining. When open reports are available, their photos, locations and descriptions appear on its map. The separate Map screen requires joining. These reports are not private.',
        'Your ID is not a password. Someone who knows it can retrieve your player record.',
      ] },
      services: { paragraphs: [
        'AWS provides hosting, database and photo storage. Request logs record paths, status, timing and sometimes player IDs. AWS receives your IP address when you connect; whether IP addresses are saved in access logs depends on hosting settings.',
        'OpenStreetMap tile servers receive your IP address and map requests when the map loads. Fonts and other bundled assets are served by this site, not an external font service.',
        'Google Gemini is the specified photo-labeling service. The current screens do not upload photos or send them to Gemini.',
        'Awards sent to Solana devnet are public. We cannot delete those transactions; others may keep copies. Devnet itself can reset. A transaction contains a wallet address, or a player ID in shared-wallet mode.',
      ] },
      photos: { paragraphs: [
        'Do not photograph faces, license plates or the inside of homes. This version does not request your device location or track you in the background. A report’s displayed location identifies the problem.',
      ] },
      retention: { paragraphs: [
        'Photos and reports have no automatic expiry configured. They remain stored until manually deleted. An expiring photo link does not delete the photo.',
      ] },
      choices: { paragraphs: [
        'To request removal of a nickname, report or photo, email the contact address below with your nickname and neighborhood. For a photo, include its location or a report link. Removal requests are handled by hand; there is no in-app delete button. Do not send identity documents.',
        'Clearing this site’s browser data removes your saved ID, not server records or public transactions.',
      ] },
      children: { paragraphs: [
        'StreetCreds is not directed at children under 13. We do not knowingly collect their data. Contact us if you believe a child has provided information.',
      ] },
      changes: { paragraphs: [
        'We will post policy changes here and update the date above. Email us with privacy questions.',
      ] },
    },
  },
  terms: {
    intro: `By joining StreetCreds, you agree to these terms with ${legalDetails.operator}.`,
    sections: {
      project: { paragraphs: [
        'StreetCreds is a sunhacks 2026 hackathon project. You use it as is, without a warranty. Features may change or go offline at any time. Report and council quests are still being built in this version.',
      ] },
      city: { paragraphs: [
        'StreetCreds is not an official city service. A report here is NOT sent to the City of Tempe. Use the city’s own reporting channels to request a fix. “Copy city report” only copies text for you to send yourself.',
        'Never use StreetCreds for emergencies. Call 911.',
      ] },
      points: { paragraphs: [
        'Points are game scores. CIVIC tokens use Solana devnet only, a test network. Points and tokens have no monetary value. You may not sell, exchange or redeem them. They may be reset at any time.',
      ] },
      conduct: { paragraphs: [
        'Only submit photos of street problems that you took yourself, safely and from public space. Do not make people the subject. Do not include faces, license plates or the inside of homes.',
        'Do not post anything illegal, hateful or sexual. Do not make false reports, spam the game or use automation. Choose a nickname that is not offensive and is not someone else’s name.',
      ] },
      permission: { paragraphs: [
        'You keep ownership of your photos. By submitting one, you give the team permission to store, display and share it as part of the game, including a photo link in “Copy city report” text.',
        'We may remove any report or nickname and reset points without notice.',
      ] },
      ai: { paragraphs: [
        'AI-generated categories, severities and descriptions can be wrong. Check report details yourself. Do not rely on a label to decide whether a place is safe.',
      ] },
      liability: { paragraphs: [
        'You are responsible for your actions and safety. To the extent the law allows, the team is not liable for losses or harm from using the game, inaccurate information, lost data or service interruptions. Nothing here takes away rights that the law does not let you waive.',
      ] },
      law: { paragraphs: [
        'Arizona law governs these terms, except where another law must apply. Contact us at the email below with questions.',
      ] },
    },
  },
  about: {
    intro: 'StreetCreds is a phone-first civic game made by Sarah and Pierre for sunhacks 2026. It brings neighborhood scores and a public street-problem board together. Report and council quests are still being built in this version.',
    sections: {
      contact: { paragraphs: [
        `You can reach ${legalDetails.operator} at ${legalDetails.contactEmail} for questions, privacy requests or photo removal.`,
        'For removal, include your nickname and neighborhood, plus the report location or a report link so we can find it. If you did not submit the photo, just tell us which photo concerns you. Requests are handled by hand; please do not send identity documents.',
        'StreetCreds does not send reports to the city. Use the City of Tempe’s own channels to request a fix. For an emergency, call 911.',
      ] },
      services: { paragraphs: [
        'Map data © OpenStreetMap contributors, displayed with Leaflet and react-leaflet. Google Gemini is the photo-labeling service specified for the report quest, which is not enabled in this version. Token support uses Solana devnet, a test network.',
      ], references: ['openStreetMap', 'gemini', 'solana'] },
      credits: { paragraphs: [
        'Claude and Claude Code (Anthropic) helped draft the planning documents, shared contract, README, scaffold, AWS setup, Solana scripts, API, app shell and player screens. The web scaffold started from the create-vite React TypeScript template.',
        'Codex (OpenAI) helped create the temporary design system from the StreetCreds landing page, and these legal pages and links.',
        'Outfit is by Rodrigo Fuenzalida / Smartsheet Inc (The Outfit Project Authors), used under the SIL Open Font License.',
      ] },
    },
  },
} as const satisfies LegalContent
