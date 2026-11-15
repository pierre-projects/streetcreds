# StreetCreds PRD

Nov 14, 2026 · Pierre

## Overview

StreetCreds turns city participation into a game: residents earn points for small civic actions and their neighborhood climbs a weekly leaderboard.

- **Problem:** most people never report a pothole, read a council agenda or look at the city budget. It feels like homework and nothing comes back.
- **Solution:** a mobile web app with three quests. Snap a street problem, read a plain-language council summary and answer one question, or explore where tax dollars go. Each quest pays points into a wallet on Solana devnet.
- **Users:** Tempe and Phoenix residents, starting with ASU students. Second audience: city staff, who get cleaner, de-duplicated reports.
- **One-line pitch:** "Duolingo for your city: earn points for making your neighborhood better."
- **Built for:** sunhacks 2026. Everything here is scoped to what a small team can finish and demo during the event.

Team: two people. Web only, no native app. The site is planned to live at streetcreds.app.

**For coding agents:** the implementation spec is `docs/TECHNICAL.md` and the working rules are `AGENTS.md` at the root of the repo, next to the shared folder that holds the API and data contract as code. Where they differ from this PRD on an implementation detail, `TECHNICAL.md` wins.

## Goals and prize targets

The goal is a working demo where a judge scans a QR code, completes a quest and sees their points land in under two minutes.

| Prize | What the judges need to see | How StreetCreds earns it |
| --- | --- | --- |
| Best Gaming (main category) | A real game loop | Quests, points, streaks and a neighborhood leaderboard |
| Best Diversity/Equality | Wider access to civic life | Plain-language summaries, English and Spanish, reports from areas that are usually under-reported |
| [MLH] Best Use of Solana | Fast, cheap transactions that matter | Every point award is a devnet token transfer with an explorer link |
| [MLH] Best Use of Gemini API | AI doing real work | Photo labeling, duplicate detection, agenda summaries and quiz questions |
| Best Use of AWS | A named AWS architecture | S3, Lambda, API Gateway and Amplify, shown on one slide |
| Audience Vote | Something people can try | Anyone at the expo joins by QR code |

sunhacks judges score four things, so each one gets a deliberate answer:

- **Originality:** civic tech as a game with on-chain rewards, which 311 apps don't do.
- **Complexity:** three services working together (Gemini, AWS, Solana), learned this weekend.
- **Functionality:** one quest working end to end beats three half-working ones. See the cut line in Scope.
- **Design:** phone-first, one action per screen, points animate when they land.

## Scope

Build the report quest end to end first; everything else is added only once it works on a phone.

| Priority | Feature | Why |
| --- | --- | --- |
| P0 (must demo) | Join by QR code with a nickname and neighborhood, no login | Judges won't create accounts |
| P0 | Report quest: photo, location, Gemini label, points | The core loop and the Gemini story |
| P0 | Points wallet on Solana devnet with an explorer link | The Solana prize |
| P0 | Neighborhood leaderboard, live | The game |
| P0 | Hosted on AWS (Amplify, Lambda, API Gateway, S3) | The AWS prize |
| P1 (should have) | Council quest: one agenda item summarized, one quiz question | Shows it's more than a 311 app |
| P2 (stretch) | Duplicate merge for reports within about 30 meters | The benefit to the city |
| P1 | Map of all reports | Strong visual for the demo |
| P2 (stretch) | Budget quest: "your $100 in taxes" quiz | Third quest type |
| P2 | Spend points at pretend local shops (Local Deals) | Closes the rewards loop. Spec: `docs/PRD-LOCAL-DEALS.md` — curated partners, proximity unlock = cheaper CIVIC cost |
| P2 | Spanish toggle, streaks and badges | Diversity/Equality and polish |

**Cut:** real user accounts, mainnet or real money, actually filing reports with the city (the app prepares the report and the person files it), native apps, admin tools.

**Cut line:** with two people, P0 plus the map is a complete project. If the report quest isn't working end to end by the midpoint check, drop the council quest and spend the time on polish.

