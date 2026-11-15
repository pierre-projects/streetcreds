# Accounts, profile and the street cred card

Status: implementation authorized by Pierre on 2026-11-15, with Sarah's agreement to the contract change and to edits in her folders. Branch: `pierre/accounts-profile-share`, based on `pierre/location-based-play`.

This note records what was decided and why. The exact routes, fields and checks are in `docs/TECHNICAL.md` sections 4, 5, 7 and 13 (F8 to F10).

## What it is for

A player used to be only an id saved on one phone. Clearing the browser or changing phones lost the player. There was no page about "me" and nothing to show anyone.

Three things were added:

1. **Optional Google sign-in.** A player's points and reports follow them to any device.
2. **A profile screen** (`/profile`), private to the player on the device.
3. **A street cred card** to share, for guests and signed-in players alike.

## Decisions

| Decision | Reason |
| --- | --- |
| Signing in is optional. Guests play everything, as before | Nobody should have to make an account to try the game |
| Google only. No email codes, no passwords | No email service to run, no password to keep, no new dependency: Hono's `verifyWithJwks` checks Google's token |
| Store Google's opaque account id and nothing else | Nothing personal to protect. The email, name and picture in Google's token are never read |
| `playerId` stays the game identity; an account only links to one player | The rule set in `docs/PRD-LOCAL-DEALS.md`, "Identity and future accounts". Points, reports, awards and deal unlocks did not move |
| A session is a random token; the table holds its SHA-256 | Reading the table never yields a working token, and there is no signing secret to deploy |
| A saved player's routes need their session. A guest is trusted by id, as before | Sign-in has to protect something. Guests keep the old behavior |
| A guest's progress is not merged into a saved player. The screen warns, then switches only on a yes | The tokens already minted to the guest's address cannot be moved, because its key was discarded |
| The profile shows only the player on the device | A public list of one person's report spots shows where they walk. The share card is the public part, and it names nothing more exact than a neighborhood |

## The three ways in

All on the join screen.

- **Play as a guest.** Nickname, then location. Unchanged.
- **Continue with Google, new person.** Google first, then the same form. The player is created already saved (`POST /players` with `credential`).
- **Continue with Google, returning person.** Straight to `/home` as their saved player. No location is asked for.

A guest can also save their player later, from the profile.

## What is stored

| Where | What |
| --- | --- |
| `streetcreds-accounts` | `google:{sub}` (Google's id for the account), a uuid `accountId`, the `playerId` it owns, when it was made |
| `streetcreds-sessions` | The SHA-256 of a session token, the `playerId`, when it began, when it ends (90 days). Rows delete themselves |
| `streetcreds-players` | One new field, `accountId`: the account's uuid, or null for a guest |
| The player's browser | `streetcreds.playerId` as before, and `streetcreds.session` for a signed-in player |

Nothing else. No email address, name or picture is stored or logged.

## For anyone adding a route

A route that takes a player id calls `requirePlayer(c, playerId)` from `api/src/players/auth.ts` and uses the player it returns. It answers `404` for an unknown player and `401` for a saved player without their session. Do not call `getPlayer` and decide for yourself.

## Setting it up (humans only, AGENTS.md rule 8)

Until these are done, no sign-in control shows and the game runs as guest-only.

1. In the Google Cloud console, create an OAuth client of type "Web application". Add every address the site is served from as an authorized JavaScript origin: `https://streetcreds.app`, `https://www.streetcreds.app`, the Amplify address, and `http://localhost:5173`.
2. Put the client id in `api/.env` as `GOOGLE_CLIENT_ID` and in `web/.env` as `VITE_GOOGLE_CLIENT_ID`. It is public, not a secret.
3. Deploy the API with the client id. This creates the two tables and lets the browser send the `authorization` header. Add `GoogleClientId=<client id>` to the `parameter_overrides` line in `api/samconfig.toml`, beside the values already there, then run `npm run deploy` in `api/`. Do not pass `--parameter-overrides` on the command line by itself: check first that it does not replace the saved values, which include the Gemini key and the Solana settings.
4. Set `VITE_GOOGLE_CLIENT_ID` in the Amplify console and push, so the site rebuilds.

## Known limits

- Google's button can fail inside an in-app browser (a link opened from a social app). Guests are not affected. The message says to open the site in the phone's own browser.
- A guest id can still be used, and saved to a Google account, by whoever knows it. That is the same trust as before; saving the player is what closes it.
- The shared link has no preview image yet. The picture travels as the shared PNG.
- Google draws its button 40 px tall. The app scales it to 44 px to meet the tap-target rule.
