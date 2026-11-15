# Sarah's phases: quests

Sarah owns the **report quest** and the **council quest**, from the screen down to the database. This file is her checklist and her prompts, phase by phase.

It was rewritten on the morning of 2026-11-15 to match what is now built. If you read an earlier version, read this one from the top.

- **Her folders:** `web/src/features/quests/`, `api/src/quests/`, and the scripts `generate-council.ts` and `label-photos.ts` in `api/scripts/`
- **Hands-off without a yes from Pierre:** `shared/`, Pierre's folders, `api/src/index.ts`, `api/src/lib/`, `api/template.yaml`, `package.json` and the other project config files
- **The exception, wiring her own work:** she may add the line in `api/src/index.ts` that mounts her routes, the route lines for her three screens in `web/src/app/App.tsx`, and the example data for her own routes in `web/src/app/mock/`
- **Shared checkpoints and timing:** [PHASES.md](PHASES.md). Pierre's list: [PIERRE-PHASES.md](PIERRE-PHASES.md). Setting up your laptop: [SARAH-SETUP.md](SARAH-SETUP.md)

## Where things stand

Pierre's half is built and live at https://streetcreds.app. The **report quest code is also on `main`** (API routes 5–8 and the report screen). What is left for the cut line is verifying it end to end and getting Pierre to **deploy the API**.

On the live site right now:

- **Report screen exists** at `/report` (wired in `App.tsx`).
- **Map still errors** until Pierre deploys: it calls `GET /reports`, and the live Lambda may still be an older build that returns "That address does not exist." After deploy, an empty map (`{ "reports": [] }`) is success; pins appear once someone submits a report.
- **Council is still ComingSoon.** That is Phase 3.

Nothing you need from Pierre's helpers is missing. Reuse this table instead of rebuilding:

| You need | It exists as | Where |
| --- | --- | --- |
| A way to throw an error the phone understands | `throw new ApiError('not_found')`, and the other codes | `api/src/lib/errors.ts` |
| The database and table names | `db`, `TABLES` | `api/src/lib/db.ts` |
| The bucket name and the Gemini key | `requireEnv('PHOTO_BUCKET')`, `requireEnv('GEMINI_API_KEY')` | `api/src/lib/env.ts` |
| Shared S3 client and photo bucket | `s3`, `photoBucket()` | `api/src/quests/s3.ts` |
| Upload URL, create/submit/list reports | `reportRoutes` (mounted in `index.ts`) | `api/src/quests/reportRoutes.ts` |
| Report DynamoDB helpers | `putReport`, `getReport`, `publishReport`, `scanOpenReports`, `setRecentReportTimes` | `api/src/quests/reportStore.ts` |
| Gemini labeling | `labelPhoto`, `labelJpegBase64` | `api/src/quests/labelPhoto.ts` |
| Report request schemas | `CreateReportSchema`, `SubmitReportSchema` | `api/src/quests/schemas.ts` |
| Label-photos script | folder of `.jpg` → table of labels | `api/scripts/label-photos.ts` |
| Report screen (mock or live) | `ReportScreen`, `LocationPicker`, `RewardCard`, `resizeImage` | `web/src/features/quests/` |
| To look up a player | `getPlayer(playerId)` | `api/src/players/store.ts` |
| To tell that a "only once" write was refused | `isConditionalCheckFailed(error)` | `api/src/players/store.ts` |
| To award points (it also mints on Solana) | `awardPoints(playerId, points, questType, refId)` | `api/src/points/awardPoints.ts` |
| The report rate limit | `checkReportLimit(recentReportTimes, now)` | `api/src/players/rateLimit.ts` |
| A time limit on a slow call | `withLimit(promise, ms)` | `api/src/points/withLimit.ts` |
| To call the API from a screen | the `api` object, one function per route, plus `api.uploadPhoto()` | `web/src/app/api.ts` |
| To build a screen before its route exists | mock mode, `VITE_USE_MOCKS=true` | `web/src/app/mock/` |
| The current player | `usePlayer()` | `web/src/app/player.ts` |
| The names players see for categories and severities | `strings.categories`, `strings.severities` | `web/src/app/strings.ts` |
| The link to a Solana transaction | `explorerTxUrl(signature)` | `web/src/app/solana.ts` |
| Buttons, cards, badges, text fields, radio cards, error blocks, screen titles | `Button`, `ButtonLink`, `Card`, `LinkCard`, `Badge`, `TextField`, `OptionCard`, `ErrorNotice`, `ScreenHeader`, `Eyebrow` | `web/src/app/ui/` |
| The colors, fonts, corners and shadows | the design tokens (`bg-accent`, `text-ink`, `rounded-card`, `shadow-hard`, `text-title`, ...) | `web/src/index.css` |
| Every component in every state, on one page | the temporary `/design` page | `web/src/app/design/` |
| A finished screen to copy the style from | the map and the join screen | `web/src/features/players/` |

