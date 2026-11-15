# New UI scripts

The two scripts that applied the dark game design to this repo (branch sarah/new-ui). Kept for reference.

- apply.py: edits existing files in place (index.css theme, strings.ts, icons.tsx, index.html, README credits). Each change must match exactly once or it stops, so it has already run and will refuse to run again on this branch.
- fonts.py: downloads the latin Inter (variable) and Russo One fonts from Google Fonts into web/public/fonts/.

Run both from the repo root: python3 web/scripts/new-ui/apply.py, then python3 web/scripts/new-ui/fonts.py.

Written with Claude (Anthropic).
