# StreetCreds: GitHub rules

How Sarah, Pierre and their coding agents use Git and GitHub in this repo. Follow these and `main` always works, nobody loses work, and no key ever leaks.

## The ten rules

1. **`main` always works.** Amplify builds the live site from `main`, so a broken `main` is a broken demo.
2. **Never commit straight to `main`.** All code goes through a branch and a pull request. (Docs-only fixes are the one exception, see below.)
3. **One branch per task, named `sarah/…` or `pierre/…`.**
4. **Pull before you start, every time.**
5. **Small pull requests, merged within a few hours.** A branch that lives all day will conflict.
6. **Run `npm run check` before you push.** Do not open a pull request that fails it.
7. **Stay in your own folders.** Changes to `shared/` or the other person's folders need a yes from them first.
8. **Never commit a secret.** No keys, no `.env`, no treasury file. If one slips in, follow "If a secret gets committed" right away.
9. **Never force-push, and never rewrite history on `main`.**
10. **Nothing is committed after the submission deadline.** sunhacks rules say projects cannot be edited after hacking time.

## Branches

| Rule | Example |
| --- | --- |
| Name: owner, slash, short task in lowercase with hyphens | `sarah/report-upload`, `pierre/leaderboard-screen` |
| One task per branch | Not `pierre/phase-2-everything` |
| Always branch from an up-to-date `main` | See the daily loop below |
| Delete the branch after it merges | GitHub offers a button on the merged pull request |

## Daily loop

Start a task:

```bash
git checkout main
git pull origin main
git checkout -b sarah/report-upload
```

