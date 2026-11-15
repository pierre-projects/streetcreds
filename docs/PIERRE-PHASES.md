# Pierre's phases: players, points and boards

Pierre owns **joining, the points wallet, the leaderboard, the map, the app shell and the infrastructure**. This file is his checklist and his prompts, phase by phase.

- **His folders:** `web/src/features/players/`, `web/src/app/`, `api/src/players/`, `api/src/points/`, `api/template.yaml`, `amplify.yml`
- **Also his, the scaffold:** package and config files in `web/` and `api/`, `web/src/main.tsx`, `api/src/local.ts`, and the scripts `solana-setup.ts`, `mint-test.ts` and `seed.ts` in `api/scripts/`
- **Shared with Sarah:** `api/src/index.ts` and `api/src/lib/`. He creates them in Phase 0. After that he only adds the line that mounts his own routes; anything else needs her yes
- **Hands-off without a yes from Sarah:** `shared/`, Sarah's folders (`web/src/features/quests/`, `api/src/quests/`) and her two scripts in `api/scripts/`
- **Where he meets Sarah:** she calls his `awardPoints` (ship the stub first) and his rate-limit helper; her screens use the client functions and fixtures in his `app/api.ts` and `app/mock/` (he writes them for all ten routes); and his map reads her `GET /reports` (use mock data until it's live)
- **Shared checkpoints and timing:** [PHASES.md](PHASES.md). Sarah's list: [SARAH-PHASES.md](SARAH-PHASES.md)

## How to use this file

1. Start a **new agent chat for each phase**. Paste the session opener, read the agent's summary, correct it if needed.
2. Paste that phase's prompt. If the phase is big, send it one checklist item at a time.
3. Test on your phone, then paste the wrap-up prompt.
4. Tick the boxes here yourself and commit the file (ticking boxes may go straight to `main`, see [CONTRIBUTING.md](CONTRIBUTING.md)).

Do not start a phase until the checkpoint before it passes on a real phone. The agent prints deploy and Solana commands; **you** run them.

## Session opener (paste first in every new chat)

```text
I'm Pierre, working on StreetCreds. Read AGENTS.md, docs/TECHNICAL.md, docs/CONTRIBUTING.md and docs/PIERRE-PHASES.md in full before doing anything.

I own players, points and boards: web/src/features/players/, web/src/app/, api/src/players/, api/src/points/, api/template.yaml and amplify.yml. I also own the scaffold: package and config files in web/ and api/, web/src/main.tsx, api/src/local.ts, and the scripts solana-setup.ts, mint-test.ts and seed.ts in api/scripts/. Work only in those. api/src/index.ts and api/src/lib/ are shared: create them in Phase 0, and after that only add the line that mounts my own routes. Do not change shared/ or Sarah's folders (web/src/features/quests/, api/src/quests/). If a task needs a change there, describe the change and stop.

Reply with: (1) a five-line summary of what StreetCreds is and what I own, (2) the routes and functions I am responsible for, (3) anything in the docs that looks unclear or contradictory. Do not write code yet.
```

## Phase 0. Setup (with Sarah, first 30 to 45 minutes)

- [x] Read `shared/` with Sarah once. It is the fixed contract.
- [x] Install Node.js 24, the AWS CLI and the AWS SAM CLI. Sign in with `aws login --region us-east-2`, then save the region with `aws configure set region us-east-2`.
- [x] Scaffold `web/` and `api/` with the exact install commands in [TECHNICAL.md](TECHNICAL.md) section 9, step 1. This includes `api/src/index.ts` and `api/src/lib/`.
- [x] Deploy template written in full: the API, the three DynamoDB tables and the S3 bucket.
- [x] First deploy with Solana off, so the API URL, the tables and the bucket exist. Save the answers in `samconfig.toml` (git-ignored).
- [x] Connect Amplify hosting to the repo, app root `web`, and set `VITE_API_URL`.
- [x] Add the Amplify URL to the allowed origins and redeploy.
- [x] Start the `streetcreds.app` custom domain in Amplify. DNS can take hours.
- [x] Send Sarah the API URL and bucket name for her `.env`.

Prompt:

```text
Do Pierre's Phase 0 from docs/PIERRE-PHASES.md, following docs/TECHNICAL.md sections 2, 3, 8 and 9.

Scaffold web/ and api/ with the exact install commands in section 9 step 1 (@solana/web3.js must be version 1). Add the npm scripts listed in AGENTS.md, the tsconfig and vite settings that let both packages import shared/, .env.example files, and amplify.yml.

In api/, create src/index.ts (the Hono app: GET /health, the error handler, and the mounted player routes), src/local.ts, src/lib/env.ts, src/lib/db.ts and src/lib/errors.ts. Create src/players/routes.ts with a GET /leaderboard that returns the four neighborhoods with zero points for now. Write api/template.yaml in full from section 8, including the three tables and the photo bucket, so the first deploy creates everything.

Do not run sam deploy or anything else that creates cloud resources: print each command and wait for me. Stop when the scaffold type-checks and both dev servers start.
```

**Checkpoint (both):** the live URL opens on a phone and `GET /leaderboard` returns four neighborhoods with zero points.

## Phase 1. Skeleton (about 20% of the time)

- [x] **Solana first, 90-minute limit.** `solana-setup.ts` creates the treasury and the CIVIC token.
- [x] `mintPoints` written. One test mint sent with `mint-test.ts` and opened on the explorer. If not working at 90 minutes: switch to shared-wallet mode, or leave Solana off, and move on.
- [x] App shell: routing for all eight paths (placeholders for Sarah's three screens), layout with header and bottom navigation, the strings file.
- [x] API helper with a typed function and a mock fixture for all ten routes, Sarah's six included. Tell Sarah when it's merged: her report screen needs it.
- [x] `POST /players`, `GET /players/:id` and `GET /leaderboard` work against the real table.
- [x] Join screen and home screen work on a phone.
- [x] `awardPoints` stub (database only) merged. Sarah is told it's ready.
- [x] `npm run check` passes in `api/` and `web/`.

Prompt:

```text
Do Pierre's Phase 1 from docs/PIERRE-PHASES.md, following docs/TECHNICAL.md sections 5, 6, 8 and 9. Go in this order and stop after each numbered step so I can check it.

1. Write api/scripts/solana-setup.ts as described in section 9, step 6, then mintPoints in api/src/points/solana.ts (section 6), then api/scripts/mint-test.ts, which calls mintPoints for a throwaway address as many times as its count argument says (default 1), prints each explorer link and reports how many succeeded. Do not run either script, request an airdrop or send anything to devnet yourself: print the commands and wait for me.
2. Build the app shell: routing for all eight paths with a placeholder screen for /report, /council and /council/:itemId, the layout, app/player.ts and app/strings.ts. In app/api.ts write one typed function per route for all ten routes, Sarah's six included, with mock mode and one fixture per route in app/mock/.
3. Build POST /players, GET /players/:id and GET /leaderboard against the real table, with aggregateLeaderboard as a tested pure function.
4. Build the join and home screens.
5. Build the awardPoints stub (SOLANA_MODE=off: write the award once, add the points). Sarah depends on this, so keep its signature exactly as documented.

Install @solana/web3.js@1, never version 3. Type-check as you go.
```

**Checkpoint (both):** a player can join from a phone and appears in the database.

## Phase 2. Core loop (about 30%)

- [ ] Each new player gets a wallet address on join.
- [ ] Real `awardPoints`: the award is written once, points are added, the mint goes to devnet, the transaction link is saved.
- [ ] Points still count when devnet is slow or down; the award stays "pending".
- [ ] Shared-wallet mode works as the fallback.
- [ ] Signature and return shape of `awardPoints` unchanged from the stub.
- [ ] Leaderboard screen: four neighborhoods, top 3 players each, refreshing every 4 seconds, my neighborhood highlighted.
- [ ] Deployed, and the midpoint checkpoint tested on a phone with Sarah.
- [ ] `npm run check` passes.

Prompt:

```text
Do Pierre's Phase 2 from docs/PIERRE-PHASES.md.

1. Give each new player a wallet address on join when SOLANA_MODE is per-player.
2. Replace the awardPoints stub with the real one from docs/TECHNICAL.md section 6: conditional write of the award, atomic add of points, mint on devnet with a 10-second limit, then save the signature. It must never throw because of Solana: points still count and the award stays pending.
3. Also support SOLANA_MODE=shared as the fallback.
4. Build the leaderboard screen: four neighborhoods, top 3 players each, refresh every 4 seconds, my neighborhood highlighted.

Do not change the awardPoints signature or return shape. Stop when done and give me a phone test for acceptance checks F3 and F4.
```

**Checkpoint (both), the cut line:** photo, to label, to points, to leaderboard works on a phone. If it doesn't, fix it together and skip to Phase 4 after the map.

## Phase 3. Map (about 20%)

- [ ] Map screen shows a pin for every open report, sized by count and colored by severity.
- [ ] Pin popup shows the photo and details.
- [ ] "Copy city report" puts category, description, location and photo link on the clipboard.
- [ ] Rate-limit helper `checkReportLimit` written and tested in `api/src/players/rateLimit.ts`; Sarah has added it to her route.
- [ ] 10 test mints in a row all arrive (`mint-test.ts 10`).
- [ ] One-slide architecture diagram drafted.
- [ ] `npm run check` passes.

Prompt:

```text
Do Pierre's Phase 3 from docs/PIERRE-PHASES.md.

1. Build the map screen from docs/TECHNICAL.md section 7: react-leaflet, OpenStreetMap tiles with attribution, one circle marker per open report sized by count and colored by severity, a popup with the photo and details.
2. Build buildCityReport as a tested pure function and wire the "Copy city report" button.
3. Add the rate limit of 5 reports per player per hour. The check belongs in Sarah's POST /reports route, so write the pure helper checkReportLimit and its tests in api/src/players/rateLimit.ts, as docs/TECHNICAL.md section 6 defines it, and describe the lines she needs to add. Do not edit her files.
4. Check that api/scripts/mint-test.ts reports how many of its mints reached devnet, then print the command that sends 10 in a row and wait for me to run it.

Build the map against mock data if GET /reports is not live yet. Stop when done and tell me how to test acceptance check F6.
```

**Checkpoint (both):** both quests work and the map shows pins.

## Phase 4. Polish (about 15%)

- [ ] Join, home, leaderboard and map each have a loading state and a plain-language error state.
- [ ] Layout checked on a small phone and a large phone, with no sideways scrolling.
- [ ] Sarah's features tested (report quest, council quest), with a list of what broke sent to her.
- [ ] Everything Sarah found in my features is fixed.
- [ ] Backup video of the full flow recorded.
- [ ] With Sarah: 15 to 20 real reports submitted around campus.

Prompt:

```text
Do my Phase 4 from docs/PIERRE-PHASES.md. For every screen and route I own: add a loading state and a plain-language error state, check the layout at 375 px and 430 px wide with no horizontal scroll, and make every tap target at least 44 px tall. Do not add features. List each change you made, one line each.
```

**Checkpoint (both):** feature freeze. Bug fixes only from here.

## Phase 5. Submit (last 15%)

- [ ] README Status table updated.
- [ ] README Credits complete: every tutorial and AI tool used (required by the rules).
- [ ] Architecture slide finished.
- [ ] Repo made public. Then turn on branch protection for `main` if there's time.
- [ ] QR code displayed large, pointing at the address that is actually live.
- [ ] Final commit tagged `submission`.
- [ ] Demo rehearsed twice with a timer. Pierre runs the phone and handles anything that breaks.
- [ ] Nothing committed after the deadline.

## Prompts for any phase

When something breaks:

```text
This is broken. What I did: <steps>. What I expected: <result>. What happened: <result>. Exact error:

<paste the full error>

Find the cause before changing anything. Explain it in two sentences, then fix only that. Check the troubleshooting table in docs/TECHNICAL.md section 9 first.
```

Wrap-up, at the end of every phase:

```text
Wrap up this phase. Run npm run check in every package you touched and fix failures. Then tell me: (1) what you built, file by file, (2) which docs/PIERRE-PHASES.md boxes are done and which are not, (3) which acceptance checks in docs/TECHNICAL.md section 13 I should now test on my phone and how, (4) anything you assumed or skipped, (5) one line to add to the README Credits section if you followed a tutorial. Do not commit or push.
```

## If you finish early

Only after Phase 4 passes, one at a time, and only when you both agree: spending points at pretend shops (needs a design decision first), the Spanish toggle (with Sarah).
