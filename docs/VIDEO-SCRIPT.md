# Pitch and demo video script

The StreetCreds video for Devpost and the sunhacks playlist. It runs **2:00**, which fits Devpost's "2 minutes or less" and the 3-minute JFFVentures limit. It is built in Remotion: screen recordings of a populated StreetCreds inside a phone frame, plus motion graphics for the pitch parts.

Keep it honest. Claim only what is built. [TRACKS.md](TRACKS.md) lists what isn't built: Spanish, duplicate detection, streaks, tokens moving when you spend, an in-app QR code. None of these appear below. Keep it that way when you edit.

## Format

| Setting | Value |
| --- | --- |
| Canvas | 1920 × 1080, 30 fps, 3600 frames (2:00) |
| Phone recordings | 390 × 844 viewport (iPhone 14), recorded at 2× (780 × 1688), shown in a phone frame about 860 px tall |
| Type | The app's own fonts from `web/public/fonts`. Landing palette: ink `#0a0a0a`, paper `#ffffff`, yellow `#ffd60a` |
| Voice-over | About 240 words, about 2 words a second. Record the voice-over first, then lock each scene's length to it |
| Music | One royalty-free track, ducked under the voice. Credit it in the README Credits section |
| Captions | Burned in, bottom third. Many judges watch muted |

## The story in one line

A student reports a pothole, gets 50 CIVIC on Solana, and pushes ASU Campus past Downtown Tempe on the live leaderboard.

