# StreetCreds: instructions for coding agents

StreetCreds is a phone-first web game built at sunhacks 2026 by two people, Sarah and Pierre. Players earn points for small civic actions (reporting a street problem with a photo, answering one question about a city council item), and neighborhoods compete on a live leaderboard. Points are tokens on Solana devnet.

## Read first

| File | What it is | When it wins |
| --- | --- | --- |
| `docs/TECHNICAL.md` | Stack, data models, API contract, core functions, setup, build order, acceptance checks | Any implementation question |
| `docs/CONTRIBUTING.md` | GitHub rules: branches, commits, pull requests, what never to commit, what agents may do with Git | Any Git or GitHub question |
| `docs/SARAH-PHASES.md`, `docs/PIERRE-PHASES.md` | Each person's checklist for every phase. Work on the items of the person you are working for, and never tick a box yourself | What to build next |
| `docs/PRD.md` | Export of the product doc: scope, user flow, demo script, risks. `docs/TECHNICAL.md` is enough to build from | Any "should this exist" question |
| `AGENTS.md` (this file) | Rules for working in this repo | Any conflict about how to work |

Read `docs/TECHNICAL.md` in full before writing code. Do not guess a route, field name or table name: they are all defined there.

## Hard rules

1. **Devnet only.** Never point at Solana mainnet, never handle real funds, never ask a player for a seed phrase.
2. **No secrets in the repo or the frontend.** The Gemini key, the Solana treasury secret and AWS credentials live in Lambda environment variables and in git-ignored local files (`api/.env`, `api/samconfig.toml`). Nothing secret goes under `web/` or in a `VITE_` variable.
3. **The contract is fixed.** `shared/constants.ts`, `shared/types.ts`, `shared/api.ts`, the API routes and the database models in `docs/TECHNICAL.md` are already written and agreed between two people. If a task needs one changed, stop, describe the change and wait for a yes.
4. **Keep the pinned major versions** in `docs/TECHNICAL.md` section 1. In particular `@solana/web3.js` stays on 1.x: `@solana/spl-token` 0.4 does not work with 3.x.
5. **Priorities.** Finish every P0 item before any P1, and every P1 before any P2. Do not build P2 features unless asked by name.
6. **No new dependencies** beyond the list in `docs/TECHNICAL.md` without asking.
7. **Accounts are optional and minimal.** Players have a nickname and a neighborhood, and can play without signing in. Optional Google sign-in (`docs/ACCOUNTS.md`) stores only Google's opaque account id. Do not store an email, name or picture, do not make sign-in a requirement to play, and do not add another sign-in method, analytics or tracking without asking.
8. **Ask before anything that leaves the laptop.** Do not run `sam deploy`, `git push`, a Solana airdrop, a script that sends a Solana transaction (`solana-setup.ts`, `mint-test.ts`) or anything that creates cloud resources or costs money on your own. Print the command and wait.
9. **Credit sources.** The hackathon rules require crediting tutorials and AI tools. When you follow a tutorial or generate a substantial file, add one line to the Credits section of `README.md`.

## Ownership

Work only in the area of the person you are working for. To change the other area, write the proposed diff as a note and stop.

| Owner | Features | Paths |
| --- | --- | --- |
| Sarah | Report quest, council quest | `web/src/features/quests/`, `api/src/quests/`, `api/scripts/generate-council.ts`, `api/scripts/label-photos.ts` |
| Pierre | Joining, points wallet, leaderboard, map, app shell, infrastructure | `web/src/features/players/`, `web/src/app/`, `api/src/players/`, `api/src/points/`, `api/template.yaml`, `amplify.yml` |
| Pierre | The scaffold | Package and config files in `web/` and `api/` (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.env.example`), `web/src/main.tsx`, `api/src/local.ts`, `api/scripts/solana-setup.ts`, `api/scripts/mint-test.ts`, `api/scripts/seed.ts` |
| Both (agree first) | The contract and the API's shared core | `shared/`, `api/src/index.ts`, `api/src/lib/` |

Three notes on the table:

- **Pierre creates `api/src/index.ts` and `api/src/lib/` once, in Phase 0** (`index.ts`, `lib/env.ts`, `lib/db.ts`, `lib/errors.ts`). After the Phase 0 checkpoint they change only by agreement.
- **Wiring your own work is always allowed.** Either person may add the line in `api/src/index.ts` that mounts their own routes file. Sarah may add or change the route lines for her three screens in `web/src/app/App.tsx` and the fixtures for her own routes in `web/src/app/mock/`. Nothing else in those files.
- **`package.json` is Pierre's.** The scaffold installs every dependency listed in `docs/TECHNICAL.md`. Adding another falls under rule 6 and goes through him.

The hand-offs between the halves:

- `awardPoints()` and the rate-limit helper `checkReportLimit()`: Pierre provides them, Sarah's routes call them.
- The typed client functions in `web/src/app/api.ts` and the mock fixtures, for all ten routes: Pierre provides them, Sarah's screens use them.
- `GET /reports`: Sarah provides it, Pierre's map reads it.
- `requirePlayer(c, playerId)` in `api/src/players/auth.ts`: Pierre provides it, and every route that takes a player id calls it instead of loading the player itself. It is what protects a signed-in player.
- `ShareCard` in `web/src/features/quests/share/`: the street cred card, used by Sarah's reward step and Pierre's profile.

## Commands

Run from the package folder named.

| Where | Command | Does |
| --- | --- | --- |
| `web/` | `npm run dev` | Vite dev server on http://localhost:5173 |
| `web/` | `npm run check` | Type-check and unit tests |
| `web/` | `npm run build` | Production build into `web/dist` |
| `api/` | `npm run dev` | Local API on http://localhost:3001, using the real AWS tables and bucket |
| `api/` | `npm run check` | Type-check and unit tests |
| `api/` | `npm run seed` | Load demo players and reports (asks before writing) |
| `api/` | `npm run solana-setup` | Create the devnet treasury and the CIVIC mint, and write both values into `api/.env`. Humans only, see rule 8 |
| `api/` | `npm run mint-test` | Send one test mint to devnet and print its explorer link. Add `-- 10` for ten in a row. Humans only, see rule 8 |
| `api/` | `npm run build` | Bundle the API into `api/dist/index.js` with esbuild. Safe to run any time |
| `api/` | `npm run deploy` | `npm run build`, then `sam deploy`. Humans only, see rule 8. Never `sam build` |
| `api/` | `npm run deploy-secrets` | Deploy with the Gemini key and the Solana settings from `api/.env`, without printing them. Humans only, see rule 8 |

## Definition of done

A change is done when all of these hold:

- `npm run check` passes in every package you touched.
- The feature's acceptance checks in `docs/TECHNICAL.md` section 13 pass.
- New screens work at 375 px wide with no horizontal scroll, and every tap target is at least 44 px.
- Every API error uses the standard error shape from `docs/TECHNICAL.md` section 5, and the screen shows a plain-language message for it.
- No file outside your owner's paths changed, unless the change was agreed or is one of the wiring lines described under Ownership.

## When something is unclear

State the assumption in one line at the top of your reply and keep going if the choice is easy to undo. Stop and ask if it touches the contract, costs money, or deletes data.