Save work as you go (commit often, it's free):

```bash
git add -A
git commit -m "Add presigned upload URL route"
```

Before pushing, bring in whatever landed on `main` and check everything:

```bash
git pull origin main
npm run check
git push -u origin sarah/report-upload
```

Then open a pull request on GitHub, or:

```bash
gh pr create --fill
```

After it merges:

```bash
git checkout main
git pull origin main
git branch -d sarah/report-upload
```

## Commit messages

- Start with a verb in the present tense, capitalized, no period: `Add`, `Fix`, `Update`, `Remove`, `Rename`.
- Say what changed in 60 characters or fewer. Add a body only when the "why" is not obvious.
- One logical change per commit.

| Good | Bad |
| --- | --- |
| `Add POST /reports draft route` | `stuff` |
| `Fix double award on fast double tap` | `fixed bug` |
| `Update leaderboard to refresh every 4 seconds` | `wip wip wip` |

When an AI agent wrote most of a commit, keep the co-author line it adds. It is part of crediting AI tools, which the hackathon rules require.

## Pull requests

- **Title:** same style as a commit message.
- **Description, three lines:** what it does, how to test it, and which boxes in your phases file ([SARAH-PHASES.md](SARAH-PHASES.md) or [PIERRE-PHASES.md](PIERRE-PHASES.md)) it completes.
- **Size:** aim for something the other person can read in five minutes. If it's bigger, split it.
- **Review:** the other person skims it and approves. This is a quick sanity check, not a debate. If they are busy for more than 15 minutes and the change is only in your own folders, merge it yourself and tell them.
- **Merge with "Squash and merge"**, so `main` gets one clean commit per pull request.
- **Never merge a pull request that fails `npm run check`.**

A pull request **must** wait for the other person's yes when it touches any of these:

- `shared/` (the contract)
- the other person's folders
- `api/src/index.ts` or `api/src/lib/`
- `api/template.yaml` or `amplify.yml`
- this file, `AGENTS.md` or `TECHNICAL.md`

**Docs-only exception:** ticking boxes in `PHASES.md`, `SARAH-PHASES.md` or `PIERRE-PHASES.md`, adding a line to the README Credits, or fixing a typo can be committed straight to `main`. Pull first.

## Who owns what

| Owner | Paths |
| --- | --- |
| Sarah | `web/src/features/quests/`, `api/src/quests/`, `api/scripts/generate-council.ts` |
| Pierre | `web/src/features/players/`, `web/src/app/`, `api/src/players/`, `api/src/points/`, `api/template.yaml`, `amplify.yml` |
| Both, agree first | `shared/`, `api/src/index.ts`, `api/src/lib/` |

Staying in your own folders is what keeps merge conflicts rare.

## Merge conflicts

1. Don't panic and don't force anything. Nothing is lost.
2. Run `git pull origin main` on your branch. Git marks the conflicting files.
3. Open each one and look for the `<<<<<<<`, `=======` and `>>>>>>>` markers. Keep the right lines from both sides and delete the markers.
4. If the conflict is in the other person's code or in `shared/`, ask them before choosing.
5. Run `npm run check`, then `git add -A` and `git commit`.

To back out of a pull that went wrong, before committing: `git merge --abort`.

## Never commit these

`.gitignore` already blocks them. Do not work around it with `git add -f`.

| What | Why |
| --- | --- |
| `.env` and any `.env.*` except `.env.example` | Holds the Gemini key and the Solana treasury secret |
| `api/samconfig.toml` | Holds the same secrets for deploys |
| The treasury keypair file, `*.pem`, `*.key` | Private keys |
| `node_modules/`, `dist/`, `.aws-sam/` | Generated; huge and pointless in Git |
| Real photos of people, faces or license plates | Privacy. Test photos should show the problem only |

Before every commit, glance at `git status`. If a file you don't recognize is listed, find out what it is first.

## If a secret gets committed

Deleting the file in a new commit is **not** enough. The key is still in the history, and this repo will be public for judging.

1. **Tell the other person immediately.**
2. **Kill the key first.** Gemini: delete it in Google AI Studio and make a new one. Solana: run the setup script again for a new treasury and mint. AWS: deactivate the access key in the AWS console.
3. Put the new key in `api/.env` and `api/samconfig.toml`, and redeploy.
4. Only then remove the file from the repo, in a normal commit.

A dead key in the history is harmless. A live one is not.

## Coding agents and Git

Agents (Cursor, Claude Code and others) follow [AGENTS.md](../AGENTS.md) and these rules as well:

- An agent may create branches and make commits on **your** branch when you ask.
- An agent must **not** push, merge, deploy, force-push, delete branches or change Git settings without you saying yes to that exact command.
- Read the diff before you commit agent-written code: `git diff` for unstaged changes, `git diff --staged` for staged ones. You are responsible for what goes in under your name.
- If an agent changed files outside your folders, undo those changes with `git restore <file>` before committing.

## Releases and the deadline

- Deploys to AWS happen from `main` only, after the pull request is merged.
- At each checkpoint in PHASES.md that passes on a phone, tag it so there is always a known-good version to go back to:

```bash
git tag checkpoint-2
git push origin checkpoint-2
```

- To return the live site to a known-good version, do not rewrite history. Revert the bad merge with `git revert <commit>` and push.
- Before the deadline: make sure the repo is public, the README Credits are complete, and everything is merged. Tag the final commit `submission`. **After the deadline, commit nothing.**

## Quick reference

| I want to… | Command |
| --- | --- |
| See what changed | `git status` then `git diff` |
| Undo changes to one file (not yet committed) | `git restore path/to/file` |
| Unstage a file | `git restore --staged path/to/file` |
| Fix the last commit message (not yet pushed) | `git commit --amend -m "New message"` |
| Undo the last commit but keep the changes (not yet pushed) | `git reset --soft HEAD~1` |
| Undo a commit that is already on `main` | `git revert <commit>` |
| See recent history | `git log --oneline -10` |
| Switch tasks without committing | `git stash`, and later `git stash pop` |

If you are about to type `--force`, `reset --hard` or `rebase` on anything shared: stop and ask the other person first.
