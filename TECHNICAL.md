# StreetCreds: technical guide

This file is the implementation spec for StreetCreds: stack, data models, API contract, core functions, setup and build order. Rules for coding agents are in `AGENTS.md`. The product reasoning, demo script and risks are in the PRD (`PRD.md`, when it has been exported into the repo). Where this file and the PRD differ on an implementation detail, this file wins.

**The product in four lines.** A phone web app, no install and no login. A player joins with a nickname and a neighborhood. They earn points by completing quests: photograph a street problem (Gemini labels it), or read a short summary of a real city council item and answer one question. Points are minted as a token on Solana devnet, and neighborhoods compete on a live leaderboard.

**Priorities.** P0 must work for the demo, P1 is added once P0 works on a phone, P2 is built only when a human asks for it by name. Each route in section 5 and each milestone in section 10 carries its priority.

**Status on 2026-11-14:** only the contract in `shared/` exists (constants, data fields, API shapes). Everything else is still to build.

**Names.** The product is written StreetCreds. In code, resource names and storage keys it is `streetcreds`: the stack is `streetcreds`, the tables are `streetcreds-*`, and the stored player key is `streetcreds.playerId`. The site is planned for `https://streetcreds.app`. The points token keeps the symbol CIVIC.

**How far this was checked:** package versions were read from npm on 2026-11-14. The Gemini call shape, model ID and pricing were read from Google's docs the same day. The code blocks below are reference sketches. They were not compiled or run, so type-check them against the installed packages before relying on them.

## 1. Stack

Pin the major versions below. Several of these had major releases recently, so examples found online may be for older versions.

| Layer | Choice | Version | Notes |
| --- | --- | --- | --- |
| Language | TypeScript, `strict` on | 7.x | Same language in `web/`, `api/` and `shared/` |
| Runtime | Node.js | 24 | Lambda runtime `nodejs24.x` |
| Web framework | React + Vite | React 19, Vite 8 | Phone-first single-page app |
| Routing | React Router | 8.x | Eight routes, client-side only |
| Server state | TanStack Query | 5.x | Polling with `refetchInterval` |
| Styling | Tailwind CSS | 4.x | Through the `@tailwindcss/vite` plugin; CSS entry is `@import "tailwindcss";` |
| Map | Leaflet + react-leaflet | 1.9, 5.x | OpenStreetMap tiles, no API key |
| API framework | Hono | 4.x | One Lambda, adapter `hono/aws-lambda` |
| Validation | zod | 4.x | API side only |
| AWS SDK | AWS SDK for JavaScript v3 | 3.x | `client-dynamodb`, `lib-dynamodb`, `client-s3`, `s3-request-presigner` |
| AI | `@google/genai`, Interactions API | 3.x | Model `gemini-3.8-flash` (image input, structured output, free tier) |
| Chain | `@solana/web3.js` + `@solana/spl-token` | **1.x** and 0.4.x | Devnet. See the warning below |
| Infrastructure | AWS SAM | current | HTTP API, one Lambda, three DynamoDB tables, one S3 bucket |
| Web hosting | AWS Amplify Hosting | n/a | Builds `web/` from GitHub |
| Tests | Vitest | 5.x | Unit tests for pure functions |
| Local API runner | tsx + `@hono/node-server` | 4.x, 2.x | `api/src/local.ts` |

**Solana version warning.** `npm i @solana/web3.js` now installs 3.x, which is a different API built on `@solana/kit`. `@solana/spl-token` 0.4 requires web3.js `^1.95.5`. Always install `@solana/web3.js@1`.

**Gemini API warning.** Google's docs now call `generateContent` legacy and recommend the Interactions API (`client.interactions.create`), which needs `@google/genai` 2.3.0 or later. Use the Interactions API. Field names in it are snake_case (`mime_type`, `response_format`, `output_text`).

AWS region: `us-west-2` for everything.

## 2. Repo layout

No npm workspaces. `web/` and `api/` are separate packages. `shared/` holds dependency-free TypeScript that both import by relative path.

```
streetcreds/
  AGENTS.md  TECHNICAL.md  PRD.md  README.md
  amplify.yml
  .gitignore
  shared/                 the contract; already written
    constants.ts          neighborhoods, categories, points, limits
    types.ts              Player, Report, Award, CouncilItem
    api.ts                request and response types for every route, error codes
  web/
    package.json  vite.config.ts  tsconfig.json  index.html  .env.example
    src/
      main.tsx
      app/                          (Pierre)
        App.tsx                     routes
        Layout.tsx                  header with points, bottom nav
        api.ts                      fetch helper and typed endpoint functions
        player.ts                   stored player id, usePlayer()
        strings.ts                  every user-facing string, keyed
        mock/                       JSON fixtures with the API shapes
      features/
        players/                    (Pierre)
          JoinScreen.tsx  HomeScreen.tsx  LeaderboardScreen.tsx  MapScreen.tsx
          cityReport.ts             builds the "Copy city report" text
        quests/                     (Sarah)
          ReportScreen.tsx          capture, labeling, confirm, reward
          resizeImage.ts
          LocationPicker.tsx
          RewardCard.tsx
          CouncilListScreen.tsx  CouncilItemScreen.tsx
  api/
    package.json  tsconfig.json  template.yaml  .env.example
    samconfig.toml                  git-ignored, holds deploy parameters
    src/
      index.ts                      Hono app, exports `app` and `handler`
      local.ts                      local server with CORS
      lib/                          (both, agree first)
        env.ts  db.ts  errors.ts  geo.ts
      players/                      (Pierre)
        routes.ts                   POST /players, GET /players/:id, GET /leaderboard
        leaderboard.ts              pure aggregation
      points/                       (Pierre)
        awardPoints.ts
        solana.ts
      quests/                       (Sarah)
        reportRoutes.ts             upload URL, label, submit, list
        labelPhoto.ts
        findDuplicate.ts            P2
        councilRoutes.ts
        council.json                the checked council items
    scripts/
      solana-setup.ts               creates the treasury and the CIVIC mint
      generate-council.ts           drafts summaries for a human to check
      seed.ts                       demo data for development
```

`web/vite.config.ts` needs `server.fs.allow: ['..']` and `web/tsconfig.json` needs `"include": ["src", "../shared"]` so the relative imports of `shared/` work. `api/tsconfig.json` needs the same include.