## User flow

A new player goes from QR code to points on the leaderboard in seven steps.

1. **Scan.** The player scans a QR code and the web app opens. Nothing to install.
2. **Join.** They type a nickname and pick a neighborhood (for the demo: Downtown Tempe, ASU Campus, North Tempe, South Tempe). The backend creates a player record and a devnet wallet for them.
3. **Home.** They see their points, their neighborhood's rank and three quest cards: Report, Council, Budget.
4. **Report quest.** They tap Report, take a photo and allow location. The photo uploads and Gemini returns a label (pothole, broken streetlight, graffiti, blocked sidewalk, other), a severity and a one-line description.
5. **Confirm.** They check the label, fix it if it's wrong, and submit. If a matching report already exists nearby, they see "You confirmed a report from 2 others" and still earn points.
6. **Reward.** Points animate into their wallet with a link to the devnet transaction. They can tap "Copy city report" to get the details formatted for the city's service request form.
7. **Leaderboard.** Their neighborhood's score updates live. The map shows their pin among the others.

Council quest (P1) follows the same shape: read a three-sentence summary of a real agenda item, answer one multiple-choice question, earn points.

**Points:** new report 50, confirming an existing report 20, council quest 30, budget quest 30. Limit of 5 reports per player per hour so nobody farms points.

## Feature requirements

Each feature is done when its checks pass on a real phone, not only on a laptop.

### F1. Join (P0)

- [ ] Opening the URL on a phone shows the join screen in under 3 seconds.
- [ ] Nickname (2 to 20 characters) and neighborhood are required; no email or password.
- [ ] The player ID is saved on the phone, so a refresh keeps them signed in.
- [ ] A devnet wallet is created on the server for each player. The player never sees a seed phrase.

### F2. Report quest (P0)

- [ ] The camera opens from the Report button on iOS Safari and Android Chrome.
- [ ] The photo is resized on the phone (longest side about 1280 px) before upload to S3.
- [ ] Gemini returns category, severity (low, medium, high) and a description as JSON in under 8 seconds.
- [ ] The player can change the category before submitting.
- [ ] If location is denied, the player can pick the spot on a map.
- [ ] If Gemini fails or says the photo isn't a street problem, the player sees a clear message and no points are awarded.

### F3. Points wallet (P0)

- [ ] Each award is a token transfer on Solana devnet from a treasury wallet to the player's wallet.
- [ ] The points total shows right away from the database; the explorer link appears when the transaction confirms.
- [ ] If devnet is slow or down, points still count and the screen says "On-chain confirmation pending".

### F4. Leaderboard (P0)

- [ ] Shows each neighborhood's total points and its top 3 players.
- [ ] Updates within 5 seconds of a new award.
- [ ] The player's own neighborhood is highlighted.

### F5. Council quest (P1)

- [ ] At least 3 real items from a current Tempe City Council agenda, summarized by Gemini ahead of time and checked by a teammate.
- [ ] Each has one multiple-choice question; a correct answer earns points once per player.
- [ ] Each summary links to the official agenda.

### F6. Map (P1) and duplicate merge (P2)

- [ ] A new report with the same category within about 30 meters of an open one is merged into it and raises its count.
- [ ] The map shows one pin per merged report, sized by count.
- [ ] "Copy city report" puts category, description, location and photo link on the clipboard.

### F7. Stretch (P2)

- [ ] Budget quest with one "your $100 in taxes" question from the published city budget.
- [ ] Local Deals: curated partners, proximity unlock (cheaper CIVIC cost), redeem for a demo code. Full spec in `docs/PRD-LOCAL-DEALS.md`. Replaces the thinner "pretend shop page" idea.
- [ ] Spanish toggle for all screens and summaries.

## Tech architecture

A phone web app talks to one small serverless backend on AWS, which calls Gemini for AI and Solana devnet for points.

