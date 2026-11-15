# StreetCreds: setup guide for Sarah

This gets StreetCreds running on your laptop and connected to the team's AWS project. Allow about 30 minutes. The first half explains how the pieces fit, so the steps make sense; skip to "Step 1" if you only want the commands.

Where things stand on 2026-11-14: the project skeleton is built and live. The site shows four neighborhoods at 0 points and nothing else yet. The quests are yours to build.

| What | Address |
| --- | --- |
| Live site | https://main.d2wmqqpl5d9dv2.amplifyapp.com |
| Live API | https://4aw3zczoo8.execute-api.us-east-2.amazonaws.com |
| Repo | https://github.com/pierre-projects/streetcreds |

## How the pieces fit

StreetCreds has two programs and three places it stores things.

| Piece | What it is | Folder |
| --- | --- | --- |
| Web app | The pages a player sees on their phone. Built with React | `web/` |
| API | The program the web app talks to. It saves players and reports, asks Gemini to label photos, and awards points | `api/` |
| Database | Three tables: players, reports, awards | In AWS |
| Photo bucket | Where report photos are stored | In AWS |
| Contract | The agreed list of routes, data fields and constants. Both programs import it | `shared/` |

### Two copies of the app

There is a **live** copy, which anyone can open, and a **local** copy that runs only on your laptop while you work.

| | Web app | API |
| --- | --- | --- |
| Live | The Amplify address above | The API address above |
| Local | http://localhost:5173 | http://localhost:3001 |

The important part: **both copies use the same database tables and the same photo bucket**. There is no separate test database. A player or report you create while testing on your laptop shows up on the live site too. That is fine during the hackathon, but it is why your laptop needs to be signed in to AWS, and why we clear test data before judging.

### Words you will run into

- **AWS project.** Our space inside AWS. Everything StreetCreds uses lives in one project called Idea Launchpad, which Pierre owns and has invited you to.
- **AWS Builder ID.** Your personal AWS sign-in. You create it when you accept the invitation.
- **Region.** The AWS data center a project lives in. Ours is `us-east-2`. The project refuses every other region, so always use that one.
- **Lambda.** How the live API runs. AWS starts our API code when a request arrives and stops it afterwards; there is no server to look after.
- **DynamoDB.** The database. Each table holds one kind of item, looked up by its `id`.
- **S3 bucket.** File storage. Ours is private: nobody can open a photo with a plain link.
- **Presigned URL.** A temporary link that lets a phone upload or view one specific photo in the private bucket. The API creates it; it expires after a few minutes.
- **Amplify.** Hosts the live web app. Whenever something is merged into `main`, Amplify rebuilds the site by itself within a few minutes.
- **Environment variables and `.env` files.** Settings that differ between laptops and the live copy, such as the bucket name and the Gemini key. Locally they live in a file named `.env`, which Git ignores, so secrets never reach GitHub.
- **CORS.** A browser rule: a web page may only call an API that lists the page's address as allowed. Ours allows the live site and `localhost:5173`. If you see "blocked by CORS policy", the page is being served from an address that is not on the list.
- **Mock mode.** A switch in the web app (`VITE_USE_MOCKS=true`) that returns canned example data instead of calling the API. It lets you build a screen before the route behind it exists.

### How a report travels

This is your feature, so it helps to see the whole path once.

1. The player takes a photo. The phone shrinks it.
2. The phone asks the API for an upload link (`GET /upload-url`).
3. The phone uploads the photo straight to the bucket using that link. The photo never passes through the API.
4. The phone tells the API the photo is there (`POST /reports`). The API reads it, asks Gemini what it shows, and saves a draft report. No points yet.
5. The player checks the label, and the phone sends the location (`POST /reports/:id/submit`).
6. The API publishes the report and calls Pierre's `awardPoints` function, which adds the points.

Pierre provides `awardPoints`. Until his real version exists, there is a stand-in with the same name and the same inputs, so you never wait for him.

## Step 1. Install the tools

You need three things.

| Tool | Check it with | Should print |
| --- | --- | --- |
| Node.js 24 | `node -v` | `v24.` something |
| Git | `git --version` | Any recent version |
| AWS CLI | `aws --version` | `aws-cli/2.32` or newer |

On Windows, the AWS CLI installs with:

```bash
winget install Amazon.AWSCLI
```

On a Mac, download the installer from https://aws.amazon.com/cli/. Open a new terminal after installing, or the `aws` command will not be found.

## Step 2. Sign in to AWS

1. Find the invitation email from AWS and accept it. Check spam. It expires after 14 days.
2. Create an AWS Builder ID when it asks, using the same email address the invitation was sent to.
3. In a terminal, sign in:

```bash
aws login --region us-east-2
```

