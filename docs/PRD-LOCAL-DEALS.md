# StreetCreds: Local Deals PRD

Nov 15, 2026 · Stretch feature (P2)

**Status:** Product decisions locked for a later implementation branch. Do not build until the core P0/P1 cut line in `docs/PRD.md` is done, and do not change `shared/` or live API routes until both owners agree on the contract section below.

**Parent:** Extends the P2 item "Spend points at pretend local shops" in `docs/PRD.md`. Implementation details that touch code must also land in `docs/TECHNICAL.md` before coding starts.

## Overview

Local Deals turns CIVIC points into discounts at a small set of curated neighborhood partners. The signature mechanic is a **proximity bonus**: when a player submits a street report near a partner, that partner’s deal gets cheaper for them.

- **Problem the stretch solves:** Points on a leaderboard feel abstract. Judges and players ask "what do I do with them?"
- **Solution:** Curated local shops list a base CIVIC cost. Reporting a problem within walking distance unlocks a lower cost for that shop. Redeeming burns CIVIC and shows a short demo code.
- **One-line pitch:** "Fix the sidewalk outside the cafe → the cafe thanks you."
- **Locked product choices:**
  1. **Curated partners** — the team seeds the list for the demo. No merchant login, no self-serve dashboard.
  2. **Cheaper cost unlock** — same offer, fewer points required after a nearby report. Not a bigger freebie at the same price.
  3. **Devnet / pretend commerce only** — no real money, no real payment rail, no seed phrases. Offers are demo fiction or friend businesses who agreed to play along.

## Goals

| Goal | How Local Deals helps |
| --- | --- |
| Close the earn → spend loop | Players spend CIVIC; Solana story includes a burn / return to treasury |
| Make proximity matter | Location already collected for reports becomes the unlock key |
| Demo for judges in under 30 seconds | Report near a seeded pin → reward card mentions unlock → Deals screen shows cheaper price → redeem |
| Stay inside hackathon cuts | No accounts, no mainnet, no merchant tooling, no city filing |

## Non-goals

- Merchant self-serve (claim a shop, edit offers, see analytics).
- Real fiat discounts, POS integration, or QR payment.
- Player-to-player transfers of CIVIC.
- Unlocking a *better* offer at the same cost (rejected in favor of cheaper cost).
- Building this before P0 + map (and preferably council) are solid on a phone.

## Users

| Who | What they do |
| --- | --- |
| Player | Earns CIVIC, unlocks cheaper deals by reporting near partners, redeems for a demo code |
| Judge / expo visitor | Completes one nearby report and sees the price drop |
| Curated partner (fiction or friend) | Appears on the list; does not use the app this weekend |
| City staff | Unchanged; they still get cleaner reports. Deals are a resident incentive, not a city admin surface |

## Signature mechanic

**Report near a partner → that partner’s CIVIC cost drops for this player.**

| Event | Distance rule | Effect |
| --- | --- | --- |
| Player submits a new report (`report-new`) | Report `lat`/`lng` within **200 meters** of a partner pin | Unlock **neighborhood rate** (cheaper `pointsCost`) for that partner |
| Player confirms a merged report (`report-confirm`) | Same 200 m rule | Same unlock (still one unlock per partner per player) |
| Report is farther than 200 m from every partner | — | Base costs only; normal CIVIC award still applies |
| Council or budget quest | — | Awards CIVIC but does **not** unlock proximity deals |

**Unlock lifetime (demo default):** until the player redeems once at that partner, or until the demo session is reset by re-seeding. For a longer live site, treat unlocks as lasting until end of the calendar week (America/Phoenix). Pick one before coding; default for sunhacks is **until redeemed once**.

**Caps:**

- At most **one active unlock per partner per player**.
- Redeeming clears the unlock for that partner (they return to base cost until they report nearby again).
- Existing report rate limit (5 reports per player per hour) remains the anti-farm control.

## Curated partners (demo seed)

Four partners, one near each demo neighborhood. Exact lat/lng are filled when the seed file is written; names may be fictional or real friends who opted in.

| id | Name | Neighborhood | Category | Base cost (CIVIC) | Neighborhood rate (CIVIC) | Offer (same either way) |
| --- | --- | --- | --- | --- | --- | --- |
| `mill-coffee` | Mill Ave Coffee | `downtown-tempe` | cafe | 100 | 50 | Free drip coffee |
| `campus-bike` | Campus Bike Co-op | `asu-campus` | bikes | 150 | 75 | Tube patch |
| `south-books` | South Stack Books | `south-tempe` | bookstore | 80 | 40 | $2 off any used book |
| `north-pizza` | North Slice | `north-tempe` | food | 120 | 60 | Free garlic knots |

Partners live in a **checked JSON file shipped with the API** (same pattern as council items), not in DynamoDB, unless implementation later needs edits without redeploy.

## User flows

### A. Unlock on report (happy path)