```
Phone web app (React on Amplify)
   |  API calls                 \  photo upload (presigned URL)
   v                             v
API Gateway + Lambda  ------->  S3 (report photos)
   |   all routes; the only     DynamoDB (players, reports, awards)
   |   place keys live
   +--> Gemini API (labels and summaries)
   +--> Solana devnet (CIVIC point transfers)
```

The phone uploads photos straight to S3 and sends everything else through the API. Only Lambda talks to Gemini and Solana, so no key ever reaches the phone.

### Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend | React + Vite, hosted on AWS Amplify | Phone-first. Leaflet with OpenStreetMap for the map (no API key) |
| API | AWS Lambda (Node.js) behind API Gateway | One Lambda with a small router (Hono), deployed with AWS SAM |
| Photos | S3 bucket, uploaded with a presigned URL | The phone uploads straight to S3 |
| Database | DynamoDB | Decided. It's already inside AWS, so there is no extra account, key or network setup, and Lambda reads it with the built-in AWS SDK |
| AI | Gemini API (Interactions API), model gemini-3.8-flash | Ask for JSON output with a fixed list of categories |
| Points | Solana devnet, one SPL token ("CIVIC") | Server-held wallet addresses. `@solana/web3.js` version 1 (not 3) with `@solana/spl-token` |
| Domain | streetcreds.app (planned) | Connected to Amplify as a custom domain. HTTPS is automatic, and the camera and location features need it. The default Amplify URL stays as the fallback |

### API

This table is final. The same shapes exist as code in `shared/api.ts`.

| Route | Sends | Returns | Owner |
| --- | --- | --- | --- |
| `GET /health` | Nothing | `ok` | Pierre |
| `POST /players` | `nickname`, `neighborhood` | `player` | Pierre |
| `GET /players/:id` | Nothing | `player` | Pierre |
| `GET /leaderboard` | Nothing | `neighborhoods` (points, player count and top 3 players for each), `updatedAt` | Pierre |
| `GET /upload-url` | `playerId` in the address | `uploadUrl`, `photoKey` | Sarah |
| `POST /reports` | `playerId`, `photoKey` | `report`, labeled by Gemini and saved as a draft. No points yet | Sarah |
| `POST /reports/:id/submit` | `playerId`, `lat`, `lng`, and `category` if the player corrected it | `report`, `award`, `player`, `merged` | Sarah |
| `GET /reports` | Nothing | `reports`: published ones only, each with a temporary `photoUrl` | Sarah |
| `GET /quests/council` | `playerId` in the address | `items`, without the answers, each marked `answered` or not | Sarah |
| `POST /quests/council/answer` | `playerId`, `itemId`, `answerIndex` | `correct`, `award` (empty if wrong), `player` | Sarah |

Every error comes back as `{ error: { code, message } }`, and the message is written for the player. The codes are `validation_failed` (400), `not_found` (404), `already_submitted` (409), `already_awarded` (409), `not_street_problem` (422), `rate_limited` (429), `label_failed` (502) and `internal` (500).

### Data fields

Every field below is final. The same definitions exist as code in `shared/types.ts`.

**Player**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | Text | Unique id, made by the server |
| `nickname` | Text | 2 to 20 characters |
| `neighborhood` | Text | `downtown-tempe`, `asu-campus`, `north-tempe` or `south-tempe` |
| `points` | Number | Running total. Starts at 0 |
| `walletAddress` | Text or empty | Solana devnet address |
| `recentReportTimes` | List of times | Reports submitted in the last hour, for the limit of 5 an hour |
| `createdAt` | Time | When the player joined |

**Report**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | Text | Unique id |
| `playerId` | Text | Who took the photo |
| `photoKey` | Text | Where the photo sits in S3 |
| `category` | Text | `pothole`, `streetlight`, `graffiti`, `blocked-sidewalk` or `other`. From Gemini; the player can correct it |
| `severity` | Text | `low`, `medium` or `high` |
| `description` | Text | One sentence from Gemini |
| `lat`, `lng` | Number or empty | Empty until the report is submitted |
| `count` | Number | 1, plus one for each duplicate merged in |
| `status` | Text | `draft`, `open` or `merged` |
| `createdAt`, `submittedAt` | Time | `submittedAt` is empty while it is a draft |

