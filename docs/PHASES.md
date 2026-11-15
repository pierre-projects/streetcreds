# StreetCreds: phases overview

The shared view of the build: what each phase is, and the checkpoint you both test on one phone before moving on. The detailed checklists and agent prompts are in each person's own file:

- **[SARAH-PHASES.md](SARAH-PHASES.md):** quests (report quest, council quest)
- **[PIERRE-PHASES.md](PIERRE-PHASES.md):** players, points and boards (joining, Solana points, leaderboard, map, infrastructure)

The two lists meet in only a few places: Sarah's routes call Pierre's `awardPoints` and his rate-limit helper, her screens use the client functions and mock data in his app shell, and Pierre's map reads Sarah's `GET /reports`. `awardPoints` ships as a stub first and the map starts on mock data, so nobody waits.

## Phases at a glance

The time shares are of whatever hacking time is left. Write real clock times in the last column once you know the submission deadline.

| Phase | Share | Sarah | Pierre | Ends by |
| --- | --- | --- | --- | --- |
| 0. Setup | First 30 to 45 min | Gemini key, local setup | Scaffold, first deploy (API, tables, bucket), hosting, domain | |
| 1. Skeleton | 20% | Upload link, Gemini labeling, report screen on mock data | Solana setup and a test mint, app shell, player and leaderboard routes, join and home screens, `awardPoints` stub | |
| 2. Core loop | 30% | Full report quest, end to end, with the rate limit | Real `awardPoints`, leaderboard screen | |
| 3. Second quest and map | 20% | Council quest | Map, "Copy city report", rate-limit helper | |
| 4. Polish | 15% | Own screens; test Pierre's features | Own screens; test Sarah's features; backup video | |
| 5. Submit | 15% | Devpost page; talks in the demo | README, slide; runs the phone in the demo | |

## Checkpoints (both, on one phone)

Do not start a phase until the checkpoint before it passes.

- [x] **After Phase 0:** the live URL opens on a phone, and `GET /leaderboard` returns four neighborhoods with zero points.
- [x] **After Phase 1:** a player can join from a phone and appears in the database.
- [ ] **After Phase 2, the cut line:** photo, to label, to points, to leaderboard works on a phone. If it fails, both fix it together, drop the council quest and go to polish.
- [ ] **After Phase 3:** both quests work and the map shows pins. Cut whatever is unfinished.
- [ ] **After Phase 4:** feature freeze. Bug fixes only from here.
- [ ] **After Phase 5:** submitted on Devpost, demo rehearsed twice. Nothing is committed after the deadline.

When a checkpoint passes, tag it (`git tag checkpoint-2`, then `git push origin checkpoint-2`) so there is always a known-good version to go back to.

## Done together

- [x] Phase 0: read `shared/` together once. It is the fixed contract.
- [ ] Every checkpoint above, on one phone, side by side.
- [ ] Phase 4: walk the campus and submit 15 to 20 real reports.
- [ ] Phase 4: ask someone from another team to try it without help, and watch where they get stuck.
- [ ] Phase 5: rehearse the demo twice with a timer.

## If you finish early

Stretch items are built only after Phase 4 passes, one at a time, and only when you both agree: duplicate merge (Sarah), budget quest (Sarah), Spanish toggle (both), Local Deals (Pierre + Sarah unlock wiring; see `docs/PRD-LOCAL-DEALS.md`).