## 3. Environment variables

| Name | Used by | Example | Secret |
| --- | --- | --- | --- |
| `VITE_API_URL` | web | `http://localhost:3001` or the deployed API URL | No |
| `VITE_USE_MOCKS` | web | `true` to serve fixtures from `app/mock/` | No |
| `AWS_REGION` | api | `us-west-2` (Lambda sets it; set it yourself locally) | No |
| `TABLE_PLAYERS` | api | `streetcreds-players` | No |
| `TABLE_REPORTS` | api | `streetcreds-reports` | No |
| `TABLE_AWARDS` | api | `streetcreds-awards` | No |
| `PHOTO_BUCKET` | api | from the stack output | No |
| `WEB_ORIGINS` | api | `http://localhost:5173,https://streetcreds.app,https://www.streetcreds.app,https://main.xxxx.amplifyapp.com` | No |
| `GEMINI_API_KEY` | api | from Google AI Studio | **Yes** |
| `GEMINI_MODEL` | api | `gemini-3.8-flash` | No |
| `SOLANA_MODE` | api | `off`, `per-player` or `shared` | No |
| `SOLANA_RPC_URL` | api | `https://api.devnet.solana.com` | No |
| `SOLANA_TREASURY_SECRET` | api | base64 of the 64-byte secret key | **Yes** |
| `CIVIC_MINT` | api | the mint address printed by `solana-setup.ts` | No |

`api/src/lib/env.ts` reads and validates all of these once with zod and exports a typed `env` object. Nothing else reads `process.env`. When `SOLANA_MODE` is `off`, the two Solana secrets may be empty.

Secrets live in `api/.env` (local) and `api/samconfig.toml` (deploy). Both are git-ignored. `.gitignore` must contain: `node_modules`, `dist`, `.aws-sam`, `.env`, `.env.*`, `!.env.example`, `samconfig.toml`, `*treasury*.json`.

## 4. Data models

`shared/` is the single source of truth, and its three files already exist. The listings below are copies for reading. If they ever differ from the files, the files win.

```ts
// shared/constants.ts
export const APP_NAME = 'StreetCreds';
export const NEIGHBORHOODS = [
  { id: 'downtown-tempe', name: 'Downtown Tempe' },
  { id: 'asu-campus', name: 'ASU Campus' },
  { id: 'north-tempe', name: 'North Tempe' },
  { id: 'south-tempe', name: 'South Tempe' },
] as const;
export const CATEGORIES = ['pothole', 'streetlight', 'graffiti', 'blocked-sidewalk', 'other'] as const;
export const SEVERITIES = ['low', 'medium', 'high'] as const;
export const POINTS = { 'report-new': 50, 'report-confirm': 20, council: 30, budget: 30 } as const;
export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;
export const REPORT_LIMIT_PER_HOUR = 5;
export const DUPLICATE_RADIUS_M = 30;
export const MAP_CENTER = { lat: 33.4255, lng: -111.94 } as const; // Tempe
```

```ts
// shared/types.ts
import type { CATEGORIES, NEIGHBORHOODS, POINTS, SEVERITIES } from './constants';

export type NeighborhoodId = (typeof NEIGHBORHOODS)[number]['id'];
export type Category = (typeof CATEGORIES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type QuestType = keyof typeof POINTS;

export interface Player {
  id: string;                    // uuid
  nickname: string;              // 2 to 20 characters, trimmed
  neighborhood: NeighborhoodId;
  points: number;                // running total, source of truth for the UI
  walletAddress: string | null;  // devnet public key; null unless SOLANA_MODE is per-player
  recentReportTimes: string[];   // ISO times of submitted reports in the last hour
  createdAt: string;             // ISO 8601 UTC
}

export interface Report {
  id: string;
  playerId: string;              // who created it
  photoKey: string;              // S3 key: reports/{playerId}/{uuid}.jpg
  lat: number | null;            // null while draft
  lng: number | null;
  category: Category;
  severity: Severity;
  description: string;           // one sentence from Gemini
  count: number;                 // 1 plus the number of merged confirmations
  status: 'draft' | 'open' | 'merged';
  createdAt: string;
  submittedAt: string | null;
}

export interface Award {
  id: string;                    // `${questType}#${refId}#${playerId}`, see awardPoints
  playerId: string;
  questType: QuestType;
  points: number;
  txSignature: string | null;
  chainStatus: 'off' | 'sent' | 'pending';
  createdAt: string;
}

export interface CouncilItem {
  id: string;
  title: string;
  summary: string;               // three sentences, plain language
  question: string;
  options: string[];             // three or four
  answerIndex: number;           // never sent to the client
  sourceUrl: string;             // the official agenda page
}