**Award**

| Field | Type | Notes |
| --- | --- | --- |
| `id` | Text | Built as quest type, then what it was for, then the player. The same award can never be paid twice |
| `playerId` | Text | Who was paid |
| `questType` | Text | `report-new` (50 points), `report-confirm` (20), `council` (30) or `budget` (30) |
| `points` | Number | Points paid |
| `txSignature` | Text or empty | The Solana transaction, once sent |
| `chainStatus` | Text | `off`, `pending` or `sent` |
| `createdAt` | Time | When it was paid |

**Council item** (kept in a file, not in the database)

| Field | Type | Notes |
| --- | --- | --- |
| `id`, `title`, `summary`, `question` | Text | The summary is three sentences, checked by a person |
| `options` | List of text | Three or four answers |
| `answerIndex` | Number | The right answer. Never sent to the phone |
| `sourceUrl` | Text | The official agenda page |

### Database models

Three DynamoDB tables, one per record. Each uses `id` as its only key, bills on demand and has no indexes. These are final.

| Table | Holds | Written when | Read by |
| --- | --- | --- | --- |
| `streetcreds-players` | Player | A player joins; an award adds points; a report is submitted | Home screen, leaderboard, every route that checks the player exists |
| `streetcreds-reports` | Report | A photo is labeled (draft); the player submits it | Map, duplicate check |
| `streetcreds-awards` | Award | Points are paid; the Solana transaction is sent | Council quest, to see what the player already earned |

Two things live outside the database. Photos go in a private S3 bucket at `reports/{playerId}/{uuid}.jpg`. The council items are a checked JSON file shipped with the API.

Three rules keep the data correct:

- Points change in one place only, the `awardPoints` function, and always as an add, never as "read the total, then write it back".
- A report is published only if it is still a draft, so a double tap cannot pay twice.
- An award is written only if its id does not exist yet.

The leaderboard and the map read a whole table each time. That is fine for a few hundred rows and is not something to optimize this weekend. The exact DynamoDB types, example rows and every database call are in `TECHNICAL.md`.

### Rules that keep it safe

- All keys (Gemini, the Solana treasury, AWS) live in Lambda environment variables. None go in the frontend or in GitHub.
- Devnet only. The token has no value and the app says so.
- Photos can show faces and license plates. Tell players to photo the problem, not people, and keep the S3 bucket private.
- The leaderboard shows nicknames only. Exact locations show on the map for reports, never for players.

## Team roles

Two people, split by feature: each owns their features from the screen down to the database, so both write frontend and backend.

| Owner | Features | Frontend | Backend | Pitch |
| --- | --- | --- | --- | --- |
| **Sarah. Quests** | Report quest and council quest | Camera, confirm and reward screens. Council quest screen | `GET /upload-url` and S3 uploads. `labelPhoto` with Gemini. `POST /reports` and `GET /reports`. Council routes and content | Devpost write-up. Talks during the demo |
| **Pierre. Players, points and boards** | Joining, the points wallet, leaderboard and map | App shell and routing. Join and home screens. Leaderboard and map screens | AWS setup and deploys. DynamoDB tables. `POST /players`. Solana token, wallets and `awardPoints`. `GET /leaderboard` | README, architecture slide, backup video. Runs the phone during the demo |

**Where the two halves meet:** Sarah's quests call one function from Pierre, `awardPoints(playerId, points, questType, refId)`. Pierre's map reads Sarah's `GET /reports`. Those two are the only hand-offs.

**Shared work:** Phase 0 setup, seeding real reports on campus, testing at every checkpoint, and the demo rehearsal are done together.

**Solana fallback for a two-person team:** if a wallet per player isn't working by the midpoint check, send every award from the treasury to one shared wallet with the player ID in the transaction memo. Each award still has its own explorer link.