1. Player is already joined and opens Report.
2. They capture a street problem near a seeded partner (demo: stand on the block, or use a known test coordinate).
3. They submit. Points award as today.
4. The API also checks partner distance. If within 200 m and no active unlock yet, it records an unlock.
5. Reward card shows the usual points animation **plus** one plain line:  
   `Unlocked a better rate at Mill Ave Coffee — 50 CIVIC instead of 100.`
6. Player opens **Local Deals**, sees that partner highlighted with the cheaper cost.
7. They tap Redeem, confirm spend, get a short code, and their CIVIC total drops.

### B. Browse without unlock

1. Player opens Local Deals from Home.
2. They see all curated partners with **base** costs.
3. Copy explains: "Report a street problem within about two blocks of a shop to unlock the neighborhood rate."
4. Redeem at base cost is allowed if they have enough points (proximity is a bonus, not a gate).

### C. Redeem

1. Player taps a deal.
2. Screen shows offer, current cost (base or unlocked), and their balance.
3. Confirm → server checks balance, deducts points, clears unlock if one was used, returns a **6-character demo code** and optional explorer link if the burn was sent on-chain.
4. Code is shown large; helper text: "Show this at the counter (demo)." Code is not verified by any merchant system.

### D. Not enough points

- Button disabled or confirm returns a plain-language error: "You need 50 more CIVIC for this deal."

## Screens

Phone-first, 375 px, existing UI components from `web/src/app/ui/`. No new design system.

| Screen | Route (proposed) | Owner area | Job |
| --- | --- | --- | --- |
| Local Deals list | `/deals` | Pierre (`web/src/features/players/`) | List partners, show base vs unlocked cost, entry to redeem |
| Deal detail / redeem | `/deals/:partnerId` | Pierre | Confirm spend, show code |
| Reward card addition | (existing report reward) | Sarah wires the unlock line; copy only | One sentence when `unlock` is present |
| Home entry | existing Home | Pierre | One LinkCard: "Local Deals" |
| Map (nice-to-have) | existing Map | Pierre | Partner pins distinct from report pins — only if time |

**Cut if late:** map pins and deal detail as a separate route; redeem can be a confirm step on the list.

## Points and Solana

- **Earn path unchanged:** report-new 50, report-confirm 20, council 30, budget 30.
- **Spend path (new):** redeeming a deal subtracts the charged CIVIC cost from the player’s `points` total through one server function (mirror of `awardPoints`, never "read total then write" from the client).
- **On-chain story for judges:** preferred — transfer CIVIC from the player wallet back toward the treasury (or burn), store `txSignature` on a redemption record. Fallback if flaky — database deduct only, UI says "On-chain confirmation pending" / "Demo spend recorded", same honesty pattern as awards.
- Devnet only. UI never implies real money.

## Proposed data (needs agreement before `shared/` changes)

These shapes are **proposals**. Per `AGENTS.md`, changing `shared/types.ts`, `shared/api.ts`, routes, or tables requires a yes from both owners before implementation.

### Partner (static file)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | Text | Stable slug, e.g. `mill-coffee` |
| `name` | Text | Display name |
| `neighborhood` | Text | One of the four existing neighborhood ids |
| `category` | Text | Short label for the list |
| `lat`, `lng` | Number | Partner pin |
| `radiusMeters` | Number | Default `200` |
| `baseCost` | Number | CIVIC at full price |
| `unlockedCost` | Number | CIVIC after proximity unlock; must be `< baseCost` |
| `offer` | Text | What they get (same text either way) |

### Unlock (database — proposed)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | Text | e.g. `unlock:{playerId}:{partnerId}` so only one active row |
| `playerId` | Text | Who unlocked |
| `partnerId` | Text | Which partner |
| `reportId` | Text | Report that triggered it |
| `createdAt` | Time | When unlocked |
| `status` | Text | `active` or `redeemed` |

### Redemption (database — proposed)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | Text | Unique |
| `playerId` | Text | Who spent |
| `partnerId` | Text | Where |
| `pointsSpent` | Number | Actual cost charged |
| `usedUnlock` | Boolean | Whether neighborhood rate applied |
| `code` | Text | Six-character demo code |
| `txSignature` | Text or empty | If on-chain spend was sent |
| `chainStatus` | Text | `off`, `pending`, or `sent` |
| `createdAt` | Time | When redeemed |

**Table choice:** either one new DynamoDB table for unlocks + redemptions, or two small tables. Prefer whatever keeps Pierre’s existing table pattern (id key, on-demand). Exact names go in `TECHNICAL.md` when agreed.

## Proposed API (needs agreement)

| Route | Sends | Returns | Owner |
| --- | --- | --- | --- |
| `GET /deals` | `playerId` in the address | `partners` with `baseCost`, `unlockedCost`, `unlocked` (bool), `currentCost`, and distance omitted or optional | Pierre |
| `POST /deals/:partnerId/redeem` | `playerId` | `redemption`, `player` (new points total), error if insufficient points | Pierre |
| `POST /reports/:id/submit` (extend) | unchanged body | existing fields **plus** optional `unlock`: `{ partnerId, partnerName, baseCost, unlockedCost }` when proximity hit | Sarah calls a Pierre helper; response field agreed in `shared/` |