// API shapes
export type PublicReport = Report & { photoUrl: string };
export type CouncilItemView = Omit<CouncilItem, 'answerIndex'> & { answered: boolean };
export interface LeaderboardRow {
  neighborhood: NeighborhoodId;
  points: number;
  playerCount: number;
  topPlayers: { nickname: string; points: number }[]; // up to 3
}
```

`shared/api.ts` holds one request type and one response type per route (`CreatePlayerRequest`, `SubmitReportResponse` and so on), plus `ERROR_CODES` and `ApiErrorBody`. The API handlers and `web/src/app/api.ts` both import them, so the two sides cannot drift apart.

### Database models

Three DynamoDB tables, one item type each. Every table has the partition key `id` (string), no sort key and no indexes. The attribute names are exactly the field names of the TypeScript types, so an item read with the document client is already a valid `Player`, `Report` or `Award`. Store `null` fields as DynamoDB `NULL`; do not omit them.

**`streetcreds-players`** holds `Player`.

| Attribute | DynamoDB type | Value when created | Changed later by |
| --- | --- | --- | --- |
| `id` | S, partition key | uuid | Never |
| `nickname` | S | From the join form | Never |
| `neighborhood` | S | One of the four neighborhood ids | Never |
| `points` | N | `0` | `awardPoints` only, with an atomic `ADD` |
| `walletAddress` | S or NULL | Devnet public key, or NULL | Never |
| `recentReportTimes` | L of S | `[]` | Report submit |
| `createdAt` | S | Now, ISO 8601 UTC | Never |

```json
{
  "id": "0b6f3c1e-8a52-4d0e-9a57-2f4f1c7d9e10",
  "nickname": "Sam",
  "neighborhood": "asu-campus",
  "points": 130,
  "walletAddress": "<base58 devnet public key>",
  "recentReportTimes": ["2026-11-14T18:02:11.000Z"],
  "createdAt": "2026-11-14T17:40:03.000Z"
}
```

**`streetcreds-reports`** holds `Report`.

| Attribute | DynamoDB type | Value when created (draft) | Changed later by |
| --- | --- | --- | --- |
| `id` | S, partition key | uuid | Never |
| `playerId` | S | The player who took the photo | Never |
| `photoKey` | S | `reports/{playerId}/{uuid}.jpg` | Never |
| `category` | S | From Gemini | Submit, if the player corrected it |
| `severity` | S | From Gemini | Never |
| `description` | S | From Gemini | Never |
| `lat`, `lng` | N or NULL | NULL | Submit |
| `count` | N | `1` | Duplicate merge (P2), atomic `ADD` |
| `status` | S | `draft` | Submit sets `open` or `merged` |
| `createdAt` | S | Now | Never |
| `submittedAt` | S or NULL | NULL | Submit |

```json
{
  "id": "5d2a9b70-3c41-4f8e-b6a2-91e0c7f3a4d8",
  "playerId": "0b6f3c1e-8a52-4d0e-9a57-2f4f1c7d9e10",
  "photoKey": "reports/0b6f3c1e-8a52-4d0e-9a57-2f4f1c7d9e10/8f1c2d3e-4a5b-4c6d-8e7f-0a1b2c3d4e5f.jpg",
  "category": "pothole",
  "severity": "high",
  "description": "Deep pothole in the right lane near the crosswalk.",
  "lat": 33.4215,
  "lng": -111.934,
  "count": 1,
  "status": "open",
  "createdAt": "2026-11-14T18:01:40.000Z",
  "submittedAt": "2026-11-14T18:02:11.000Z"
}
```

**`streetcreds-awards`** holds `Award`.

| Attribute | DynamoDB type | Value when created | Changed later by |
| --- | --- | --- | --- |
| `id` | S, partition key | `{questType}#{refId}#{playerId}` | Never |
| `playerId` | S | The player paid | Never |
| `questType` | S | `report-new`, `report-confirm`, `council` or `budget` | Never |
| `points` | N | From `POINTS` | Never |
| `txSignature` | S or NULL | NULL | Set once the mint is sent |
| `chainStatus` | S | `pending`, or `off` when Solana is off | Set to `sent` with the signature |
| `createdAt` | S | Now | Never |

```json
{
  "id": "report-new#5d2a9b70-3c41-4f8e-b6a2-91e0c7f3a4d8#0b6f3c1e-8a52-4d0e-9a57-2f4f1c7d9e10",
  "playerId": "0b6f3c1e-8a52-4d0e-9a57-2f4f1c7d9e10",
  "questType": "report-new",
  "points": 50,
  "txSignature": null,
  "chainStatus": "pending",
  "createdAt": "2026-11-14T18:02:11.000Z"
}
```

**Every database call the app makes.** If a feature seems to need a call that is not in this table, stop and ask.

| Operation | Table | Call |
| --- | --- | --- |
| Create a player | players | `PutItem`, condition `attribute_not_exists(#id)` |
| Load a player | players | `GetItem` |
| Build the leaderboard | players | Paginated `Scan` |
| Add points | players | `UpdateItem`, `ADD #points :p`, `ReturnValues: 'ALL_NEW'` |
| Record a submitted report's time | players | `UpdateItem`, `SET #recentReportTimes = :times` |
| Save a draft report | reports | `PutItem` |
| Load a report | reports | `GetItem` |
| Submit a report | reports | `UpdateItem` with the condition `#status = :draft` |
| List open reports; find duplicates (P2) | reports | Paginated `Scan`, filter `#status = :open` |
| Raise a merged report's count (P2) | reports | `UpdateItem`, `ADD #count :one` |
| Create an award, once | awards | `PutItem`, condition `attribute_not_exists(#id)` |
| Mark an award sent | awards | `UpdateItem`, `SET #txSignature = :sig, #chainStatus = :sent` |
| Has this player earned this council item? | awards | `GetItem` on the deterministic id |

Table definitions for `api/template.yaml`. The other two tables are the same with their own names.

```yaml
PlayersTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: streetcreds-players
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - AttributeName: id
        AttributeType: S
    KeySchema:
      - AttributeName: id
        KeyType: HASH
```

### Storage summary

| Store | Name | Key | Holds |
| --- | --- | --- | --- |
| DynamoDB table | `streetcreds-players` | `id` (string) | `Player` |
| DynamoDB table | `streetcreds-reports` | `id` (string) | `Report` |
| DynamoDB table | `streetcreds-awards` | `id` (string) | `Award` |
| JSON file | `api/src/quests/council.json` | n/a | `CouncilItem[]`, bundled with the Lambda |
| S3 bucket | `PHOTO_BUCKET` | `reports/{playerId}/{uuid}.jpg` | Report photos, private |

All tables use on-demand billing and have no secondary indexes. Reads that need every item use a paginated `Scan` (follow `LastEvaluatedKey`). This is deliberate: the demo has a few hundred items at most.

DynamoDB rules for this project:

- Use `DynamoDBDocumentClient` from `@aws-sdk/lib-dynamodb` so items are plain objects.
- `status` and `count` are DynamoDB reserved words. Always alias attribute names in expressions (`#status`, `#count`) with `ExpressionAttributeNames`.
- Add points with an atomic update, never read-modify-write: `UpdateExpression: 'ADD #points :p'`, `ReturnValues: 'ALL_NEW'`.
- "Only once" writes use `ConditionExpression: 'attribute_not_exists(#id)'` and catch the error whose `name` is `ConditionalCheckFailedException`.

## 5. API contract

Base URL is `VITE_API_URL`. All bodies are JSON. The request and response types for every route are in `shared/api.ts`; use them on both sides. There is no login: the caller sends its `playerId`. Anyone can send someone else's id. That is accepted for the demo and must not be "fixed" with accounts.