**First time on Solana:** neither of you has used it, so Pierre does the Solana script before any other backend work and stops after 90 minutes, working or not.

On Windows, skip steps 1 to 3. The setup script described in `TECHNICAL.md` (`api/scripts/solana-setup.ts`) creates the treasury and the token with the JavaScript libraries, with no CLI to install.

1. Install the Solana CLI and run `solana config set --url devnet`.
2. Make the treasury wallet with `solana-keygen new` and fund it with `solana airdrop 2`. If the airdrop is rate-limited, use the web faucet at faucet.solana.com.
3. Create the CIVIC token with `spl-token create-token --decimals 0`, then `spl-token create-account` and `spl-token mint` to check it works.
4. In Node, use `@solana/web3.js` and `@solana/spl-token`: `getOrCreateAssociatedTokenAccount` for the player's wallet, then `mintTo` for the award. Print the transaction signature and open it on explorer.solana.com with the devnet setting.
5. Wrap that as `awardPoints(playerId, points)` and store the treasury secret key in a Lambda environment variable.

If step 4 isn't working at the 90-minute mark, switch to the fallback above and move on. The official Solana docs and MLH's Solana resources both have a token quick start; credit whichever you follow in the README.

**How the roles stay unblocked**

- The API table, data fields and database models in Tech architecture are already decided, and they exist as code in the shared folder. Treat them as fixed, and say any change out loud before making it.
- Pierre puts up the app shell first (routing, shared layout, the API helper), so Sarah's screens have somewhere to go.
- Until `awardPoints` is real, Pierre gives Sarah a stub that only updates the database. Sarah's quests don't wait on Solana.
- Until `GET /reports` is live, Pierre builds the map against a mock JSON file with the same shape.
- One GitHub repo, one branch each, small pull requests merged often. Each of you keeps to your own folders (`quests/` and `players/`, for example) to avoid merge conflicts.
- Pierre sets up deploys once; after that either of you can deploy.
- Sit together at every checkpoint and test on one phone. With two people, a 5-minute check beats an hour of working apart on the wrong thing.

## Build plan

Six phases, each ending in a checkpoint the whole team tests on a phone. The time shares are of whatever hacking time you have left; write the real clock times in once you know the submission deadline.

### Phase 0. Setup (first 30 to 45 minutes, everyone)

1. Create the GitHub repo with `web/` and `api/` folders, plus a shared folder for the types both use, and add everyone.
2. Read the API table, data fields and database models together once. They are already decided.
3. Get accounts and keys: AWS (ask organizers about credits), Gemini API key, a devnet wallet funded from the faucet.
4. Pierre deploys a "hello" Lambda and an empty Amplify site, so the live URL exists from the start. Then connect streetcreds.app to Amplify as a custom domain. DNS can take a few hours, so start it now.

**Checkpoint:** the live URL opens on a phone and `GET /leaderboard` returns four neighborhoods with zero points.

### Phase 1. Skeleton (about 20% of the time)

| Owner | Steps |
| --- | --- |
| Sarah | S3 bucket and `GET /upload-url`. `labelPhoto` working in a script against 10 test photos; tune the prompt until labels are right. Report screen on mock data |
| Pierre | Solana script first (90-minute limit). App shell and routing. DynamoDB tables, `POST /players`, `GET /leaderboard`. Join and home screens. `awardPoints` stub for Sarah |

**Checkpoint:** a player can join from a phone and appears in the database.

### Phase 2. Core loop (about 30%)

| Owner | Steps |
| --- | --- |
| Sarah | Camera capture, resize and upload to S3. `POST /reports` wired to `labelPhoto` and `awardPoints`, including the "not a street problem" case. Confirm and reward screens. `GET /reports` |
| Pierre | Wallet per player on join. Real `awardPoints` with the explorer link, replacing the stub. Leaderboard screen with live refresh |

**Midpoint check (the cut line):** photo to label to points to leaderboard works on a phone. If it doesn't, everyone helps fix it before any P1 work starts.

### Phase 3. Second quest and map (about 20%)

