# StreetCreds

Earn points for making your neighborhood better.

StreetCreds turns city participation into a phone game. Players earn points for small civic actions, and their neighborhood climbs a live leaderboard:

- **Report quest:** photograph a street problem (a pothole, a broken streetlight, graffiti, a blocked sidewalk). Gemini labels it, and the report lands on a shared map.
- **Council quest:** read a three-sentence summary of a real Tempe City Council agenda item and answer one question.

Every point is minted as a token on Solana devnet, so each award has its own explorer link. Nothing to install and no login: scan a QR code, pick a nickname and a neighborhood, and play.

Built at [sunhacks 2026](https://sunhacks-2026.devpost.com/) at Arizona State University. The site is planned to live at [streetcreds.app](https://streetcreds.app).

## Status

In progress during the hackathon. So far the repo holds the plan and the shared contract; the app itself is not built yet.

| Part | State |
| --- | --- |
| Product plan, technical spec, agent rules | Done |
| Shared contract (`shared/`): constants, data types, API types | Done |
| API (`api/`) | Not started |
| Web app (`web/`) | Not started |

## Documentation

| File | What's in it | Read it when |
| --- | --- | --- |
| [PRD.md](PRD.md) | The product: scope and priorities, user flow, feature checklists, team roles, build plan, demo script, risks | You want to know what we're building and why |
| [PHASES.md](PHASES.md) | Sarah's and Pierre's work, phase by phase, as checklists with shared checkpoints | You want to know what to do next |
| [TECHNICAL.md](TECHNICAL.md) | The implementation spec: stack and versions, data models, API contract, core functions, setup, development guide, build order | You're writing code |
| [AGENTS.md](AGENTS.md) | Rules for AI coding agents: hard rules, who owns which folders, commands, definition of done | You point Cursor, Claude Code or another agent at this repo |

Where the PRD and TECHNICAL.md differ on an implementation detail, TECHNICAL.md wins.

## How it's built

| Layer | Choice |
| --- | --- |
| Web app | React + Vite + TypeScript, hosted on AWS Amplify |
| API | One AWS Lambda running Hono, behind API Gateway, deployed with AWS SAM |
| Data | DynamoDB (players, reports, awards), S3 for photos |
| AI | Gemini API, model `gemini-3.8-flash`, for photo labeling and council summaries |
| Points | An SPL token on Solana devnet |
| Map | Leaflet with OpenStreetMap |

The phone uploads photos straight to S3 and sends everything else through the API. Only the Lambda talks to Gemini and Solana, so no key ever reaches the phone. Details are in [TECHNICAL.md](TECHNICAL.md).

## Repo layout

```
streetcreds/
  PRD.md  PHASES.md  TECHNICAL.md  AGENTS.md  README.md
  shared/       the contract both sides import: constants, data types, API types
  api/          the backend (planned)
  web/          the phone web app (planned)
```

`shared/` is fixed. Changes to it need both team members to agree first.

## Getting started

The app is not built yet. To set up a machine and start building, follow [TECHNICAL.md section 9, "Development guide"](TECHNICAL.md#9-development-guide). In short, you need Node.js 24, Git, the AWS CLI and a Gemini API key.

Never commit keys. Secrets go in `api/.env` and `api/samconfig.toml`, which `.gitignore` already excludes.

## Team

| Person | Owns |
| --- | --- |
| Sarah | Quests: the report quest and the council quest, from screen to database |
| Pierre | Players, points and boards: joining, the Solana points wallet, leaderboard, map, AWS setup and deploys |

## Prompts for your coding agent

Copy-paste prompts for Cursor, Claude Code or any agent that reads this repo. They are written so the agent reads the spec first, stays inside one person's folders, and stops at the end of one phase.

### How to get good results

- Start a **new chat for each phase**. Long chats drift and forget the rules.
- Paste the **session opener** first, wait for the agent's summary, and correct it if it's wrong. Then paste the phase prompt.
- Give **one phase at a time**. If a phase is big, send it one bullet at a time from [PHASES.md](PHASES.md).
- When something breaks, paste the **exact error text** and say what you did just before it.
- End every phase with the **wrap-up prompt**, then tick the boxes in PHASES.md yourself.
- The agent must not deploy, push or touch `shared/` on its own. If it asks to, read what it wants before saying yes.

### Session opener (both)

Sarah's version:

```text
I'm Sarah, working on StreetCreds. Read AGENTS.md, TECHNICAL.md and PHASES.md in full before doing anything.

I own the quests: web/src/features/quests/ and api/src/quests/. Work only in those folders. Do not change shared/, Pierre's folders, or the deploy template. If a task needs a change there, describe the change and stop.

Reply with: (1) a five-line summary of what StreetCreds is and what I own, (2) the routes and functions I am responsible for, (3) anything in the docs that looks unclear or contradictory. Do not write code yet.
```

Pierre's version:

```text
I'm Pierre, working on StreetCreds. Read AGENTS.md, TECHNICAL.md and PHASES.md in full before doing anything.

I own players, points and boards: web/src/features/players/, web/src/app/, api/src/players/, api/src/points/, api/template.yaml and amplify.yml. Work only in those. Do not change shared/ or Sarah's folders (web/src/features/quests/, api/src/quests/). If a task needs a change there, describe the change and stop.

Reply with: (1) a five-line summary of what StreetCreds is and what I own, (2) the routes and functions I am responsible for, (3) anything in the docs that looks unclear or contradictory. Do not write code yet.
```

### Sarah's phase prompts

Phase 1, skeleton:

```text
Do Sarah's Phase 1 from PHASES.md, following TECHNICAL.md sections 5 and 6.

1. Build GET /upload-url (route 5).
2. Build labelPhoto in api/src/quests/labelPhoto.ts using the Gemini Interactions API as shown in TECHNICAL.md. Also write a script that runs it on every image in a local folder and prints the result as a table, so I can tune the prompt on my 10 test photos.
3. Build the report screen against mock data only (VITE_USE_MOCKS=true), with every state in the report flow: idle, resizing, uploading, labeling, confirm, locating, submitting, reward, error.

Type-check against the installed packages as you go and fix what fails. Write the unit tests TECHNICAL.md asks for. Stop when Phase 1 is done and tell me exactly how to test it by hand.
```

Phase 2, core loop:

```text
Do Sarah's Phase 2 from PHASES.md.

Build the real report flow end to end: camera capture, resize to 1280 px, upload to S3, POST /reports (label and save a draft), POST /reports/:id/submit (publish and call awardPoints), the confirm screen with the location fallback, the reward card, and GET /reports.

Call awardPoints exactly as TECHNICAL.md section 6 defines it. If Pierre's real version is not merged yet, use his stub and do not write your own.

Cover the failure cases: not a street problem, Gemini error or timeout, location denied, double tap on submit. Stop when done and give me a step-by-step phone test for acceptance check F2.
```

Phase 3, council quest:

```text
Do Sarah's Phase 3 from PHASES.md.

1. Write api/scripts/generate-council.ts. It reads agenda text I paste into a local file and drafts a three-sentence plain-language summary plus one multiple-choice question for each item. It must print the drafts for me to check and must NOT write council.json itself.
2. Build GET /quests/council and POST /quests/council/answer (routes 9 and 10), with one award per player per item.
3. Build the council list screen and the council item screen.

Never invent agenda content. Use only the text I give you. Stop when done and tell me how to test acceptance check F5.
```

### Pierre's phase prompts

Phase 1, skeleton:

```text
Do Pierre's Phase 1 from PHASES.md, following TECHNICAL.md sections 5, 6, 8 and 9. Go in this order and stop after each numbered step so I can check it.

1. Write api/scripts/solana-setup.ts as described in section 9, step 6. Do not run an airdrop or create anything on devnet yourself: print the command and wait for me.
2. Build the app shell: routing, layout, app/api.ts with mock mode, app/player.ts, app/strings.ts.
3. Write api/template.yaml with the HTTP API, the Lambda, the three DynamoDB tables and the S3 bucket from section 8. Do not run sam deploy: print the command and wait for me.
4. Build POST /players, GET /players/:id and GET /leaderboard, with aggregateLeaderboard as a tested pure function.
5. Build the join and home screens.
6. Build the awardPoints stub (SOLANA_MODE=off: write the award once, add the points). Sarah depends on this, so keep its signature exactly as documented.

Install @solana/web3.js@1, never version 3. Type-check as you go.
```

Phase 2, core loop:

```text
Do Pierre's Phase 2 from PHASES.md.

1. Give each new player a wallet address on join when SOLANA_MODE is per-player.
2. Replace the awardPoints stub with the real one from TECHNICAL.md section 6: conditional write of the award, atomic add of points, mint on devnet with a 10-second limit, then save the signature. It must never throw because of Solana: points still count and the award stays pending.
3. Also support SOLANA_MODE=shared as the fallback.
4. Build the leaderboard screen: four neighborhoods, top 3 players each, refresh every 4 seconds, my neighborhood highlighted.

Do not change the awardPoints signature or return shape. Stop when done and give me a phone test for acceptance checks F3 and F4.
```

Phase 3, map:

```text
Do Pierre's Phase 3 from PHASES.md.

1. Build the map screen from TECHNICAL.md section 7: react-leaflet, OpenStreetMap tiles with attribution, one circle marker per open report sized by count and colored by severity, a popup with the photo and details.
2. Build buildCityReport as a tested pure function and wire the "Copy city report" button.
3. Add the rate limit of 5 reports per player per hour. The check belongs in Sarah's POST /reports route, so write the pure helper and its tests in api/src/lib/ and describe the two lines she needs to add. Do not edit her files.
4. Write a script that sends 10 awards in a row and reports how many reached devnet.

Build the map against mock data if GET /reports is not live yet. Stop when done and tell me how to test acceptance check F6.
```

### Shared prompts (both)

Polish, Phase 4:

```text
Do my Phase 4 from PHASES.md. For every screen and route I own: add a loading state and a plain-language error state, check the layout at 375 px and 430 px wide with no horizontal scroll, and make every tap target at least 44 px tall. Do not add features. List each change you made, one line each.
```

When something breaks:

```text
This is broken. What I did: <steps>. What I expected: <result>. What happened: <result>. Exact error:

<paste the full error>

Find the cause before changing anything. Explain it in two sentences, then fix only that. Check the troubleshooting table in TECHNICAL.md section 9 first.
```

Wrap-up, end of every phase:

```text
Wrap up this phase. Run npm run check in every package you touched and fix failures. Then tell me: (1) what you built, file by file, (2) which PHASES.md boxes are done and which are not, (3) which acceptance checks in TECHNICAL.md section 13 I should now test on my phone and how, (4) anything you assumed or skipped, (5) one line to add to the README Credits section if you followed a tutorial. Do not commit or push.
```

## Credits

The sunhacks rules ask every project to credit the tutorials and AI tools it used. Add a line here whenever you follow a tutorial or generate a substantial part of the code.

- Planning documents, the shared contract in `shared/`, and this README were drafted with Claude (Anthropic).

## License

No license chosen yet.