**New error codes (proposed):** `insufficient_points` (400 or 409 — pick one in TECHNICAL and stick to it). Reuse `not_found`, `validation_failed`, `internal`.

**Helper Pierre provides, Sarah calls on submit (after points award):**  
`checkDealUnlock(playerId, lat, lng, reportId) → unlock | null`  
Distance math lives with deals, not in Gemini labeling.

## Ownership

| Owner | Does | Does not |
| --- | --- | --- |
| **Pierre** | Partner seed file, unlock + redeem storage, `GET /deals`, `POST .../redeem`, spend/burn helper, Deals screens, Home link, optional map pins | Change report labeling or council content |
| **Sarah** | On successful report submit, call `checkDealUnlock` and include `unlock` on the response when present; show one unlock line on `RewardCard` | Own the deals routes or seed file |
| **Both** | Agree the contract (`shared/` + TECHNICAL) before either codes against it | Build merchant tools |

Wiring rule from `AGENTS.md` still holds: each may mount their own routes and Sarah may add the reward-card line and her submit wiring only.

## Phases (implementation branch, after core is done)

Do not start these phases until M4-style polish for P0/P1 is acceptable on a phone, unless both owners explicitly pull this stretch forward.

### Phase LD0. Contract and seed

1. Agree the proposed types, routes, and error code; update `shared/` and `docs/TECHNICAL.md`.
2. Add `partners.json` (or equivalent) with four demo pins and costs from this PRD.
3. Unit-test distance helper: inside 200 m → unlock candidate; outside → null.

**Checkpoint:** `npm run check` passes with new types; seed file reviewed by both.

### Phase LD1. Unlock on submit

1. Pierre: persist unlock; `checkDealUnlock` helper.
2. Sarah: call helper from submit; extend response; reward line when `unlock` is set.
3. Manual test with a fixed lat/lng next to `mill-coffee`.

**Checkpoint:** submitting a report at the coffee pin shows the unlock sentence on the reward card; a report far away does not.

### Phase LD2. Deals list and redeem

1. Pierre: `GET /deals`, `POST /deals/:partnerId/redeem`, deduct points, return code.
2. Pierre: `/deals` and redeem UI; Home LinkCard.
3. On-chain spend if time; otherwise database deduct with honest pending copy.

**Checkpoint:** player with an unlock redeems at neighborhood rate; balance drops; code shows; second redeem at that partner uses base cost until they unlock again.

### Phase LD3. Demo polish (only if time)

- Partner pins on the map.
- Highlight unlocked rows.
- Seed script / demo GPS cheat sheet for judges (which corner to stand on, or which mock coordinate to force).

**Checkpoint:** 30-second judge script works on a phone without narration crutches.

## Acceptance checks

Feature is done when all of these pass on a real phone (or Amplify HTTPS), not only on a laptop:

- [ ] Home shows a Local Deals entry; `/deals` lists all curated partners with base costs.
- [ ] Submitting a report within ~200 m of a partner unlocks that partner’s cheaper cost for the player and the reward card says so in plain language.
- [ ] Submitting farther away does not unlock; base costs unchanged.
- [ ] Unlocked cost is strictly lower than base; offer text is identical.
- [ ] Redeem at current cost reduces `points` by that amount and shows a demo code.
- [ ] Redeem with insufficient points fails with a clear message and does not change balance.
- [ ] One unlock per partner per player; redeem clears it.
- [ ] No secrets in `web/`; no mainnet; no merchant login.
- [ ] `npm run check` passes in every package touched.
- [ ] Screens work at 375 px with tap targets ≥ 44 px.

## Demo script (30 seconds)

1. Join (or use a seeded player) standing near the Mill Ave Coffee pin (or force demo coordinates).
2. Complete Report → reward shows unlock at 50 CIVIC instead of 100.
3. Open Local Deals → Mill Ave Coffee shows **50** highlighted.
4. Redeem → code appears, points drop, optional explorer link.
5. Line for judges: *"StreetCreds isn’t coupons. It’s proof you showed up for the block."*

## Risks

| Risk | Mitigation |
| --- | --- |
| Contract churn blocks Sarah/Pierre | Lock LD0 before UI; no drive-by `shared/` edits |
| GPS inaccurate indoors / expo hall | Demo cheat: allow a documented test coordinate or stand outside; say it out loud |
| Spend path races / double tap | Same idempotency spirit as awards: unique redemption id, reject double spend |
| Scope creep into merchant tools | This PRD’s non-goals; refuse self-serve |
| Feels like real money | Copy: "Demo deal · CIVIC on Solana devnet · not cash" |

## Open items to resolve in LD0 (not product direction)

1. Exact DynamoDB table name(s) and whether unlocks share a table with redemptions.
2. Whether on-chain spend is required for the Solana slide or database-only is enough for the stretch.
3. Final partner names/pins (fiction vs opted-in friends).
4. Unlock lifetime if the site stays up after the expo (`until redeemed` vs `until end of week`).

Product direction that is **not** open: curated partners, cheaper-cost proximity unlock, pretend commerce only.
