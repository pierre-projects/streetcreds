# Sarah's phases: quests

Sarah owns the **report quest** and the **council quest**, from the screen down to the database. This file is her checklist and her prompts, phase by phase.

- **Her folders:** `web/src/features/quests/`, `api/src/quests/`, `api/scripts/generate-council.ts`
- **Hands-off without a yes from Pierre:** `shared/`, Pierre's folders, `api/src/index.ts`, `api/src/lib/`, `api/template.yaml`
- **Where she meets Pierre:** she calls his `awardPoints` (a stub exists first), and his map reads her `GET /reports`
- **Shared checkpoints and timing:** [PHASES.md](PHASES.md). Pierre's list: [PIERRE-PHASES.md](PIERRE-PHASES.md)

## How to use this file

1. Start a **new agent chat for each phase**. Paste the session opener, read the agent's summary, correct it if needed.
2. Paste that phase's prompt. If the phase is big, send it one checklist item at a time.
3. Test on your phone, then paste the wrap-up prompt.
4. Tick the boxes here yourself and commit the file (ticking boxes may go straight to `main`, see [CONTRIBUTING.md](CONTRIBUTING.md)).

Do not start a phase until the checkpoint before it passes on a real phone.

## Session opener (paste first in every new chat)

```text
I'm Sarah, working on StreetCreds. Read AGENTS.md, docs/TECHNICAL.md, docs/CONTRIBUTING.md and docs/SARAH-PHASES.md in full before doing anything.

I own the quests: web/src/features/quests/ and api/src/quests/. Work only in those folders. Do not change shared/, Pierre's folders, or the deploy template. If a task needs a change there, describe the change and stop.

Reply with: (1) a five-line summary of what StreetCreds is and what I own, (2) the routes and functions I am responsible for, (3) anything in the docs that looks unclear or contradictory. Do not write code yet.
```

## Phase 0. Setup (with Pierre, first 30 to 45 minutes)

- [ ] Clone the repo and read `shared/` with Pierre once. It is the fixed contract.
- [ ] Install Node.js 24 and the AWS CLI. Run `aws configure` for `us-west-2`.
- [ ] Get a Gemini API key from Google AI Studio. Share it with Pierre privately, never in the repo.
- [ ] Create `api/.env` and `web/.env` from the examples once Pierre has done the first deploy.

**Checkpoint (both):** the live URL opens on a phone and `GET /leaderboard` returns four neighborhoods with zero points.

## Phase 1. Skeleton (about 20% of the time)

- [ ] `GET /upload-url` returns a presigned S3 upload link and the photo key.
- [ ] `labelPhoto` works as a script: a photo goes to Gemini and category, severity and description come back as JSON.
- [ ] 10 test photos collected: real potholes, a streetlight, graffiti, a blocked sidewalk, plus two that are not street problems.
- [ ] Prompt tuned until all 10 photos are labeled correctly.
- [ ] Report screen built on mock data, showing every state: capture, labeling, confirm, reward, error.
- [ ] `npm run check` passes in `api/` and `web/`.

Prompt:

```text
Do Sarah's Phase 1 from docs/SARAH-PHASES.md, following docs/TECHNICAL.md sections 5 and 6.

1. Build GET /upload-url (route 5).
2. Build labelPhoto in api/src/quests/labelPhoto.ts using the Gemini Interactions API as shown in docs/TECHNICAL.md. Also write a script that runs it on every image in a local folder and prints the result as a table, so I can tune the prompt on my 10 test photos.
3. Build the report screen against mock data only (VITE_USE_MOCKS=true), with every state in the report flow: idle, resizing, uploading, labeling, confirm, locating, submitting, reward, error.

Type-check against the installed packages as you go and fix what fails. Write the unit tests docs/TECHNICAL.md asks for. Stop when Phase 1 is done and tell me exactly how to test it by hand.
```

**Checkpoint (both):** a player can join from a phone and appears in the database.

## Phase 2. Core loop (about 30%)