## The fastest path

The cut line is still: **photo, to label, to points, to leaderboard, working on a phone.** That is the end of Phase 2.

Skip rebuilding 1A / 1B / 2A from scratch. Use the **verify** prompts below, then go straight to **Phase 2B** (real flow) and tell Pierre to deploy. Council is Phase 3; drop it first if time runs short.

## How to use this file

1. Start a **new agent chat for each prompt**. Paste the session opener first, read the agent's summary, and correct it if needed.
2. Paste the prompt. If the agent stops to ask something that this file or `docs/TECHNICAL.md` answers, point it there.
3. Try what it built, then paste the wrap-up prompt.
4. Open a small pull request for each prompt's work. Do not save it all up.
5. Tick the boxes here yourself and commit the file (ticking boxes may go straight to `main`, see [CONTRIBUTING.md](CONTRIBUTING.md)). Agents must not tick boxes.

**To test on your phone:** the camera and location only work over HTTPS, so use the live site. Web changes go live a few minutes after they merge to `main`. API changes go live when Pierre runs `npm run deploy`, so tell him each time an API pull request merges.

**Your laptop uses the real database.** Players and reports you create while testing show up on the live site. Give test players a nickname starting with `test`, so they are easy to find and delete before judging.

## Session opener (paste first in every new chat)

```text
I'm Sarah, working on StreetCreds. Read AGENTS.md, docs/TECHNICAL.md, docs/CONTRIBUTING.md and docs/SARAH-PHASES.md in full before doing anything.

I own the quests: web/src/features/quests/, api/src/quests/, and the scripts generate-council.ts and label-photos.ts in api/scripts/. Work only in those. The one exception is wiring my own work: you may add the line in api/src/index.ts that mounts my routes, the route lines marked "Sarah" in web/src/app/App.tsx, and the example data for my own routes in web/src/app/mock/. Apart from that, do not change shared/, Pierre's folders, package.json or the deploy template. If a task needs a change there, describe the change and stop.

The report API and report screen already exist. Before you write anything, read these and reuse them — do not rebuild from scratch: api/src/quests/s3.ts, reportRoutes.ts, reportStore.ts, labelPhoto.ts, schemas.ts, api/scripts/label-photos.ts, web/src/features/quests/ReportScreen.tsx, LocationPicker.tsx, RewardCard.tsx, resizeImage.ts, strings.ts. Also reuse Pierre's helpers: api/src/lib/env.ts, api/src/lib/db.ts, api/src/lib/errors.ts, api/src/players/store.ts, api/src/players/rateLimit.ts, api/src/points/awardPoints.ts, api/src/points/withLimit.ts, web/src/app/api.ts, web/src/app/mock/index.ts, web/src/app/player.ts, web/src/app/strings.ts, web/src/app/solana.ts, web/src/index.css, every file in web/src/app/ui/, and web/src/features/players/MapScreen.tsx.

Rules that are easy to miss: build every screen from the components in web/src/app/ui/ and the tokens in web/src/index.css; do not write your own button, card or input styles, and do not use raw colors. The AWS region is us-east-2. Never run sam build, sam deploy or npm run deploy. The code samples in docs/TECHNICAL.md were never compiled, so type-check against the installed packages. Do not write unit tests that call Gemini, Solana or AWS. Do not tick boxes in docs/SARAH-PHASES.md.

Reply with: (1) a five-line summary of what StreetCreds is and what I own, (2) what is already built in my folders vs what this phase still needs, (3) which files I will reuse and for what, (4) anything in the docs that looks unclear or contradictory. Do not write code yet.
```

## Phase 0. Setup (about 30 minutes)

Follow [SARAH-SETUP.md](SARAH-SETUP.md). It has every command.

- [ ] AWS invitation accepted, and `aws sts get-caller-identity` shows the account ending in `5373`.
- [ ] Repo cloned and on an up-to-date `main`. `shared/` read once: it is the fixed contract.
- [ ] `api/.env` and `web/.env` created from the examples, with the bucket name filled in.
- [ ] Both dev servers run, and http://localhost:5173 shows the join screen.
- [ ] Gemini API key created in Google AI Studio and put in `api/.env`.
- [ ] Gemini key sent to Pierre privately. He adds it to the live API with `npm run deploy-secrets`.

