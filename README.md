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

The phone uploads photos straight to S3 and sends everything else through the API. Only the Lambda talks to Gemini and Solana, so no key ever reaches the phone. Details and diagrams are in [TECHNICAL.md](TECHNICAL.md).

## Repo layout

```
streetcreds/
  PRD.md  TECHNICAL.md  AGENTS.md  README.md
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

## Credits

The sunhacks rules ask every project to credit the tutorials and AI tools it used. Add a line here whenever you follow a tutorial or generate a substantial part of the code.

- Planning documents, the shared contract in `shared/`, and this README were drafted with Claude (Anthropic).

## License

No license chosen yet.