4. A browser page opens. Click the **Idea Launchpad** card.
5. Back in the terminal, if it asks about configuring AWS skills for coding agents, type `n`.
6. Save the region. Signing in does not do this on its own, and things fail later without it:

```bash
aws configure set region us-east-2
```

7. Check that it worked:

```bash
aws sts get-caller-identity
```

It should print an account number ending in `5373`.

The sign-in lasts a few hours. When a command says your session expired, run `aws login --region us-east-2` again.

## Step 3. Get the code

First time:

```bash
git clone https://github.com/pierre-projects/streetcreds.git
```

If you already cloned it:

```bash
git checkout main
```

```bash
git pull origin main
```

Then read the top of `docs/SARAH-PHASES.md` again. Your session opener and two checklist items changed on 2026-11-14.

## Step 4. Create your settings files

In the `api` folder, copy the example file:

```bash
cp .env.example .env
```

Open `api/.env` and set these three lines:

| Name | Value |
| --- | --- |
| `AWS_REGION` | `us-east-2` |
| `PHOTO_BUCKET` | `streetcreds-photobucket-8j4g7rfsrtiy` |
| `GEMINI_API_KEY` | Your key, see Step 6 |

In the `web` folder, copy the example file and leave it as it is:

```bash
cp .env.example .env
```

Neither `.env` file is ever committed. Git already ignores them.

## Step 5. Run it

You need two terminals, one for each program.

Terminal 1, in the `api` folder:

```bash
npm install
```

```bash
npm run dev
```

It should print `StreetCreds API running at http://localhost:3001`.

Terminal 2, in the `web` folder:

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. You should see "StreetCreds" and four neighborhoods at 0 pts. That page is a placeholder that proves the web app can reach the API.

## Step 6. Get a Gemini key

1. Go to https://aistudio.google.com and create an API key.
2. Put it in `api/.env` as `GEMINI_API_KEY`.
3. Send it to Pierre privately, so he can add it to the live API. Never put it in the repo, a commit message, or a group chat.

## How we work

The full rules are in `docs/CONTRIBUTING.md` and `AGENTS.md`. The short version:

- **Never commit to `main` directly.** Make a branch named `sarah/` plus the task, for example `sarah/upload-url`, and open a pull request.
- **Run `npm run check` before you push,** in each folder you changed.
- **Your folders:** `web/src/features/quests/` and `api/src/quests/`, plus the scripts `generate-council.ts` and `label-photos.ts` in `api/scripts/`.
- **Three places outside your folders that you may touch:** the one line in `api/src/index.ts` that connects your routes, the lines for your three screens in `web/src/app/App.tsx`, and the example data for your own routes in `web/src/app/mock/`.
- **`shared/` is fixed.** If something in it needs to change, say so and agree with Pierre first.
- **You don't deploy.** Pierre does, with `npm run deploy`. Never run `sam build`; it does not work with this project.
- **Camera and location only work over HTTPS or on `localhost`.** To test on your phone, merge to `main` and use the live site a few minutes later.

## What to build first

This is Phase 1 in `docs/SARAH-PHASES.md`, which also has the prompts to paste into your coding agent.

1. `GET /upload-url`: returns the upload link and the photo's name in the bucket.
2. `labelPhoto`: sends a photo to Gemini and gets back a category, a severity and a one-sentence description. Collect 10 test photos and tune the prompt until all 10 come back right.
3. The report screen, built in mock mode. This one waits until Pierre says his app shell is merged, because the mock data and the functions that call the API come from it.

Useful things that already exist in `api/src/lib/`:

- `ApiError`: write `throw new ApiError('not_found')` and the API returns the right error to the phone.
- `db` and `TABLES`: the database connection and the three table names.
- `requireEnv('PHOTO_BUCKET')` and `requireEnv('GEMINI_API_KEY')`: read those two settings, with a clear error if one is missing.

## If something goes wrong

| What you see | Likely cause | Fix |
| --- | --- | --- |
| "Your session has expired" or "Unable to locate credentials" | The AWS sign-in ran out | `aws login --region us-east-2` |
| "No region information found" | The region was never saved | `aws configure set region us-east-2` |
| The sign-in page says the region is not supported | A region other than `us-east-2` was used | Sign in again with `--region us-east-2` |
| "Environment variable PHOTO_BUCKET is not set" | `api/.env` is missing or incomplete | Redo Step 4 |
| The page says "Could not reach the API" | The API is not running | Start it in the `api` folder with `npm run dev` |
| "blocked by CORS policy" in the browser | The page is served from an address the API does not allow | Use http://localhost:5173 exactly, not `127.0.0.1` or another port |
| "Port 5173 is already in use" | The web app is already running in another terminal | Close the other one |
| Camera or location does nothing on your phone | The page is not on HTTPS | Use the live site, not your laptop's network address |

If you are stuck for more than ten minutes, send Pierre the exact error text.