**Checkpoint:** you can join on your own laptop and land on the home screen.

## Phase 1. The two foundations

Code for 1A and 1B is on `main`. Use the verify prompts; only fill gaps.

### 1A. Upload link and photo labeling (API)

Code present: `api/src/quests/s3.ts`, `labelPhoto.ts`, `reportRoutes.ts` (`GET /upload-url`), `api/scripts/label-photos.ts`.

- [ ] `GET /upload-url` returns a presigned S3 upload link and the photo key.
- [ ] `labelPhoto` sends a photo to Gemini and gets back whether it is a street problem, a category, a severity and a description.
- [ ] 10 test photos collected, kept outside the repo: real potholes, a streetlight, graffiti, a blocked sidewalk, plus two that are not street problems. No faces or license plates.
- [ ] Prompt tuned with `label-photos.ts` until all 10 photos come back right.
- [ ] `npm run check` and `npm run build` pass in `api/`.

Prompt 1A (verify + tune — do not rebuild):

```text
Do Phase 1A from docs/SARAH-PHASES.md as a verify-and-tune pass, following docs/TECHNICAL.md sections 5 and 6. The code already exists: api/src/quests/s3.ts, labelPhoto.ts, reportRoutes.ts (GET /upload-url), and api/scripts/label-photos.ts. Do not recreate those files from scratch.

1. Read the files above and confirm they match the contract (player check on upload-url, key shape reports/{playerId}/{uuid}.jpg, PutObject ContentType image/jpeg expiring in 300 s, Gemini via await import('@google/genai'), 12 s withLimit, ApiError('label_failed'), labelJpegBase64 exported for the script). Fix only real gaps.
2. Confirm reportRoutes is mounted in api/src/index.ts. If it is missing, add only that one wiring line.
3. Run npm run check, then npm run build, in api/.
4. Tell me how to try GET /upload-url with curl against my local API, and how to run: npx tsx --env-file-if-exists=.env scripts/label-photos.ts <folder>

Stop when done. Do not invent test photos. I will collect the 10 photos and tune the LABEL_PROMPT myself; if the script or Gemini call is broken, fix that only.
```

### 1B. The report screen, on example data (web)

Code present: `web/src/features/quests/ReportScreen.tsx`, `LocationPicker.tsx`, `RewardCard.tsx`, `resizeImage.ts`, `strings.ts`; `/report` already shows `ReportScreen`.

- [ ] Report screen built, showing every state: capture, resizing, uploading, labeling, confirm, locating, submitting, reward, error.
- [ ] Camera opens from the main button; a "Choose from gallery" option exists as the fallback.
- [ ] Photo is resized so its longest side is 1280 px, with a unit test for the size math.
- [ ] Confirm step shows the photo, the description, the severity and a category picker the player can change.
- [ ] Location is requested on submit, and a tap-the-map picker appears when it is denied or times out.
- [ ] Reward card shows the points earned, the new total, and the Solana link or "On-chain confirmation pending".
- [ ] The `/report` line in `web/src/app/App.tsx` shows the new screen.
- [ ] `npm run check` and `npm run lint` pass in `web/`.

Prompt 1B (verify + gaps — do not rebuild):

```text
Do Phase 1B from docs/SARAH-PHASES.md as a verify-and-gap pass, following the "Report quest" part of docs/TECHNICAL.md section 7. Work in mock mode: VITE_USE_MOCKS=true in web/.env.

The report UI already exists in web/src/features/quests/ (ReportScreen.tsx, LocationPicker.tsx, RewardCard.tsx, resizeImage.ts, strings.ts) and /report already shows ReportScreen. Do not rewrite the screen from scratch.

1. Read those files and the /report line in web/src/app/App.tsx. List which Phase 1B checklist boxes already hold and which do not.
2. Fill only real gaps. In particular, if resizeImage size math has no unit test yet, add one for landscape, portrait, and already-under-1280 px. Keep calling the API only through web/src/app/api.ts; keep using web/src/app/ui/ and tokens in web/src/index.css; no raw colors.
3. To see each error state, change MOCK_REPORT_RESULT at the top of web/src/app/mock/index.ts, then change it back.
4. Run npm run check and npm run lint in web/.

Stop when done and tell me how to click through every state in mock mode.
```

**Checkpoint:** on your laptop in mock mode, you can go from the Report card to the reward card. With a real photo, `label-photos.ts` labels it correctly.

## Phase 2. The core loop

This is the cut line. API code for 2A is on `main`; 2B is the remaining agent work for the cut line.

### 2A. The report routes (API)