- [ ] Camera opens from the Report button on a phone; a gallery option exists as the fallback.
- [ ] Photo is resized to 1280 px on the phone and uploaded to S3.
- [ ] `POST /reports` labels the photo and saves a draft. No points yet.
- [ ] "Not a street problem" and Gemini failures show a clear message, with no points awarded.
- [ ] Confirm screen shows the photo, description and a category picker the player can change.
- [ ] Location works, and the map picker appears when location is denied.
- [ ] `POST /reports/:id/submit` publishes the report and calls `awardPoints`. A double tap does not pay twice.
- [ ] Reward card shows points earned, the new total, and the explorer link or "On-chain confirmation pending".
- [ ] `GET /reports` returns open reports with photo links. Pierre is told it's live.
- [ ] `npm run check` passes.

Prompt:

```text
Do Sarah's Phase 2 from docs/SARAH-PHASES.md.

Build the real report flow end to end: camera capture, resize to 1280 px, upload to S3, POST /reports (label and save a draft), POST /reports/:id/submit (publish and call awardPoints), the confirm screen with the location fallback, the reward card, and GET /reports.

Call awardPoints exactly as docs/TECHNICAL.md section 6 defines it. If Pierre's real version is not merged yet, use his stub and do not write your own.

Cover the failure cases: not a street problem, Gemini error or timeout, location denied, double tap on submit. Stop when done and give me a step-by-step phone test for acceptance check F2.
```

**Checkpoint (both), the cut line:** photo, to label, to points, to leaderboard works on a phone. If it doesn't, fix it together, drop the council quest and go straight to Phase 4.

## Phase 3. Council quest (about 20%)

- [ ] 3 real items picked from a current Tempe City Council agenda.
- [ ] `generate-council.ts` drafts a summary and one question for each. It prints drafts only.
- [ ] Every summary checked by hand against the official agenda. Nothing invented.
- [ ] Items saved in `council.json`, each with its source link.
- [ ] `GET /quests/council` returns the items without the answers.
- [ ] `POST /quests/council/answer` awards points once per player per item.
- [ ] Council list screen and council item screen work on a phone.
- [ ] `npm run check` passes.

Prompt:

```text
Do Sarah's Phase 3 from docs/SARAH-PHASES.md.

1. Write api/scripts/generate-council.ts. It reads agenda text I paste into a local file and drafts a three-sentence plain-language summary plus one multiple-choice question for each item. It must print the drafts for me to check and must NOT write council.json itself.
2. Build GET /quests/council and POST /quests/council/answer (routes 9 and 10), with one award per player per item.
3. Build the council list screen and the council item screen.

Never invent agenda content. Use only the text I give you. Stop when done and tell me how to test acceptance check F5.
```

**Checkpoint (both):** both quests work and the map shows pins.

## Phase 4. Polish (about 15%)

- [ ] Every quest screen has a loading state and a plain-language error state.
- [ ] Layout checked on a small phone and a large phone, with no sideways scrolling.
- [ ] Pierre's features tested (join, leaderboard, map), with a list of what broke sent to him.
- [ ] Everything Pierre found in my features is fixed.
- [ ] With Pierre: 15 to 20 real reports submitted around campus.

Prompt:

```text
Do my Phase 4 from docs/SARAH-PHASES.md. For every screen and route I own: add a loading state and a plain-language error state, check the layout at 375 px and 430 px wide with no horizontal scroll, and make every tap target at least 44 px tall. Do not add features. List each change you made, one line each.
```

**Checkpoint (both):** feature freeze. Bug fixes only from here.

## Phase 5. Submit (last 15%)

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

Wrap-up, at the end of every phase:

```text
Wrap up this phase. Run npm run check in every package you touched and fix failures. Then tell me: (1) what you built, file by file, (2) which docs/SARAH-PHASES.md boxes are done and which are not, (3) which acceptance checks in docs/TECHNICAL.md section 13 I should now test on my phone and how, (4) anything you assumed or skipped, (5) one line to add to the README Credits section if you followed a tutorial. Do not commit or push.
```

## If you finish early

Only after Phase 4 passes, one at a time, and only when you both agree: duplicate merge, the budget quest, the Spanish toggle (with Pierre).