Errors always look like this, with the matching HTTP status:

```json
{ "error": { "code": "validation_failed", "message": "Nickname must be 2 to 20 characters." } }
```

| Code | Status | When |
| --- | --- | --- |
| `validation_failed` | 400 | Body or query fails its zod schema |
| `not_found` | 404 | Player, report or council item does not exist |
| `already_submitted` | 409 | Report is not a draft any more |
| `already_awarded` | 409 | This player already earned this award |
| `not_street_problem` | 422 | Gemini says the photo shows no street problem |
| `rate_limited` | 429 | More than 5 reports in the last hour |
| `label_failed` | 502 | Gemini errored, timed out or returned invalid JSON |
| `internal` | 500 | Anything else. Log the cause, return a generic message |

`message` is written for the player and is safe to show on screen.

### Routes

| # | Route | Owner | Priority |
| --- | --- | --- | --- |
| 1 | `GET /health` | Pierre | P0 |
| 2 | `POST /players` | Pierre | P0 |
| 3 | `GET /players/:id` | Pierre | P0 |
| 4 | `GET /leaderboard` | Pierre | P0 |
| 5 | `GET /upload-url` | Sarah | P0 |
| 6 | `POST /reports` | Sarah | P0 |
| 7 | `POST /reports/:id/submit` | Sarah | P0 |
| 8 | `GET /reports` | Sarah | P0 (the map that reads it is P1) |
| 9 | `GET /quests/council` | Sarah | P1 |
| 10 | `POST /quests/council/answer` | Sarah | P1 |

Routes 3 and 7 are not in the PRD's first API table. They exist because the home screen needs to refresh points, and because the player must be able to correct the label before points are awarded.

**1. `GET /health`** returns `200 { "ok": true }`.

**2. `POST /players`**
Request: `{ "nickname": string, "neighborhood": NeighborhoodId }`.
Steps: trim the nickname and check 2 to 20 characters; check the neighborhood id; create `id` with `crypto.randomUUID()`; if `SOLANA_MODE` is `per-player`, set `walletAddress` to a new keypair's public key and discard the secret key (awards only need the address); write the player with `points: 0`.
Response: `201 { "player": Player }`.

**3. `GET /players/:id`** returns `200 { "player": Player }` or `404 not_found`.

**4. `GET /leaderboard`**
Response: `200 { "neighborhoods": LeaderboardRow[], "updatedAt": string }`.
Steps: scan all players; aggregate with the pure function `aggregateLeaderboard(players)`; always return all four neighborhoods, zeros included; sort by points descending, then by name.

**5. `GET /upload-url?playerId={id}`**
Steps: `404` if the player does not exist; build the key `reports/{playerId}/{uuid}.jpg`; presign a `PutObject` for that key with `ContentType: 'image/jpeg'`, expiring in 300 seconds.
Response: `200 { "uploadUrl": string, "photoKey": string }`.
The client must `PUT` the JPEG to `uploadUrl` with the header `Content-Type: image/jpeg`. A different content type fails the signature.

**6. `POST /reports`** (label the photo and save a draft; no points yet)
Request: `{ "playerId": string, "photoKey": string }`.
Steps:
1. `404` if the player does not exist. `400` unless `photoKey` starts with `reports/{playerId}/`.
2. Rate limit (P1): drop times older than one hour from `recentReportTimes`; if 5 or more remain, `429 rate_limited`.
3. `labelPhoto(photoKey)`. On failure `502 label_failed`. If `isStreetProblem` is false, `422 not_street_problem`.
4. Write a `Report` with `status: 'draft'`, `count: 1`, `lat` and `lng` null.

Response: `201 { "report": Report }`.

**7. `POST /reports/:id/submit`** (the player confirmed; publish it and award points)
Request: `{ "playerId": string, "lat": number, "lng": number, "category"?: Category }`.
Steps:
1. Load the report. `404` if missing or `playerId` differs. `409 already_submitted` if `status` is not `draft`.
2. Check `lat` is within -90 to 90 and `lng` within -180 to 180. If `category` is present, it replaces Gemini's.
3. P2 only: `findDuplicate(report)`. If it returns an open report `R`: set this report to `merged`, add 1 to `R.count`, and award `report-confirm` with `refId = R.id`. Respond with `R` and `"merged": true`. Until P2 is built, skip this step.
4. Set `status: 'open'`, `submittedAt` to now. Use a condition that `status` is still `draft` so a double tap cannot submit twice.
5. `awardPoints(playerId, POINTS['report-new'], 'report-new', report.id)`.
6. Append the current time to the player's `recentReportTimes`.

Response: `200 { "report": Report, "award": Award, "player": Player, "merged": boolean }`.

**8. `GET /reports`**
Response: `200 { "reports": PublicReport[] }`. Only `status: 'open'`, newest first, at most 200. `photoUrl` is a presigned `GetObject` URL that expires in 3600 seconds.

**9. `GET /quests/council?playerId={id}`**
Response: `200 { "items": CouncilItemView[] }`. Never include `answerIndex`. `answered` is true when the award `council#{itemId}#{playerId}` exists.

**10. `POST /quests/council/answer`**
Request: `{ "playerId": string, "itemId": string, "answerIndex": number }`.
Steps: `404` for an unknown player or item. If the answer is wrong, respond `200 { "correct": false, "award": null, "player": Player }`; the player may try again. If it is right, `awardPoints(playerId, POINTS.council, 'council', itemId)`; a second correct answer gets `409 already_awarded`.
Response when right: `200 { "correct": true, "award": Award, "player": Player }`.

## 6. Core functions

### `labelPhoto(photoKey)` (Sarah, `api/src/quests/labelPhoto.ts`)

Returns `{ isStreetProblem: boolean, category: Category, severity: Severity, description: string }`.

Steps: read the object from S3 as base64; send it with the prompt to Gemini and ask for JSON that matches the schema; parse and validate with zod; throw `ApiError('label_failed')` on any error or after 12 seconds.