Code present: `POST /reports`, `POST /reports/:id/submit`, `GET /reports` in `reportRoutes.ts`, plus `reportStore.ts` and `schemas.ts` (with tests).

- [ ] `POST /reports` labels the photo and saves a draft. No points yet.
- [ ] A sixth report within an hour is refused, using Pierre's `checkReportLimit`.
- [ ] A photo that is not a street problem, and a Gemini failure, each return their own error, with no points awarded.
- [ ] `POST /reports/:id/submit` publishes the report and calls `awardPoints`. A double tap does not pay twice.
- [ ] `GET /reports` returns open reports, newest first, each with a photo link.
- [ ] `npm run check` and `npm run build` pass in `api/`.
- [ ] Pull request merged, and Pierre told to deploy.

Prompt 2A (verify — do not rebuild):

```text
Do Phase 2A from docs/SARAH-PHASES.md as a verify pass, following docs/TECHNICAL.md section 5 (routes 6, 7 and 8) and the database rules in section 4.

The routes already live in api/src/quests/reportRoutes.ts with reportStore.ts and schemas.ts. Do not rewrite them from scratch.

1. Read those files and confirm: photoKey prefix check; checkReportLimit on create; labelPhoto with not_street_problem / label_failed; draft write; submit ownership + conditional draft→open (already_submitted via isConditionalCheckFailed); awardPoints('report-new'); recentReportTimes updated from checkReportLimit's times; GET /reports open only, newest first, max 200, photoUrl GetObject 3600 s; #status / #count aliased. Fix only real gaps. Skip P2 duplicate merge. Do not change awardPoints or Pierre's code. Submit may call checkDealUnlock as a bonus — leave that wiring alone unless it breaks the report award.
2. Confirm schemas have player-readable messages and unit tests in schemas.test.ts; add only what is missing.
3. Run npm run check and npm run build in api/.

Stop when done. Give me curl commands that walk upload-url → PUT JPEG → POST /reports → POST submit → GET /reports against my local API, and tell me which DynamoDB rows it creates so I can delete them afterwards. Also give me a two-line message to send Pierre asking him to npm run deploy so the live map stops 404ing on GET /reports.
```

### 2B. The real flow, end to end (web)

- [ ] With mock mode off, the whole flow works on your laptop with a real photo.
- [ ] "Not a street problem", a Gemini failure, location denied and a double tap on Submit each behave correctly.
- [ ] After a report, the points show in the header and on the Leaderboard tab, and a pin shows on the Map tab.
- [ ] Pull request merged. After Pierre deploys, the flow works on a real phone at https://streetcreds.app.

Prompt 2B:

```text
Do Phase 2B from docs/SARAH-PHASES.md. Set VITE_USE_MOCKS=false in web/.env and make sure both dev servers are running. Pierre must have a current API deploy (or you use the local API) so GET /reports is not a 404.

Walk the report flow against my local API with a real photo from my test set, and fix whatever behaves differently from mock mode in web/src/features/quests/ only. Then check four failure cases: a photo that is not a street problem; a Gemini failure (tell me when to remove the key from api/.env for a moment); location denied; and a double tap on Submit.

After a successful report, check that the points appear in the header and on the Leaderboard tab, and that a pin with the photo appears on the Map tab. Those screens are Pierre's: if one of them is wrong, describe what you see and stop; do not change it.

Stop when done. Give me a step-by-step phone test for acceptance check F2 in docs/TECHNICAL.md section 13, and a two-line message to send Pierre saying what merged and that the API needs a deploy (if he has not deployed yet).
```

**Checkpoint (both), the cut line:** photo, to label, to points, to leaderboard works on a phone. If it does not, fix it together, drop the council quest and go straight to Phase 4.

## Phase 3. Council quest

Only after the cut line passes.

- [ ] 3 real items picked from a current Tempe City Council agenda.
- [ ] `generate-council.ts` drafts a summary and one question for each. It prints drafts only.
- [ ] Every summary checked by hand against the official agenda. Nothing invented.
- [ ] Items saved in `api/src/quests/council.json`, each with its source link.
- [ ] `GET /quests/council` returns the items without the answers.
- [ ] `POST /quests/council/answer` awards points once per player per item.
- [ ] Council list screen and council item screen work on a phone.
- [ ] `npm run check` passes in both packages, and `npm run build` in `api/`.

Prompt 3:

```text
Do Phase 3 from docs/SARAH-PHASES.md, following docs/TECHNICAL.md section 5 (routes 9 and 10). Stop after each numbered step so I can check it.

1. Write api/scripts/generate-council.ts. It reads agenda text I paste into a local file and drafts, for each item, a three-sentence plain-language summary and one multiple-choice question with three or four answers. It prints the drafts for me to check. It must NOT write council.json: I paste the checked result in myself.
2. Build GET /quests/council and POST /quests/council/answer in api/src/quests/councilRoutes.ts, reading api/src/quests/council.json, and add the line in api/src/index.ts that mounts them. Never send answerIndex to the phone. An item counts as answered when the award with the id awardId('council', itemId, playerId) exists; awardId is exported from api/src/points/awardPoints.ts. A wrong answer returns correct: false and the player may try again. A right answer calls awardPoints with POINTS.council and the quest type 'council'.
3. Build CouncilListScreen.tsx and CouncilItemScreen.tsx in web/src/features/quests/, calling api.listCouncilItems and api.answerCouncilItem from web/src/app/api.ts, and reusing RewardCard. Build them from web/src/app/ui/: LinkCard and Badge for the list, OptionCard for the answers, Button to submit, ErrorNotice for errors. Each item links to its official source. Then change the two council lines marked "Sarah" in web/src/app/App.tsx.

Never invent agenda content. Use only the text I give you. Stop when done and tell me how to test acceptance check F5.
```

**Checkpoint (both):** both quests work and the map shows pins.

## Phase 4. Polish

- [ ] Every quest screen has a loading state and a plain-language error state.
- [ ] Layout checked on a small phone and a large phone, with no sideways scrolling.
- [ ] Pierre's features tested (join, leaderboard, map), with a list of what broke sent to him.
- [ ] Everything Pierre found in my features is fixed.
- [ ] Test players and test reports deleted from the database.
- [ ] With Pierre: 15 to 20 real reports submitted around campus.

Prompt 4:

```text
Do my Phase 4 from docs/SARAH-PHASES.md. For every screen and route I own: add a loading state and a plain-language error state, check the layout at 375 px and 430 px wide with no horizontal scroll, and make every tap target at least 44 px tall. Replace any hand-written button, card, input or error styles with the components in web/src/app/ui/. Do not add features. List each change you made, one line each.
```

**Checkpoint (both):** feature freeze. Bug fixes only from here.

## Phase 5. Submit

- [ ] Devpost write-up: the problem, what it does, how it's built, what's next.
- [ ] Screenshots added.
- [ ] Prize categories selected: Best Gaming, Diversity/Equality, Solana, Gemini API, AWS.
- [ ] Each sponsor technology named with what it does.
- [ ] Both team members added to the submission.
- [ ] Demo rehearsed twice with a timer. Sarah does the talking.
- [ ] Submitted before the deadline. Nothing committed after it.

## Prompts for any phase

When something breaks:

```text
This is broken. What I did: <steps>. What I expected: <result>. What happened: <result>. Exact error:

<paste the full error>

Find the cause before changing anything. Explain it in two sentences, then fix only that. Check the troubleshooting table in docs/TECHNICAL.md section 9 first.
```

When you want to change how something looks:

```text
I want to change the design: <what you want, e.g. "the reward card should feel bigger" or "use a different orange">.

Read web/src/index.css, every file in web/src/app/ui/ and web/src/app/design/DesignScreen.tsx first. The look lives in two layers: the tokens in web/src/index.css (colors, fonts, corners, shadows, type sizes) and the components in web/src/app/ui/. Both are Pierre's, and every screen uses them, so a change there changes the whole app.

1. If the change is only about my quest screens (layout, spacing, which component goes where), make it in web/src/features/quests/ using the existing components and tokens.
2. If it needs a new or changed token, a new component, or a new variant of one, do not edit index.css or app/ui. Write the exact diff as a note for Pierre, say which screens it would affect, and stop.

Never add raw colors, your own rounded, ring, shadow or bold classes, or a style library. Check the result at 375 px wide with mock mode on, and compare it against the /design page. Stop when done and tell me what changed and what Pierre needs to approve.
```

Wrap-up, at the end of every prompt's work:

```text
Wrap up this work. Run npm run check in every package you touched, npm run lint in web/ and npm run build in api/ if you touched them, and fix failures. Then tell me: (1) what you built, file by file, (2) which docs/SARAH-PHASES.md boxes are done and which are not (list them — do not tick them yourself), (3) what I should now test by hand and how, (4) anything you assumed or skipped, (5) any file you changed outside my folders and why, (6) one line to add to the README Credits section if you followed a tutorial. Do not commit or push.
```

## If you finish early

Only after Phase 4 passes, one at a time, and only when you both agree: duplicate merge, the budget quest, the Spanish toggle (with Pierre).