| Owner | Steps |
| --- | --- |
| Sarah | Pick 3 real agenda items; generate and check the summaries and questions. Council routes with one award per player per item. Council quest screen |
| Pierre | Map with pins and "Copy city report". Rate limit on reports. Test 10 awards in a row. Draft the architecture slide |

**Checkpoint:** two quests work and the map shows pins.

### Phase 4. Polish and seed data (about 15%)

1. Both walk the campus together and submit 15 to 20 real reports, so the map and leaderboard aren't empty. This doubles as a full test on real phones.
2. Each of you fixes layout, loading states and error handling on your own screens and routes, on a small phone and a large phone.
3. Swap: Sarah tests Pierre's features and Pierre tests Sarah's, and each lists what broke.
4. Pierre records a backup video of the full flow.
5. Ask someone from another team to try it without help, and watch where they get stuck.

**Feature freeze.** After this point only bug fixes go in.

### Phase 5. Submit and rehearse (last 15%, at least 90 minutes before the deadline)

1. Sarah finishes the Devpost page (checklist in the next section) with screenshots.
2. Pierre writes the README, including credit for tutorials and AI tools, finishes the architecture slide and makes the repo public.
3. Print or display the QR code large.
4. Rehearse the demo twice with a timer. Sarah talks; Pierre runs the phone and handles anything that breaks.
5. Submit early, then keep testing.

## Demo, risks and submission

The demo is two minutes and the judge plays, with a fallback ready for each thing that can break.

### Demo script (about 2 minutes)

1. **Hook (15 s):** "Most people have never reported a pothole or read a council agenda. We made it a game."
2. **Judge joins (20 s):** they scan the QR code, type a nickname, pick a neighborhood.
3. **Report quest (40 s):** they photograph a printed pothole photo on the table. Gemini labels it, points land, the leaderboard moves.
4. **Show the chain (15 s):** tap the explorer link. "Every point is a Solana devnet transaction."
5. **Council quest (20 s):** a real Tempe agenda item in three sentences, one question.
6. **Close (10 s):** the map of real campus reports and the architecture slide. "Gemini, AWS and Solana, built this weekend."

### Risks and fallbacks

| Risk | Fallback |
| --- | --- |
| Venue Wi-Fi is slow or blocks something | Use a phone hotspot; have the recorded video ready |
| Solana devnet is slow or the faucet runs dry | Points count from the database and show "confirmation pending"; fund the treasury early |
| Gemini mislabels or times out | Player can correct the label; show a retry message; keep 3 test photos that are known to work |
| Camera won't open on a judge's phone | Offer photo upload from the gallery; keep a team phone ready |
| Scope grows | The cut line at the midpoint check; feature freeze in Phase 4 |
| Keys leak into GitHub | Keys only in Lambda environment variables; add `.env` to `.gitignore` in Phase 0 |
| The streetcreds.app domain isn't live in time | Demo from the default Amplify URL, and make the QR code only once the address is settled |

### Devpost checklist

- [ ] Project write-up: problem, what it does, how it's built, what's next
- [ ] GitHub repo link (required), public, with a README
- [ ] Credit for tutorials and AI tools used, in the GitHub README (required by the rules)
- [ ] Every team member registered for sunhacks and added to the submission
- [ ] Prize categories selected: Best Gaming, Diversity/Equality, Solana, Gemini API, AWS
- [ ] Each sponsor technology named with what it does (S3, Lambda, API Gateway, Amplify; Gemini; Solana devnet)
- [ ] Demo video, 2 minutes or less, on YouTube (optional but recommended), with a note on whether it can go in the sunhacks playlist
- [ ] Screenshots and the architecture slide
- [ ] Statement that the project was started during hacking time

### Open questions

- [x] Roles: Sarah owns quests; Pierre owns players, points and boards.
- [ ] What is the submission deadline? Put clock times on the phases.
- [x] Database: DynamoDB.
- [x] Solana experience: none, so Pierre follows the 90-minute first-time plan in Team roles.