```ts
import { GoogleGenAI } from '@google/genai';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }); // confirm the option name against the SDK types

const LABEL_JSON_SCHEMA = {
  type: 'object',
  properties: {
    isStreetProblem: { type: 'boolean' },
    category: { type: 'string', enum: [...CATEGORIES] },
    severity: { type: 'string', enum: [...SEVERITIES] },
    description: { type: 'string' },
  },
  required: ['isStreetProblem', 'category', 'severity', 'description'],
};

const object = await s3.send(new GetObjectCommand({ Bucket: env.PHOTO_BUCKET, Key: photoKey }));
const base64Jpeg = await object.Body!.transformToString('base64');

const interaction = await ai.interactions.create({
  model: env.GEMINI_MODEL,
  input: [
    { type: 'text', text: LABEL_PROMPT },
    { type: 'image', data: base64Jpeg, mime_type: 'image/jpeg' },
  ],
  response_format: { type: 'text', mime_type: 'application/json', schema: LABEL_JSON_SCHEMA },
});
const label = LabelSchema.parse(JSON.parse(interaction.output_text));
```

`LABEL_PROMPT`, to start from and tune against 10 test photos:

```
You are checking a photo sent to a city street-problem reporting game.
Decide whether it shows a problem in a public street, sidewalk or public space
that a city public works department could fix. A photo of a printed picture or
a screen showing such a problem counts.

Return JSON only.
- isStreetProblem: false if no such problem is visible (selfies, food, indoor
  scenes, pets, blank or unreadable photos).
- category: pothole (holes, cracks, broken road surface); streetlight (broken,
  leaning or dark streetlight or traffic signal); graffiti; blocked-sidewalk
  (a sidewalk blocked or made unusable by objects, plants, vehicles, scooters
  or damage); other (any other public street problem, such as dumped trash, a
  damaged sign or flooding).
- severity: low (cosmetic); medium (an inconvenience, or likely to get worse);
  high (a safety hazard right now).
- description: one plain sentence, at most 140 characters, describing only what
  is visible. Do not guess the location. Do not describe people, faces or
  license plates.
If isStreetProblem is false, use category "other", severity "low" and say in
the description what the photo shows instead.
```

### `awardPoints(playerId, points, questType, refId)` (Pierre, `api/src/points/awardPoints.ts`)

Returns `{ award: Award, player: Player }`. This is the only way points are created. `refId` is the thing the award is for (a report id or a council item id), and it makes the award id deterministic so the same award can never be paid twice.

Steps:
1. `awardId = \`${questType}#${refId}#${playerId}\``.
2. Put the `Award` with `chainStatus: 'pending'` (or `'off'` when `SOLANA_MODE` is `off`) and the condition `attribute_not_exists(#id)`. If the condition fails, throw `ApiError('already_awarded')`.
3. Atomic `ADD` of `points` on the player; keep the returned player.
4. If `SOLANA_MODE` is not `off`: call `mintPoints(...)` with a 10 second limit. On success, update the award with `txSignature` and `chainStatus: 'sent'`. On any failure, log it and leave `'pending'`. Never throw from this step: the points already count.
5. Return the award and the player.

**The stub.** With `SOLANA_MODE=off`, steps 1 to 3 are the whole function. Pierre ships this first so Sarah's quests are never blocked on Solana.

```ts
// api/src/points/solana.ts
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction, createMintToInstruction } from '@solana/spl-token';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export async function mintPoints(player: { id: string; walletAddress: string | null }, points: number): Promise<string> {
  const connection = new Connection(env.SOLANA_RPC_URL, 'confirmed');
  const treasury = Keypair.fromSecretKey(Buffer.from(env.SOLANA_TREASURY_SECRET, 'base64'));
  const mint = new PublicKey(env.CIVIC_MINT);

  // per-player: mint to the player's own token account. shared: mint to the treasury's and tag the player in a memo.
  const perPlayer = env.SOLANA_MODE === 'per-player' && player.walletAddress !== null;
  const owner = perPlayer ? new PublicKey(player.walletAddress!) : treasury.publicKey;
  const tokenAccount = getAssociatedTokenAddressSync(mint, owner);

  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(treasury.publicKey, tokenAccount, owner, mint),
    createMintToInstruction(mint, tokenAccount, treasury.publicKey, points),
  );
  if (!perPlayer) {
    tx.add(new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(`streetcreds:${player.id}:${points}`, 'utf8'),
    }));
  }
  return sendAndConfirmTransaction(connection, tx, [treasury], { commitment: 'confirmed' });
}
```

Notes:
- The treasury pays every fee and must be the mint authority. `solana-setup.ts` sets that up.
- The token has 0 decimals, so 50 points is the amount `50`.
- Each player's first award also creates their token account, which costs the treasury about 0.002 SOL of rent. 2 SOL covers several hundred players.
- The memo holds the player id only. Never put a nickname on chain.
- Explorer link: `https://explorer.solana.com/tx/{txSignature}?cluster=devnet`.

### `findDuplicate(report)` (Sarah, P2)

Scan `open` reports with the same category; return the nearest one within `DUPLICATE_RADIUS_M` by `haversineMeters`, or null. `haversineMeters(a, b)` lives in `api/src/lib/geo.ts` and is a pure function with tests.

### `aggregateLeaderboard(players)` (Pierre)

Pure function from `Player[]` to `LeaderboardRow[]`. All four neighborhoods present, top 3 players each, sorted as in route 4. Has tests.

## 7. Frontend

### Screens

| Path | Screen | Owner | Data |
| --- | --- | --- | --- |
| `/` | Redirect to `/join` or `/home` | Pierre | stored player id |
| `/join` | Nickname and neighborhood | Pierre | `POST /players` |
| `/home` | Points, neighborhood rank, quest cards | Pierre | `GET /players/:id`, `GET /leaderboard` |
| `/report` | Report quest, one screen with steps | Sarah | routes 5, 6, 7 |
| `/council` | List of council items | Sarah | route 9 |
| `/council/:itemId` | Summary, question, result | Sarah | routes 9, 10 |
| `/leaderboard` | Neighborhood ranking | Pierre | route 4, every 4 seconds |
| `/map` | Pins for open reports | Pierre | route 8 |

### Shared pieces (Pierre builds first)

