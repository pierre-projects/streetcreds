# StreetCreds: phases for Sarah and Pierre

Each person's work, phase by phase, as a checklist. Tick items off as you finish them. The details behind every item (routes, fields, functions) are in [TECHNICAL.md](TECHNICAL.md).

## How to use this file

- Work down your own list. Do not start a phase until the checkpoint before it passes on a real phone.
- The two lists meet in only two places: Sarah calls Pierre's `awardPoints`, and Pierre's map reads Sarah's `GET /reports`. Both have a stand-in so nobody waits.
- The time shares are of whatever hacking time is left. Write real clock times next to each phase once you know the submission deadline.

## Checkpoints (both, on one phone)

| After | Checkpoint | If it fails |
| --- | --- | --- |
| Phase 0 | The live URL opens on a phone, and `GET /leaderboard` returns four neighborhoods with zero points | Fix before anything else |
| Phase 1 | A player can join from a phone and appears in the database | Fix before Phase 2 |
| Phase 2 | **The cut line.** Photo, to label, to points, to leaderboard works on a phone | Both fix it together. Drop the council quest and go straight to polish |
| Phase 3 | Both quests work and the map shows pins | Cut whatever is unfinished |
| Phase 4 | Feature freeze. Bug fixes only from here | |
| Phase 5 | Submitted on Devpost, demo rehearsed twice | |

## Phase 0. Setup (together, first 30 to 45 minutes)

- [ ] Both: clone the repo and read `shared/` together once. It is the fixed contract.
- [ ] Both: install Node.js 24 and the AWS CLI, and run `aws configure` for `us-west-2`.
- [ ] Sarah: get a Gemini API key from Google AI Studio and share it with Pierre privately (not in the repo, not in chat that others can see).
- [ ] Pierre: scaffold `web/` and `api/` (TECHNICAL.md section 9, step 1).
- [ ] Pierre: first deploy with Solana off, so the API URL exists.
- [ ] Pierre: connect Amplify hosting, then start the `streetcreds.app` custom domain. DNS can take hours.
- [ ] Both: create `api/.env` and `web/.env` from the examples.

## Sarah's phases: quests

Sarah owns the report quest and the council quest, from the screen down to the database. Her folders are `web/src/features/quests/` and `api/src/quests/`.

### Phase 1. Skeleton (about 20% of the time)

- [ ] `GET /upload-url`: returns a presigned S3 upload link and the photo key.
- [ ] `labelPhoto` working as a script: send a photo to Gemini, get category, severity and description back as JSON.
- [ ] Collect 10 test photos (real potholes, a streetlight, graffiti, plus two that are not street problems). Tune the prompt until all 10 are labeled correctly.
- [ ] Report screen built against mock data: capture button, labeling state, confirm step, reward card.

### Phase 2. Core loop (about 30%)

- [ ] Camera capture on the phone, resize to 1280 px, upload to S3.
- [ ] `POST /reports`: label the photo and save a draft. Handle "not a street problem" and Gemini failures with a clear message.
- [ ] `POST /reports/:id/submit`: publish the report and call `awardPoints` (Pierre's stub at first, the real one when it lands).
- [ ] Confirm screen: photo, description, category picker. Location, with the map picker as the fallback when location is denied.
- [ ] Reward card: points earned, new total, explorer link or "On-chain confirmation pending".
- [ ] `GET /reports`: open reports with photo links, for Pierre's map.

### Phase 3. Council quest (about 20%)

- [ ] Pick 3 real items from a current Tempe City Council agenda.
- [ ] Draft the summaries and questions with `generate-council.ts`, then check each one against the official agenda by hand. Save them in `council.json` with the source link.
- [ ] `GET /quests/council` and `POST /quests/council/answer`, with one award per player per item.
- [ ] Council list screen and council item screen.

### Phase 4. Polish (about 15%)

- [ ] Loading and error states on every quest screen, on a small phone and a large phone.
- [ ] Test Pierre's features (join, leaderboard, map) and list what broke.
- [ ] With Pierre: walk the campus and submit 15 to 20 real reports.

### Phase 5. Submit (last 15%)

- [ ] Devpost page: write-up, screenshots, prize categories, each sponsor technology named.
- [ ] Rehearse the demo twice with a timer. Sarah does the talking.

## Pierre's phases: players, points and boards

Pierre owns joining, the points wallet, the leaderboard, the map, the app shell and the infrastructure. His folders are `web/src/features/players/`, `web/src/app/`, `api/src/players/` and `api/src/points/`.

### Phase 1. Skeleton (about 20% of the time)

- [ ] Solana first, with a 90-minute limit: run `solana-setup.ts` to create the treasury and the CIVIC token, then send one test award and open it on the explorer. If it is not working at 90 minutes, switch to the shared-wallet fallback, or leave Solana off and move on.
- [ ] App shell: routing, layout with header and bottom navigation, the API helper, mock mode.
- [ ] DynamoDB tables in the deploy template.
- [ ] `POST /players`, `GET /players/:id` and `GET /leaderboard`.
- [ ] Join screen and home screen.
- [ ] `awardPoints` stub (database only) so Sarah is never blocked on Solana. Tell her when it is merged.

### Phase 2. Core loop (about 30%)

- [ ] Wallet address for each player on join.
- [ ] Real `awardPoints`: write the award once, add the points, mint on devnet, save the transaction link. Points must still count when devnet is slow.
- [ ] Leaderboard screen: four neighborhoods, top 3 players each, refreshing every 4 seconds, the player's own neighborhood highlighted.
- [ ] Redeploy and confirm the midpoint checkpoint on a phone with Sarah.

### Phase 3. Map (about 20%)

- [ ] Map screen with a pin for every open report, built against mock data until `GET /reports` is live.
- [ ] "Copy city report" button on each pin.
- [ ] Rate limit: 5 reports per player per hour.
- [ ] Stress check: 10 awards in a row all arrive.
- [ ] Draft the one-slide architecture diagram.

### Phase 4. Polish (about 15%)

- [ ] Loading and error states on join, home, leaderboard and map, on a small phone and a large phone.
- [ ] Test Sarah's features (report quest, council quest) and list what broke.
- [ ] Record a backup video of the full flow.
- [ ] With Sarah: walk the campus and submit 15 to 20 real reports.

### Phase 5. Submit (last 15%)

- [ ] README: update the Status table and the Credits section (tutorials and AI tools, required by the rules).
- [ ] Finish the architecture slide. Make sure the repo is public.
- [ ] Display the QR code large, pointing at the address that is actually live.
- [ ] Rehearse the demo twice with a timer. Pierre runs the phone and handles anything that breaks.

## If you finish early

Stretch items are built only after Phase 4 passes, one at a time, and only when you both agree: duplicate merge (Sarah), Spanish toggle (both), budget quest (Sarah), spending points at pretend shops (Pierre; needs a design decision first).
