# StreetCreds

Earn points for making your neighborhood better.

StreetCreds turns city participation into a phone game. Players earn points for small civic actions, and their neighborhood climbs a live leaderboard:

- **Report quest:** photograph a street problem (a pothole, a broken streetlight, graffiti, a blocked sidewalk). Gemini labels it, and the report lands on a shared map.
- **Council quest:** read a three-sentence summary of a real Tempe City Council agenda item and answer one question.

Every point is minted as a token on Solana devnet, so each award has its own explorer link. Nothing to install and no login: scan a QR code, pick a nickname and a neighborhood, and play.

Built at [sunhacks 2026](https://sunhacks-2026.devpost.com/) at Arizona State University. The site is live at [streetcreds.app](https://streetcreds.app).

## Status

Playable end to end. A player joins with a nickname and a neighborhood (Google sign-in is optional), reports a street problem or answers a council question, and watches the points land in their wallet and on the neighborhood leaderboard.

| Part | State |
| --- | --- |
| Product plan, technical spec, agent rules | Done |
| Shared contract (`shared/`): constants, data types, API types | Done |
| Report quest | Photo goes straight to S3, Gemini labels it, and the report lands on the map. Any report can be sent on to the City's 311 form |
| Council quest | Plain-language summaries of real Tempe City Council items, drafted with Gemini, with one question each |
| Players and boards | Joining inside the City of Tempe, the live leaderboard, the map with public City records, a big-screen board at `/board`, the profile screen and a share card |
| Local Deals | Spend points at partner places near you |
| Solana points | Each player gets a devnet address, and every award is minted as a CIVIC token with a link to the transaction. If devnet is slow the points still count and the award is marked pending |
| Not built | English and Spanish, duplicate detection, streaks |

Which sunhacks prizes we enter, and why, is in [TRACKS.md](docs/TRACKS.md).

## Documentation

| File | What's in it | Read it when |
| --- | --- | --- |
| [PRD.md](docs/PRD.md) | The product: scope and priorities, user flow, feature checklists, team roles, build plan, demo script, risks | You want to know what we're building and why |
| [PHASES.md](docs/PHASES.md) | The phases at a glance and the checkpoints you both test together | You want the shared timeline |
| [SARAH-PHASES.md](docs/SARAH-PHASES.md) | Sarah's checklist and agent prompts for every phase | You are Sarah and want to know what to do next |
| [SARAH-SETUP.md](docs/SARAH-SETUP.md) | Setup guide for Sarah: how the pieces fit, signing in to AWS, running the app locally, common errors | You are Sarah and setting up your laptop |
| [PIERRE-PHASES.md](docs/PIERRE-PHASES.md) | Pierre's checklist and agent prompts for every phase | You are Pierre and want to know what to do next |
| [TECHNICAL.md](docs/TECHNICAL.md) | The implementation spec: stack and versions, data models, API contract, core functions, setup, development guide, build order | You're writing code |
| [TRACKS.md](docs/TRACKS.md) | The sunhacks prizes we enter, what earns each one, the ones we skip and the gaps not to claim | You're writing the Devpost submission or the demo |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | GitHub rules: branches, commits, pull requests, conflicts, secrets, the deadline | Before your first commit, and whenever Git gets confusing |
| [AGENTS.md](AGENTS.md) | Rules for AI coding agents: hard rules, who owns which folders, commands, definition of done | You point Cursor, Claude Code or another agent at this repo |

All project docs live in [`docs/`](docs/). Only this README and `AGENTS.md` stay at the root. Where the PRD and TECHNICAL.md differ on an implementation detail, TECHNICAL.md wins.

## How it's built

| Layer | Choice |
| --- | --- |
| Web app | React + Vite + TypeScript, hosted on AWS Amplify |
| API | One AWS Lambda running Hono, behind API Gateway, deployed with AWS SAM |
| Data | DynamoDB (players, reports, awards), S3 for photos |
| AI | Gemini API, model `gemini-3.8-flash`, for photo labeling and council summaries |
| Points | An SPL token on Solana devnet |
| Map | Leaflet with OpenStreetMap |

The phone uploads photos straight to S3 and sends everything else through the API. Only the Lambda talks to Gemini and Solana, so no key ever reaches the phone. Details are in [TECHNICAL.md](docs/TECHNICAL.md).

## Repo layout

```
streetcreds/
  README.md     start here
  AGENTS.md     rules for coding agents (agents look for it at the root)
  docs/         PRD, TECHNICAL, TRACKS, CONTRIBUTING and the phase checklists
  shared/       the contract both sides import: constants, data types, API types
  api/          the backend: one Lambda running Hono
  web/          the phone web app
```

`shared/` is fixed. Changes to it need both team members to agree first.

## Getting started

You need Node.js 24 and Git to run it locally. Deploying also needs the AWS CLI and the AWS SAM CLI, and the report quest needs a Gemini API key. The full guide is [TECHNICAL.md section 9, "Development guide"](docs/TECHNICAL.md#9-development-guide).

Run the API and the web app in two terminals:

```bash
cd api
npm install
cp .env.example .env
npm run dev
```

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

Then open http://localhost:5173. Before pushing, run `npm run check` in each package you changed.

Never commit keys. Secrets go in `api/.env` and `api/samconfig.toml`, which `.gitignore` already excludes.

## Team

| Person | Owns |
| --- | --- |
| Sarah | Quests: the report quest and the council quest, from screen to database |
| Pierre | Players, points and boards: joining, the Solana points wallet, leaderboard, map, the project scaffold, AWS setup and deploys |

## Working with a coding agent

Each person has one file with their checklist for every phase and a copy-paste prompt to give Cursor, Claude Code or another agent:

- **Sarah:** [SARAH-PHASES.md](docs/SARAH-PHASES.md)
- **Pierre:** [PIERRE-PHASES.md](docs/PIERRE-PHASES.md)

Start a new agent chat for each phase, paste the session opener from your file, then the phase prompt. Tick the boxes yourself as you finish. The shared checkpoints are in [PHASES.md](docs/PHASES.md).

## Credits

The sunhacks rules ask every project to credit the tutorials and AI tools it used. Add a line here whenever you follow a tutorial or generate a substantial part of the code.

- Planning documents, the shared contract in `shared/`, and this README were drafted with Claude (Anthropic).
- The project scaffold (`web/`, `api/`, `api/template.yaml`, `amplify.yml`) was generated with Claude Code (Anthropic). `web/` started from the `create-vite` `react-ts` template.
- The Solana setup script, `mintPoints` and the mint test (`api/scripts/`, `api/src/points/solana.ts`) were generated with Claude Code (Anthropic).
- The web app shell (`web/src/app/`: routing, layout, API client and mock mode) was generated with Claude Code (Anthropic).
- The player routes, the leaderboard, `awardPoints`, the rate-limit helper, the deploy-secrets script, the Solana address setting, the join, home, leaderboard and map screens and the big-screen live board were generated with Claude Code (Anthropic).
- Map tiles are the Esri World Dark Gray Canvas (Esri, HERE, Garmin, OpenStreetMap contributors), shown with Leaflet and react-leaflet.
- The accessibility records and helpful places on the map are public City of Tempe data: the ADA Transition Plan survey, the "bus stops without a shelter" layer, and the drinking fountain, park restroom and community food site layers, from the City's open data services (`gis.tempe.gov` and the TempeData ArcGIS Online organization).
- The City records script (`api/scripts/city-records.ts`, `api/scripts/lib/`) and the City records layer on the map (`web/src/features/players/cityRecords.ts`, `cityText.ts`, `CityRecordsLayer.tsx`, `CityLayerToggles.tsx`) were generated with Claude Code (Anthropic). The page checks follow an earlier project of Pierre's, Patchnote.

- Local Deals (curated partners, proximity unlock, redeem) and the minimum report quest path were generated with Cursor Agent / Composer.
- The report quest API (`api/src/quests/`: upload URL, Gemini `labelPhoto`, create/submit/list reports, `label-photos.ts`) was completed with Cursor Agent / Composer.
- The temporary design system (`web/src/app/ui/`, `/design`) was generated with Codex (OpenAI), following the StreetCreds landing page.
- The soft glass radar HUD redesign (tokens, Outfit self-host, floating frost chrome, map-first home) was implemented with Cursor (Composer).
- The dark game design (palette, Mayor Patch, Home, Join and quest screens, chips and quest buttons) was designed by Sarah with Claude (Anthropic) and implemented with Claude (Anthropic).

Russo One by Jovanny Lemonad and Inter by Rasmus Andersson, both under the SIL Open Font License, self-hosted in web/public/fonts/.

Outfit by Rodrigo Fuenzalida / Smartsheet Inc (The Outfit Project Authors), under the SIL Open Font License (see `web/public/fonts/OFL.txt`).
- The StreetCreds logo mark, wordmark, favicon and app icon in `web/public/brand/` and the favicon / apple-touch icons were taken from the StreetCreds_Logo_Pack asset set (white S on orange / wordmark masters), resized for the web app.

- The Privacy, Terms, About & contact pages and their navigation links were drafted and implemented with Codex (OpenAI).
- The About, Privacy and Terms copy was revised with Codex (OpenAI) for clarity and current app behavior.
- Location-based joining and report submission, their shared validation, and the accompanying tests and notes were implemented with Codex (OpenAI). City membership uses the City of Tempe's public City Boundary layer: https://services.arcgis.com/lQySeXwbBg53XWDi/ArcGIS/rest/services/City_Boundary/FeatureServer/0.
- The location improvements (waiting for a precise reading, the looser accuracy limit for joining, the allowance for device clocks, and the bundled copy of the City boundary with `api/scripts/city-boundary.ts`) were written with Claude Code (Anthropic).
- The Home map fixes and the motion rules (`web/src/app/motion.ts`, the motion and "Reduce motion" sections of `web/src/index.css`) were written with Claude Code (Anthropic). The reduced-motion rules follow the `accessible-animation` skill from `iart-ai/web-animation-skills` (MIT).
- "Send to Tempe 311" (`web/src/features/players/tempe311.ts`, `CityHandoff.tsx`, `CityHandoffDialog.tsx`, and the reward-screen and map-popup wiring) was written with Claude Code (Anthropic). The links into the City of Tempe's service request form were worked out by reading that form's own page; nothing was submitted to it.
- Optional Google sign-in, the profile screen and the street cred share card (`api/src/players/auth.ts`, `authRoutes.ts`, `google.ts`, `sessions.ts`, `accounts.ts`, `playerReports.ts`, `web/src/app/google.ts`, `session.ts`, `web/src/features/players/ProfileScreen.tsx`, `GoogleSignInButton.tsx`, `web/src/features/quests/share/`, and their tests) were written with Claude Code (Anthropic). Sign-in follows Google's "Sign in with Google for Web" guide (https://developers.google.com/identity/gsi/web/guides/overview) and its ID token checks (https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
- The council quest (`api/scripts/generate-council.ts`, `api/src/quests/council.json`, `councilRoutes.ts`, and the council screens) was implemented with Cursor Agent / Composer. Agenda text is from the City of Tempe Agenda Online portal (Regular City Council Meeting, Nov 5, 2026).
- The live route check that runs after every deploy (`api/scripts/check-live.ts`, `api/scripts/lib/liveRoutes.ts`) was written with Claude Code (Anthropic).
- The prize tracks write-up (`docs/TRACKS.md`) and the updated README status were drafted with Claude Code (Anthropic), from the sunhacks 2026 Devpost prize list.

## License

No license chosen yet.