- **`app/api.ts`**: one `request<T>(path, init)` helper that prefixes `VITE_API_URL`, parses JSON, and throws `ApiError { status, code, message }` for non-2xx responses. One typed function per route. When `VITE_USE_MOCKS` is `true`, the functions return fixtures from `app/mock/` after a short delay.
- **`app/player.ts`**: the player id is stored in `localStorage` under `streetcreds.playerId`. `usePlayer()` loads the player with TanStack Query and refetches every 4 seconds. On `404`, clear the id and go to `/join`.
- **`app/strings.ts`**: every user-facing string, in one object keyed by name. Screens read from it. This is what makes the P2 Spanish toggle a small job.
- **`app/Layout.tsx`**: header with nickname and points, content area, bottom navigation (Home, Leaderboard, Map).
- After any response that contains `player`, write it into the query cache so the header updates without waiting for the next poll.

### Report quest (Sarah)

One screen driven by a state value: `idle`, `resizing`, `uploading`, `labeling`, `confirm`, `locating`, `submitting`, `reward`, `error`.

1. **Capture.** Use `<input type="file" accept="image/*" capture="environment">` behind a large button. It opens the rear camera on iOS Safari and Android Chrome with no permission code. Add a second input without `capture` labeled "Choose from gallery".
2. **Resize** (`resizeImage.ts`): `createImageBitmap(file)`, draw to a canvas so the longest side is at most 1280 px, export with `canvas.toBlob(cb, 'image/jpeg', 0.8)`.
3. **Upload.** `GET /upload-url`, then `fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: blob })`.
4. **Label.** `POST /reports`. Show a progress message; this takes a few seconds. On `not_street_problem`, show the message and offer "Try another photo".
5. **Confirm.** Show the photo, description, severity and a category picker preselected with Gemini's answer.
6. **Locate.** On "Submit", call `navigator.geolocation.getCurrentPosition` with `{ enableHighAccuracy: true, timeout: 10000 }`. If it is denied or times out, show `LocationPicker` (a small Leaflet map; tap to place the pin).
7. **Submit.** `POST /reports/:id/submit`.
8. **Reward** (`RewardCard`): points earned, new total, and by `award.chainStatus`: `sent` shows the explorer link, `pending` shows "On-chain confirmation pending", `off` shows nothing.

Camera capture and geolocation need HTTPS or `localhost`. They do not work on `http://192.168.x.x`, so test on a phone through the deployed Amplify URL.

### Map (Pierre)