Every number in the video follows from that one beat, so the numbers have to add up (see [The populated StreetCreds](#the-populated-streetcreds)).

## Scenes

Frame ranges are at 30 fps. "VO" is the voice-over, "On screen" is what Remotion shows, and "Source" is the recording or asset that scene needs.

### 1. Hook — 0:00–0:09 (frames 0–270)

**VO:** "Ask a room of students who has ever reported a pothole, or read a city council agenda. Almost nobody raises a hand."

**On screen:** Black. White kinetic type, one line at a time: "Reported a pothole?" then "Read a council agenda?" A real Tempe agenda PDF scrolls past far too fast, blurred, with ordinance numbers flashing. Hard cut to the empty question: "Anyone?"

**Source:** A screen recording of the Nov 5 agenda (`sourceUrl` in `api/src/quests/council.json`), scrolled fast.

### 2. The turn — 0:09–0:17 (frames 270–510)

**VO:** "But people will grind for hours for points that mean nothing. So we aimed that energy at the street outside."

**On screen:** The landing headline builds word by word: "Potholes are **points**", with the yellow highlight sweeping across "points". The StreetCreds mark lands under it.

**Source:** `landing/index.html` headline, `web/public/brand/mark.png`.

### 3. Join — 0:17–0:27 (frames 510–810)

**VO:** "Open streetcreds.app on your phone. Pick a nickname, your location picks your neighborhood, and you're playing. Nothing to install, no account."

**On screen:** Phone frame slides in from the right. Recording: `/join`, type "Sam", share location, the app puts Sam in **ASU Campus**, land on `/home` with 0 points. A small URL chip above the phone reads `streetcreds.app`.

**Source:** Recording R1.

### 4. Report quest — 0:27–0:52 (frames 810–1560)

**VO:** "See a problem? Take a photo. Gemini checks it really is a street problem, then labels it: a pothole, high severity, one line on what's wrong. Selfies and food pics get turned away. Fifty points land, and one tap sends it to Tempe's own 311 form, so it reaches the people who fix it."

**On screen:**

- 0:27 Recording: `/report`, the camera opens, the photo is taken of a real pothole.
- 0:33 The label appears. Remotion overlays a callout beside the phone that types out the JSON Gemini returned: `category: "pothole"`, `severity: "high"`, `description: "Deep pothole in the right lane near the crosswalk."`, with a small Gemini wordmark.
- 0:41 Quick 1.5 s inset: a selfie gets the "not a street problem" message. Label it "Turned away" in the corner.
- 0:44 The reward card: **+50 CIVIC**, the points animating up from 0 to 50.
- 0:48 Tap **Send to Tempe 311**. The Tempe form opens, prefilled.

**Source:** Recordings R2 (report), R3 (selfie turned away), R4 (311 hand-off).

### 5. The leaderboard flips — 0:52–1:03 (frames 1560–1890)

**VO:** "Every point counts for your neighborhood. That pothole just put ASU Campus ahead of Downtown."

**On screen:** Full-width `/board` recording, or a Remotion rebuild of it for a cleaner move. ASU Campus sits second at 2,310, Downtown first at 2,340. Sam's 50 lands, ASU counts up to 2,360, and the two rows swap with a spring. A confetti burst in yellow, small and quick.

**Source:** Recording R5 on a 1920-wide window, or the leaderboard numbers from the demo data rebuilt in Remotion.

### 6. Points on Solana — 1:03–1:15 (frames 1890–2250)

**VO:** "Every award is a CIVIC token, minted on Solana devnet to the player's own address. Fees are close to zero, so every small action can be its own transaction."

**On screen:** Back on the phone, tap the explorer link on the reward card. Cross-fade to the Solana Explorer page for that transaction (devnet), zoom on the token amount and "Success". Caption: "Solana devnet".

**Source:** Recording R6, from a **real** award on the live site. A human plays the quest; nothing in this video is minted by a script.

### 7. Council quest — 1:15–1:30 (frames 2250–2700)

**VO:** "Council quests turn a forty-page agenda into three sentences and one question. This one's real, from Tempe's November 5 meeting."

**On screen:** Recording: `/council`, open **7C9: Flash bus funding agreement with ASU**. The three-sentence summary fills the screen; Remotion highlights "$491,406" in yellow. Tap the right answer. **+30 CIVIC**, points go 50 to 80.

**Source:** Recording R7.

### 8. The map — 1:30–1:42 (frames 2700–3060)

**VO:** "Every report goes on a shared map, right next to the City's own records: corners with no curb ramp, bus stops with no shelter, drinking fountains, food sites."

**On screen:** Recording: `/map`, starting zoomed out over Tempe, full of report pins. Turn on the City layers. Zoom into S Myrtle Ave where a player report sits beside the City's "no curb ramp" record. Tap the report to open its card.

**Source:** Recording R8.

### 9. Spend it locally — 1:42–1:47 (frames 3060–3210)

**VO:** "And you can spend your points at local spots."

**On screen:** Recording: `/deals`, Mill Ave Coffee, "Neighborhood rate unlocked". Short.

**Source:** Recording R9.

### 10. How it's built, and what's next — 1:47–2:00 (frames 3210–3600)

**VO:** "Gemini, AWS and Solana, built this weekend at sunhacks. Tempe is first. Phoenix, Mesa and Scottsdale are next. StreetCreds: your street, your score."

**On screen:**

- 1:47 The architecture diagram draws itself left to right: Phone → Amplify (web app) → API Gateway → Lambda (Hono) → DynamoDB and S3, with Gemini and Solana devnet branching off the Lambda.
- 1:53 The diagram shrinks to a corner. A map of Arizona with Tempe lit yellow, then dots appearing on Phoenix, Mesa and Scottsdale.
- 1:56 End card: `streetcreds.app`, the mark, "Sarah & Pierre · sunhacks 2026", the GitHub link.

**Source:** Motion graphics only.

## The populated StreetCreds

The recordings need a game that looks played: a full leaderboard, a map with pins, real photos. Demo mode serves exactly that, with no network and nothing written anywhere.

### Run it

Start the `streetcreds-web-demo` preview in `.claude/launch.json`, or run this from `web/`:

```bash
npm run dev -- --mode demo --port 5178
```

`--mode demo` reads `web/.env.demo` (git-ignored, no secrets), which sets `VITE_USE_MOCKS=true` and `VITE_MOCK_DEMO=true`. The data lives in `web/src/app/mock/demo.ts`. Reloading the page resets it, so every take starts from the same state.

- **Join (R1).** Joining needs a location inside ASU Campus. In Chrome DevTools, open Sensors and set a custom location of 33.4200, -111.9330.
- **Skip the join.** To land straight on a joined Sam, run `localStorage.setItem('streetcreds.playerId', 'demo-player-sam')` in the console and reload.
- **Photos.** Drop real photos into `web/src/app/mock/demo-photos/`, named after the report id (`demo-pothole-1.jpg`, `demo-sidewalk-curb.jpg`, ...). Git ignores them. A report with no photo shows a drawn placeholder labelled "Demo photo".

### Leaderboard, before Sam's first quest

Sam joins ASU Campus with 0 points. Points come in steps of 50 (report) and 30 (council), so every total is a multiple of 10.

| Rank | Neighborhood | Points | Players | Top players |
| --- | --- | --- | --- | --- |
| 1 | Downtown Tempe | 2,340 | 31 | Dee 310, Luis 260, Ana 210 |
| 2 | ASU Campus | 2,310 | 44 (with Sam) | Riya 280, Marcus 240, Kai 190 |
| 3 | South Tempe | 1,480 | 19 | Jo 220, Priya 170, Ken 150 |
| 4 | North Tempe | 960 | 12 | Talia 180, Ben 140, Rosa 90 |

After the report (scene 5), ASU Campus is 2,360 and first, and Sam has 50. After the council answer (scene 7), ASU Campus is 2,390 and Sam has 80. Do the report before the council quest: the council answer alone would tie the two at 2,340.

### Reports on the map

25 open reports over the four neighborhoods, each inside its neighborhood's game zone, timed over the last two days relative to when the page loads, so the map always reads as live:

| Category | Count | Notes |
| --- | --- | --- |
| Pothole | 8 | `demo-pothole-1` on Mill Ave is the hero pothole from scene 4 |
| Streetlight | 6 | Night photos read best |
| Blocked sidewalk | 6 | `demo-sidewalk-curb` on S Myrtle Ave sits beside the City's no-curb-ramp record and shows "Also in the City's survey", for scene 8 |
| Graffiti | 5 | |

Every report has a count of 1. Merging duplicates isn't built, so the demo doesn't suggest it.

### What to record where

Use demo mode for the board (scene 5), the map (scene 8) and the deals (scene 9). Record scenes 4, 6 and 7 on the live site, so the Gemini label and the explorer link are real. In demo mode the reward card says "On-chain confirmation pending" and has no explorer link.

Demo state lives in one browser tab and resets on reload, so a report sent from a phone tab won't move `/board` in another tab. For the flip in scene 5, rebuild the two rows in Remotion from the numbers above, or record the board in the same tab right after the report.

Put a small "Demo data" tag in the corner of every scene recorded in demo mode.

## Recording list

Record each one in a clean browser profile, at 390 × 844 with device scale 2, unless it says otherwise. Hide the cursor, or use a touch-dot overlay in Remotion.

| ID | Scene | Route | What to capture | Where |
| --- | --- | --- | --- | --- |
| R1 | 3 | `/join` → `/home` | Type "Sam", share location, placed in ASU Campus, land on home | Either |
| R2 | 4 | `/report` | Photo of a real pothole, the label appears, reward card +50 | Live, real phone |
| R3 | 4 | `/report` | A selfie turned away | Live, real phone |
| R4 | 4 | Reward card → Tempe 311 | Tap "Send to Tempe 311", the form opens prefilled | Live |
| R5 | 5 | `/board` | ASU passes Downtown | 1920 × 1080 window |
| R6 | 6 | Reward card → Solana Explorer | The devnet transaction page, "Success" | Live |
| R7 | 7 | `/council/2026-11-05-7c9-flash-bus` | Read, answer, +30 | Either |
| R8 | 8 | `/map` | Zoomed out, City layers on, zoom to S Myrtle Ave, tap a report | Either |
| R9 | 9 | `/deals/mill-coffee` | Neighborhood rate unlocked | Either |

Real-phone recordings: use the phone's own screen recorder, then crop the status bar in Remotion. Desktop recordings: Chrome DevTools device mode, or a Playwright script that records video at a fixed viewport, so retakes match frame for frame.

## Remotion layout

A suggested structure, in its own `video/` folder at the repo root so Remotion stays out of `web/` and `api/` (it is not in the TECHNICAL.md dependency list, so it gets its own `package.json`).

```
video/
  src/
    Root.tsx            one <Composition id="StreetCreds" durationInFrames={3600} fps={30} width={1920} height={1080} />
    timeline.ts         the scene table below, the single place the timing lives
    scenes/             Hook, Turn, Join, Report, Leaderboard, Solana, Council, Map, Deals, Close
    components/         PhoneFrame, KineticText, JsonCallout, PointsCounter, LeaderboardRows, ArchDiagram, Captions
  public/
    recordings/         R1.mp4 … R9.mp4
    voiceover.wav
    music.mp3
```

```ts
// video/src/timeline.ts
export const FPS = 30

export const SCENES = [
  { id: 'hook', from: 0, duration: 270 },
  { id: 'turn', from: 270, duration: 240 },
  { id: 'join', from: 510, duration: 300 },
  { id: 'report', from: 810, duration: 750 },
  { id: 'leaderboard', from: 1560, duration: 330 },
  { id: 'solana', from: 1890, duration: 360 },
  { id: 'council', from: 2250, duration: 450 },
  { id: 'map', from: 2700, duration: 360 },
  { id: 'deals', from: 3060, duration: 150 },
  { id: 'close', from: 3210, duration: 390 },
] as const // ends at frame 3600, 2:00
```

Each scene is a `<Sequence from={…} durationInFrames={…}>`. Recordings play with `<OffthreadVideo>` inside `PhoneFrame`. The counters (130 → 180 → 210, 2,310 → 2,360) use `interpolate` with an ease-out, and the leaderboard swap uses `spring`. Captions come from the voice-over script, one line per sentence, timed to the recorded voice.

## Full voice-over

For the recording session. About 240 words.

> Ask a room of students who has ever reported a pothole, or read a city council agenda. Almost nobody raises a hand.
>
> But people will grind for hours for points that mean nothing. So we aimed that energy at the street outside.
>
> Open streetcreds.app on your phone. Pick a nickname, your location picks your neighborhood, and you're playing. Nothing to install, no account.
>
> See a problem? Take a photo. Gemini checks it really is a street problem, then labels it: a pothole, high severity, one line on what's wrong. Selfies and food pics get turned away. Fifty points land, and one tap sends it to Tempe's own 311 form, so it reaches the people who fix it.
>
> Every point counts for your neighborhood. That pothole just put ASU Campus ahead of Downtown.
>
> Every award is a CIVIC token, minted on Solana devnet to the player's own address. Fees are close to zero, so every small action can be its own transaction.
>
> Council quests turn a forty-page agenda into three sentences and one question. This one's real, from Tempe's November 5 meeting.
>
> Every report goes on a shared map, right next to the City's own records: corners with no curb ramp, bus stops with no shelter, drinking fountains, food sites.
>
> And you can spend your points at local spots.
>
> Gemini, AWS and Solana, built this weekend at sunhacks. Tempe is first. Phoenix, Mesa and Scottsdale are next. StreetCreds: your street, your score.

## Before you upload

- [ ] Total length is 2:00 or less.
- [ ] Every claim is in the app today (check against [TRACKS.md](TRACKS.md), "Gaps to be honest about").
- [ ] The explorer link in scene 6 is from a real award, and it's the same one in the Devpost write-up.
- [ ] "Demo data" tag on the seeded scenes.
- [ ] No wallet secret, API key or `.env` file visible in any recording.
- [ ] Captions on.
- [ ] Music and Remotion credited in the README Credits section.
- [ ] Uploaded to YouTube, linked on Devpost, with a note on whether it can go in the sunhacks playlist.
