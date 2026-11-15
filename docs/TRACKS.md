# Prize tracks

Which sunhacks 2026 prizes StreetCreds enters, and what in the app earns each one. The prize list comes from the [Devpost page](https://sunhacks-2026.devpost.com/), read on Nov 15, 2026.

We enter a track only when a judge can see the sponsor's technology doing real work in the demo. Sponsor names go in the Devpost write-up with one line each on what they do.

## Tracks we enter

| Track | What the track asks for | What StreetCreds shows | Where it lives |
| --- | --- | --- | --- |
| **Best Overall** | Judged on originality, complexity, functionality and design | See [How we answer the judging criteria](#how-we-answer-the-judging-criteria) | The whole app |
| **Best Gaming** | A game | Two quests, points that land with an animation, a live neighborhood leaderboard, a big-screen board at `/board`, Local Deals to spend points on, and a share card for your street cred | `web/src/features/quests/`, `LeaderboardScreen.tsx`, `BoardScreen.tsx`, `DealsScreen.tsx`, `quests/share/` |
| **Best Diversity/Equality** | Wider, fairer access | Civic life without the jargon: a three-sentence plain-language summary of a real council item instead of a 40-page agenda. No account needed to play. The map shows the City's own ADA Transition Plan records, bus stops without a shelter, drinking fountains, park restrooms and community food sites, so accessibility gaps sit next to player reports | `api/src/quests/council.json`, `CityRecordsLayer.tsx`, `cityRecords.ts` |
| **[MLH] Best Use of Gemini API** | Gemini doing real work in the app | Gemini looks at every report photo and returns whether it shows a street problem, its category, severity and a one-line description, as structured JSON. Selfies and food photos are turned away. Gemini also drafts the council summaries and quiz questions from the agenda text | `api/src/quests/labelPhoto.ts`, `api/scripts/generate-council.ts` |
| **[MLH] Best Use of Solana** | A game or consumer app that relies on fast, cheap, frequent transactions | Every point award is minted as a CIVIC token on devnet to the player's own address, with an explorer link on the reward screen. Each quest is one small transaction, which only works because fees are near zero | `api/src/points/solana.ts`, `awardPoints.ts`, `RewardCard.tsx` |
| **Best Use of AWS** | A real AWS architecture | Amplify hosts the web app. API Gateway (HTTP API) sits in front of one Lambda running Hono. DynamoDB holds players, reports, awards and the rest of the app's data. Photos upload from the phone straight to S3 with a presigned URL. Everything is in one SAM template, and a script checks the live API has every route after each deploy | `api/template.yaml`, `amplify.yml`, `api/src/quests/s3.ts`, `api/scripts/check-live.ts` |
| **Audience Vote** | Something people at the expo can try | Scan the QR code, pick a nickname and play on your own phone in under two minutes. The `/board` view runs on a big screen at the table | `JoinScreen.tsx`, `BoardScreen.tsx` |

### Worth a line, if it fits

| Track | Why it might fit | Why we're not leading with it |
| --- | --- | --- |
| **[JFFVentures] Best Hack for the Future of Work** | Reports go straight to the City's 311 form with "Send to Tempe 311", so a report is useful to city staff and not only a game score | It is a civic app, not a work app. Needs a video of 3 minutes or less if we enter |
| **Best Mascot** | The logo pack gives the app a character | Only if we have a named mascot by judging |

## Tracks we skip

| Track | Why |
| --- | --- |
| [MLH] Best Domain Name from GoDaddy Registry | Our domain is `streetcreds.app`, and `.app` is a Google Registry domain, not a GoDaddy Registry one. We'd need a second domain from a GoDaddy Registry ending to qualify |
| [MLH] Build Your Hackathon A-Team with SpaceXSI | We use Cursor, but the raffle also needs a Grok Bot automation, and we have none |
| Rookie | For teams that are mostly freshmen. Enter only if that's true of us |
| Best Hardware | No hardware |
| Most Impractical | StreetCreds is meant to be practical |
| Maritime, MatLab, Tiny Fish, supermemory, Tiger Data, Vultr, MongoDB Atlas | We don't use these. Our data is in DynamoDB and our compute is on AWS |

## How we answer the judging criteria

- **Originality:** 311 apps exist, and so do civic quizzes, but no one makes them a neighborhood-versus-neighborhood game with on-chain points. Reports don't end in the game either: each one can be sent to Tempe's own 311 form.
- **Complexity:** three outside services working together (Gemini, AWS, Solana), most of them new to us this weekend. On top of that: location checks against the City of Tempe boundary, rate limits, a points ledger that keeps working if devnet is slow, and public City data on the map.
- **Functionality:** both quests go end to end, from photo or answer to points, token and leaderboard, and a judge checks it on their own phone. Run through both on the live site before judging.
- **Design:** phone-first, one action per screen, every tap target at least 44 px, points animate when they land, and motion is turned off for anyone who asks their device to reduce motion.

## Gaps to be honest about

The PRD promised a few things that aren't built. Don't claim them in the write-up or the video:

- **English and Spanish.** All text is English only.
- **Duplicate detection.** The data model has room for merged duplicates (`DUPLICATE_RADIUS_M`), but no code merges reports yet, and Gemini doesn't compare photos.
- **Streaks.** Not built.
- **Spending points.** Local Deals take points off the player's balance in the database. No token moves on Solana when you spend.

## Devpost checklist for tracks

- [ ] Opt in to: Best Overall, Best Gaming, Best Diversity/Equality, [MLH] Best Use of Gemini API, [MLH] Best Use of Solana, Best Use of AWS, Audience Vote
- [ ] Write-up names each sponsor technology and what it does (the "What StreetCreds shows" column above)
- [ ] Architecture slide for AWS, with Amplify, API Gateway, Lambda, DynamoDB and S3
- [ ] One devnet explorer link in the write-up, from a real award
- [ ] Video of 3 minutes or less if we enter JFFVentures
