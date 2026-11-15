# StreetCreds

Earn points for making your neighborhood better.

StreetCreds turns city participation into a phone game. Players earn points for small civic actions, and their neighborhood climbs a live leaderboard:

- **Report quest:** photograph a street problem (a pothole, a broken streetlight, graffiti, a blocked sidewalk). Gemini labels it, and the report lands on a shared map.
- **Council quest:** read a three-sentence summary of a real Tempe City Council agenda item and answer one question.

Every point is minted as a token on Solana devnet, so each award has its own explorer link. Nothing to install and no login: scan a QR code, pick a nickname and a neighborhood, and play.

Built at [sunhacks 2026](https://sunhacks-2026.devpost.com/) at Arizona State University. The site is live at [streetcreds.app](https://streetcreds.app).

## Status

In progress during the hackathon. So far a player can join with a nickname and a neighborhood, see their points, watch the neighborhood leaderboard update, and open the map of reports. The two quests are still to build.

| Part | State |
| --- | --- |
| Product plan, technical spec, agent rules | Done |
| Shared contract (`shared/`): constants, data types, API types | Done |
| API (`api/`) | Joining, loading a player and the leaderboard work against the database. `awardPoints` exists as a database-only stand-in. Quest routes are not built |
| Web app (`web/`) | App shell, join screen, home screen, the live leaderboard and the map with "Copy city report". On a big screen, a live board at `/board` shows the map, the standings and every open report. The two quest screens are placeholders |
| Solana points | Each new player gets a devnet address, and every award is minted as a CIVIC token with a link to the transaction. If devnet is slow the points still count and the award is marked pending |

## Documentation

| File | What's in it | Read it when |
| --- | --- | --- |
| [PRD.md](docs/PRD.md) | The product: scope and priorities, user flow, feature checklists, team roles, build plan, demo script, risks | You want to know what we're building and why |
| [PHASES.md](docs/PHASES.md) | The phases at a glance and the checkpoints you both test together | You want the shared timeline |
| [SARAH-PHASES.md](docs/SARAH-PHASES.md) | Sarah's checklist and agent prompts for every phase | You are Sarah and want to know what to do next |
| [SARAH-SETUP.md](docs/SARAH-SETUP.md) | Setup guide for Sarah: how the pieces fit, signing in to AWS, running the app locally, common errors | You are Sarah and setting up your laptop |
| [PIERRE-PHASES.md](docs/PIERRE-PHASES.md) | Pierre's checklist and agent prompts for every phase | You are Pierre and want to know what to do next |
| [TECHNICAL.md](docs/TECHNICAL.md) | The implementation spec: stack and versions, data models, API contract, core functions, setup, development guide, build order | You're writing code |
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
  docs/         PRD, TECHNICAL, CONTRIBUTING, PHASES, SARAH-PHASES, PIERRE-PHASES
  shared/       the contract both sides import: constants, data types, API types
  api/          the backend (planned)
  web/          the phone web app (planned)
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
- Map tiles are from OpenStreetMap contributors, shown with Leaflet and react-leaflet.
- The accessibility records and helpful places on the map are public City of Tempe data: the ADA Transition Plan survey, the "bus stops without a shelter" layer, and the drinking fountain, park restroom and community food site layers, from the City's open data services (`gis.tempe.gov` and the TempeData ArcGIS Online organization).
- The City records script (`api/scripts/city-records.ts`, `api/scripts/lib/`) and the City records layer on the map (`web/src/features/players/cityRecords.ts`, `cityText.ts`, `CityRecordsLayer.tsx`, `CityLayerToggles.tsx`) were generated with Claude Code (Anthropic). The page checks follow an earlier project of Pierre's, Patchnote.

- Local Deals (curated partners, proximity unlock, redeem) and the minimum report quest path were generated with Cursor Agent / Composer.
- The report quest API (`api/src/quests/`: upload URL, Gemini `labelPhoto`, create/submit/list reports, `label-photos.ts`) was completed with Cursor Agent / Composer.
- The temporary design system (`web/src/app/ui/`, `/design`) was generated with Codex (OpenAI), following the StreetCreds landing page.
- The soft glass radar HUD redesign (tokens, Outfit self-host, floating frost chrome, map-first home) was implemented with Cursor (Composer).
- Outfit by Rodrigo Fuenzalida / Smartsheet Inc (The Outfit Project Authors), under the SIL Open Font License (see `web/public/fonts/OFL.txt`).

- The Privacy, Terms, About & contact pages and their navigation links were drafted and implemented with Codex (OpenAI).
- The About, Privacy and Terms copy was revised with Codex (OpenAI) for clarity and current app behavior.

## License

No license chosen yet.