- `react-leaflet` `MapContainer` centered on `MAP_CENTER`, zoom 14. Import `leaflet/dist/leaflet.css` and give the container an explicit height, or the map renders blank.
- Tiles: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` with the attribution `© OpenStreetMap contributors`. The attribution is required.
- One `CircleMarker` per report, radius `6 + 2 * Math.min(count, 6)`, color by severity. Popup: category, description, count, photo, and a "Copy city report" button.
- `cityReport.ts` builds the clipboard text (pure function, has a test):

```
Category: Pothole
Severity: High
Description: Deep pothole in the right lane near the crosswalk.
Location: 33.42150, -111.93400 (https://www.google.com/maps?q=33.42150,-111.93400)
Reports: 3
Photo: {photoUrl} (link expires in about an hour)
Reported with StreetCreds on 2026-11-14
```

### Look and feel

- Phone-first: design at 375 px wide, content column capped at 480 px and centered on larger screens.
- One primary action per screen, as a full-width button at least 44 px tall.
- Define colors once as CSS variables (background, surface, text, muted text, one accent, plus the three severity colors) and use only those.
- Show a loading state and an error state for every request. Error text comes from `ApiError.message`.
- Respect `prefers-reduced-motion` for the points animation.

## 8. Infrastructure

### API stack (`api/template.yaml`, AWS SAM, stack name `streetcreds`)

| Resource | Key settings |
| --- | --- |
| `AWS::Serverless::HttpApi` | CORS: origins from the `WebOrigins` parameter, methods `GET, POST, OPTIONS`, header `content-type` |
| `AWS::Serverless::Function` | Runtime `nodejs24.x`, `arm64`, memory 512 MB, timeout 29 s, one `HttpApi` event on `$default`. Build with `Metadata: BuildMethod: esbuild`, entry `src/index.ts`, format `cjs`, target `es2022` |
| Three `AWS::DynamoDB::Table` | Names from section 4, key `id` (S), `BillingMode: PAY_PER_REQUEST` |
| `AWS::S3::Bucket` | All public access blocked. CORS: methods `PUT, GET`, origins from `WebOrigins`, headers `*` |
| Function policies | `DynamoDBCrudPolicy` for each table, `S3CrudPolicy` for the bucket |
| Parameters | `WebOrigins`, `GeminiApiKey` (NoEcho), `GeminiModel`, `SolanaMode`, `SolanaTreasurySecret` (NoEcho), `CivicMint` |
| Outputs | `ApiUrl`, `PhotoBucketName` |

Notes:
- The HTTP API cuts requests off at 30 seconds, which is why the function timeout is 29 and the Gemini and Solana calls have their own shorter limits.
- CORS for deployed requests is handled by the HTTP API. Add Hono's `cors()` middleware only in `local.ts`. Doing both sends duplicate headers and browsers reject the response.
- `esbuild` must be in `api/devDependencies` for `sam build` to find it.
- `api/src/index.ts` exports `app` (for `local.ts` and tests) and `handler = handle(app)` from `hono/aws-lambda`.

### Web hosting (Amplify Hosting)

Connect the GitHub repo, choose the `main` branch, mark it as a monorepo with app root `web`. Set the environment variable `VITE_API_URL` to the `ApiUrl` output.

```yaml
# amplify.yml (repo root)
version: 1
applications:
  - appRoot: web
    frontend:
      phases:
        preBuild:
          commands:
            - nvm install 24
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
```

Add one rewrite rule in the Amplify console so client-side routes survive a refresh: source `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>`, target `/index.html`, type `200 (Rewrite)`.

After the first Amplify deploy, add its URL to `WebOrigins` and redeploy the API, or the browser will block every request.

**Custom domain.** The site is planned to live at `https://streetcreds.app`. In the Amplify console, open the app's custom domains page, add `streetcreds.app`, and create the DNS records it shows at the domain's registrar. Amplify issues the HTTPS certificate itself. `.app` domains load over HTTPS only, which the camera and location features need anyway. DNS can take from a few minutes to a few hours, so start it early and keep the default `amplifyapp.com` URL as the fallback for the demo. `WebOrigins` must list every address the site is served from: `https://streetcreds.app`, `https://www.streetcreds.app`, the Amplify URL and `http://localhost:5173`. The API keeps its default API Gateway URL; it does not need a custom domain.

## 9. Development guide

### What each person needs installed

| Tool | Who | Why |
| --- | --- | --- |
| Node.js 24 and Git | Both | Everything |
| AWS CLI v2, configured with `aws configure` for `us-west-2` | Both | Local API talks to the real tables and bucket |
| AWS SAM CLI | Whoever deploys | `sam build`, `sam deploy` |
| A Gemini API key from Google AI Studio | Sarah (shared with Pierre for deploys) | `labelPhoto` |
| A phone with a camera | Both | Every checkpoint is tested on a phone |

The Solana CLI is not required. `api/scripts/solana-setup.ts` does the same job with the JavaScript libraries, which is simpler on Windows.

### First-time setup, in order

1. **Scaffold (Pierre).**
   - `npm create vite@latest web -- --template react-ts`
   - In `web/`: `npm i react-router @tanstack/react-query leaflet react-leaflet` and `npm i -D tailwindcss @tailwindcss/vite @types/leaflet vitest`
   - In `api/`: `npm init -y`, then `npm i hono zod @google/genai @solana/web3.js@1 @solana/spl-token @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-s3 @aws-sdk/s3-request-presigner` and `npm i -D typescript tsx esbuild vitest @hono/node-server @types/node @types/aws-lambda`
   - Add `shared/`, `.gitignore` (section 3), the `amplify.yml` above, and the npm scripts in `AGENTS.md`.
2. **Contract (both).** `shared/` is already written. Read its three files together once. From here on they change only by agreement.
3. **First deploy (Pierre).** `sam build`, then `sam deploy --guided` with `SolanaMode=off` and empty Solana values. Save the answers to `samconfig.toml`. Note `ApiUrl` and `PhotoBucketName`.
4. **Local env (both).** Copy `api/.env.example` to `api/.env` and fill it from the stack outputs. Copy `web/.env.example` to `web/.env` with `VITE_API_URL=http://localhost:3001`.
5. **Hosting (Pierre).** Connect Amplify as in section 8. Add the Amplify URL to `WebOrigins` and redeploy. Start the `streetcreds.app` custom domain at the same time, because DNS takes a while.
6. **Solana (Pierre, 90-minute limit).** Run `npx tsx scripts/solana-setup.ts`. It must:
   - generate a treasury keypair and write it to a git-ignored file outside `src/`;
   - request a 2 SOL devnet airdrop (if that is rate-limited, print the address and tell the human to use https://faucet.solana.com);
   - create the CIVIC mint with `createMint(connection, treasury, treasury.publicKey, null, 0)`;
   - print `CIVIC_MINT` and the base64 `SOLANA_TREASURY_SECRET` for the human to paste into `api/.env` and `samconfig.toml`.

   Then set `SOLANA_MODE=per-player`, run one award locally and open the explorer link. If this is not working after 90 minutes, set `SOLANA_MODE=shared`; if that fails too, stay on `off` and move on.

### Daily loop

1. Pull `main`. Create a branch named `sarah/…` or `pierre/…`.
2. Run `npm run dev` in `api/` and in `web/`.
3. Build one route or one screen at a time. Write the pure function and its test first when there is one.
4. `npm run check` in each package you touched.
5. Open a small pull request. The other person skims it and merges. Do not let a branch live longer than a few hours.
6. Deploy when a checkpoint in section 10 is reached, then test it on a phone.

### Testing

Unit tests (Vitest) are required for these pure functions and nothing else:

| Function | Package | Cases that must be covered |
| --- | --- | --- |
| `aggregateLeaderboard` | api | Empty input, ties, a neighborhood with no players |
| `haversineMeters` | api | Same point is 0; two points about 30 m apart; about 1 km apart |
| Rate-limit helper (prune and count) | api | Times older than one hour are dropped; the fifth passes, the sixth fails |
| Request schemas | api | Nickname of 1, 2, 20 and 21 characters; an unknown neighborhood |
| `buildCityReport` | web | Output matches the format in section 7 |
| Resize size math | web | Landscape, portrait, and an image already under 1280 px |

Do not write tests that call Gemini, Solana or AWS. Check those by hand:

```bash
curl -s $API/health
curl -s -X POST $API/players -H 'content-type: application/json' -d '{"nickname":"Test","neighborhood":"asu-campus"}'
curl -s $API/leaderboard
```

The acceptance checks for each feature are in section 13. Run them on a real phone against the deployed site.

### Deploying and logs

- API: `npm run deploy` in `api/` (humans only). Logs: `sam logs --stack-name streetcreds --tail`.
- Web: push to `main`; Amplify builds it.
- Never log photo data, base64 strings or secrets. Log one JSON line per request: route, status, player id, milliseconds.

### Seed data

`npm run seed` writes a few players and reports whose ids start with `seed-`, and `npm run seed -- --clear` removes them. Both print what they will change and ask for a yes first. It is for development only. For the demo, the PRD calls for real reports collected on campus; clear the seed data before judging.

### When something breaks

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Browser says "blocked by CORS policy" on API calls | The site's origin is not in `WebOrigins`, or CORS is set in both the HTTP API and Hono | Add the origin and redeploy; keep `cors()` in `local.ts` only |
| The photo `PUT` returns 403 `SignatureDoesNotMatch` | The `Content-Type` header differs from the one that was signed | Send exactly `image/jpeg` |
| The photo `PUT` fails with a CORS error | Bucket CORS is missing `PUT` or the origin | Fix the bucket CORS in `template.yaml` |
| Camera or location does nothing on the phone | The page is on plain `http` | Use the Amplify URL |
| Map area is blank or grey | Leaflet CSS not imported, or the container has no height | Import the CSS; set a height |
| `ValidationException: ... reserved keyword` | `status` or `count` used directly in an expression | Alias with `ExpressionAttributeNames` |
| Solana types or imports do not exist | `@solana/web3.js` 3.x was installed | `npm i @solana/web3.js@1` |
| Airdrop fails with 429 | Devnet faucet rate limit | Use https://faucet.solana.com with the treasury address |
| Awards stay `pending` | Devnet is slow, or the treasury is out of SOL | Check the treasury balance; points still count, so carry on |
| `interactions` is undefined on the Gemini client | `@google/genai` is older than 2.3.0 | Update the package |
| Lambda times out at 29 s | Gemini or Solana hung | Check the per-call limits in section 6 are in place |

## 10. Build order

Each milestone ends with the checkpoint from the matching phase in `PRD.md`. Do not start a milestone until the one before it passes on a phone.

| # | Milestone | Sarah | Pierre | Done when |
| --- | --- | --- | --- | --- |
| M0 | Setup | Gemini key; read the contract in `shared/` together | Scaffold, first deploy, Amplify | The live URL opens on a phone and `GET /leaderboard` returns four rows of zeros |
| M1 | Skeleton | `GET /upload-url`; `labelPhoto` tuned on 10 photos in a script; report screen on mocks | Solana setup script; app shell; `POST /players`, `GET /players/:id`, `GET /leaderboard`; join and home screens; `awardPoints` stub | A player can join from a phone and is in the table |
| M2 | Core loop (P0) | Capture, resize, upload; `POST /reports`; `POST /reports/:id/submit`; confirm and reward screens; `GET /reports` | Wallet on join; real `awardPoints`; leaderboard screen | Photo to label to points to leaderboard works on a phone. **This is the cut line in the PRD** |
| M3 | Second quest and map (P1) | Council content checked by a human; council routes; council screens | Map and "Copy city report"; rate limit; ten awards in a row | Both quests work and the map shows pins |
| M4 | Polish | Own screens: loading, errors, small and large phones | Own screens: the same; backup video | Feature freeze. Bug fixes only after this |
| M5 | Submit | Devpost page | README with credits; architecture slide | Submitted, demo rehearsed twice |

P2 items (duplicate merge, budget quest, spending points, Spanish, streaks) are built only if M4 is finished early, and only when a human asks for one by name.

## 11. Conventions

- TypeScript `strict`, no `any`, no non-null `!` except on values just checked. Named exports only.
- Route handlers stay thin: parse with zod, call functions, shape the response. Logic that can be a pure function is one, in its own file.
- Throw `new ApiError(code, message)` anywhere; one Hono `onError` handler turns it into the error shape in section 5 and maps unknown errors to `internal`.
- Ids are `crypto.randomUUID()`. Times are ISO 8601 UTC strings from `new Date().toISOString()`.
- File names: `PascalCase.tsx` for components, `camelCase.ts` for everything else.
- UI text is plain and short, written to the player ("Take a photo of the problem"). No jargon such as "devnet" outside the reward card's explorer link.
- Council summaries must be checked against the official agenda by a person before they ship, and each one links to its source. `generate-council.ts` only drafts; it never writes to `council.json` without the human pasting the result.
- Tell players to photograph the problem, not people. Never show another player's exact location; only reports have locations.

## 12. Decisions already made

These are settled. Do not redesign them during the hackathon.

| Decision | Reason |
| --- | --- |
| No login; the player id is the only identity | Judges will not create accounts |
| One Lambda with a router, not one per route | One thing to deploy and debug |
| DynamoDB with scans and no indexes | A few hundred items; simplest correct code |
| Council items in a JSON file, not a table | Three static items that a human checked |
| Photos private, shown through presigned links that expire | No public bucket; the "Copy city report" photo link is temporary and says so |
| Points in DynamoDB are the source of truth; Solana mirrors them | The game keeps working when devnet is slow |
| Player wallets are addresses only; secret keys are discarded | Minting needs only the address, and nothing sensitive is stored |
| Spending points (P2) has no design yet | It needs a decision on how a player without a key spends; ask before building |
| Devnet only, token has no value | Hackathon demo; no real money anywhere |

## 13. Acceptance checks

A feature is done when its checks pass on a real phone against the deployed site. These mirror sections F1 to F7 of the PRD.

**F1. Join (P0)**
- Opening the URL on a phone shows the join screen in under 3 seconds.
- Nickname (2 to 20 characters) and neighborhood are required. No email or password.
- The player id is stored on the phone, so a refresh keeps the player signed in.
- With `SOLANA_MODE=per-player`, the new player has a `walletAddress`. The player never sees a seed phrase.

**F2. Report quest (P0)**
- The camera opens from the Report button on iOS Safari and Android Chrome.
- The photo is resized on the phone (longest side about 1280 px) before upload.
- `POST /reports` returns category, severity and description in under 8 seconds.
- The player can change the category before submitting.
- If location is denied, the player can pick the spot on a map.
- If Gemini fails or says the photo is not a street problem, the player sees a clear message and no points are awarded.

**F3. Points wallet (P0)**
- Each award is a token mint on Solana devnet, paid for by the treasury.
- The points total updates right away from the API response. The explorer link shows when `chainStatus` is `sent`.
- If devnet is slow or down, points still count and the screen says "On-chain confirmation pending".

**F4. Leaderboard (P0)**
- Shows each neighborhood's total points and its top 3 players.
- Updates within 5 seconds of a new award.
- The player's own neighborhood is highlighted.

**F5. Council quest (P1)**
- At least 3 real items from a current Tempe City Council agenda, summarized ahead of time and checked by a person.
- Each has one multiple-choice question. A correct answer earns points once per player.
- Each summary links to the official agenda.

**F6. Map (P1) and duplicate merge (P2)**
- The map shows one pin per open report, sized by `count`.
- "Copy city report" puts category, description, location and photo link on the clipboard.
- P2: a new report with the same category within about 30 meters of an open one is merged into it and raises its count.

**F7. Stretch (P2, only when asked)**
- Budget quest with one "your $100 in taxes" question from the published city budget.
- A pretend shop page where points can be spent.
- Spanish toggle for all screens and summaries.

## References

- Gemini models and the Interactions API: https://aistudio.google.com/docs/models , https://aistudio.google.com/docs/interactions , https://aistudio.google.com/docs/image-understanding , https://aistudio.google.com/docs/structured-output
- Gemini pricing (free tier for `gemini-3.8-flash`): https://aistudio.google.com/docs/pricing
- Lambda runtimes: https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
- Solana devnet faucet: https://faucet.solana.com
