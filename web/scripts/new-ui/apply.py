"""Applies the new StreetCreds design to files that already exist in the repo.
Run from the repo root. Every replacement must match exactly once, or the script stops."""
import pathlib
import sys

ROOT = pathlib.Path('.')


def edit(path, pairs):
    p = ROOT / path
    s = p.read_text()
    for old, new in pairs:
        n = s.count(old)
        if n != 1:
            sys.exit(f'{path}: expected 1 match, found {n}: {old[:70]!r}')
        s = s.replace(old, new)
    p.write_text(s)
    print('edited', path)


def append(path, text):
    p = ROOT / path
    p.write_text(p.read_text().rstrip('\n') + '\n' + text)
    print('appended', path)


# ---------------------------------------------------------------- icons
append('web/src/app/icons.tsx', '''
/** The CIVIC coin: a circle with a star, in Coin amber. */
export function CoinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 text-coin">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-on-coin)" strokeOpacity=".35" strokeWidth="1.5" />
      <path d="m12 6.8 1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5Z" fill="var(--color-on-coin)" />
    </svg>
  )
}

export function CameraIcon() {
  return (
    <Icon>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </Icon>
  )
}

/** A council agenda page. */
export function DocumentIcon() {
  return (
    <Icon>
      <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M9 11h6" />
      <path d="M9 15h6" />
    </Icon>
  )
}

/** The budget quest: where taxes go. */
export function PieIcon() {
  return (
    <Icon>
      <path d="M12 3a9 9 0 1 0 9 9h-9Z" />
      <path d="M15 3.5A9 9 0 0 1 20.5 9H15Z" />
    </Icon>
  )
}

export function TagIcon() {
  return (
    <Icon>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </Icon>
  )
}

export function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function ChevronRightIcon() {
  return (
    <Icon>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  )
}
''')

# ---------------------------------------------------------------- strings
edit('web/src/app/strings.ts', [
    ("""    points: (points: number) => `${points}`,
    loading: 'Loading…',""",
     """    points: (points: number) => `${points}`,
    coinLabel: (points: number) => `${points} CIVIC`,
    loading: 'Loading…',"""),
    ("""  comingSoon: {""",
     """  // The game design: Mayor Patch's lines and the new Home and Join screens.
  game: {
    home: {
      welcome: (nickname: string) => `Welcome back, ${nickname}.`,
      leading: (name: string) => `${name} is in first place. Keep it there.`,
      catchUp: (name: string, reports: number, place: number) =>
        `${reports === 1 ? 'One more report puts' : `${reports} more reports put`} ${name} in ${ordinal(place)} place.`,
      rankLeading: (total: number, ahead: number) => `1st of ${total} · ${ahead} points ahead`,
      rankBehind: (rank: number, total: number, behind: number) =>
        `${ordinal(rank)} of ${total} · ${behind} ${behind === 1 ? 'point' : 'points'} behind`,
      questsEyebrow: 'Quests',
      reportTitle: 'Report',
      reportBody: 'Snap a street problem',
      councilTitle: 'Council',
      councilBody: 'Read one item, answer one question',
      dealsTitle: 'Local Deals',
      dealsBody: 'Spend CIVIC at neighborhood spots',
      budgetTitle: 'Budget',
      budgetBody: 'See where $100 of taxes goes',
      soon: 'Soon',
      plus: (points: number) => `+${points}`,
      mapTitle: 'Live map',
      mapBody: (count: number) => (count === 1 ? '1 open report. Tap to explore.' : `${count} open reports. Tap to explore.`),
    },
    join: {
      mayor: "I'm Mayor Patch. Help me fix this town and I'll make it worth your while.",
      nickname: 'Nickname',
      teams: 'The four neighborhoods',
      start: 'Start playing',
      finePrint: 'No email, no password. Points are for fun and have no cash value.',
    },
  },

  comingSoon: {"""),
    ("""const yesNo = (value: boolean) => (value ? 'yes' : 'no')""",
     """const yesNo = (value: boolean) => (value ? 'yes' : 'no')

/** 1st, 2nd, 3rd, 4th, ... */
function ordinal(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}"""),
])

# ---------------------------------------------------------------- index.html
html = 'web/index.html'
edit(html, [
    ('<meta name="theme-color" content="#ff6700" />', '<meta name="theme-color" content="#0D0B0A" />'),
    ("""    <link rel="preload" href="/fonts/Outfit-400.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/Outfit-500.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/Outfit-700.woff2" as="font" type="font/woff2" crossorigin />""",
     """    <link rel="preload" href="/fonts/Inter-var.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/RussoOne-400.woff2" as="font" type="font/woff2" crossorigin />"""),
])

# ---------------------------------------------------------------- index.css
css = 'web/src/index.css'
p = ROOT / css
s = p.read_text()
start = s.index('@font-face {')
end = s.index('@theme static {')
s = s[:start] + '''@font-face {
  font-family: "Inter";
  src: url('/fonts/Inter-var.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Russo One";
  src: url('/fonts/RussoOne-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

''' + s[end:]
p.write_text(s)

edit(css, [
    ("""  --color-page: #ffffff;
  --color-surface: #ffffff;
  --color-line: rgb(10 10 10 / .5);
  --color-ink: #0a0a0a;
  --color-muted: #545454;
  --color-accent: #ff6700;
  --color-on-accent: #0a0a0a;
  --color-on-ink: #ffffff;
  --color-severity-low: #2e7d32;
  --color-severity-medium: #9a5b00;
  --color-severity-high: #c62828;
  --font-sans: "Outfit", "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif;""",
     """  /* Night, Card, Raised, Blaze orange, Signal red, Coin amber: the StreetCreds game palette. */
  --color-page: #0D0B0A;
  --color-surface: #1A1614;
  --color-raised: #26201C;
  --color-line: rgb(255 244 236 / .5);
  --color-ink: #FFF4EC;
  --color-muted: #B5A99F;
  --color-accent: #FF7A1A;
  --color-accent-soft: #FFB27A;
  --color-on-accent: #0D0B0A;
  --color-on-ink: #0D0B0A;
  --color-quest: #D62828;
  --color-on-quest: #FFF4EC;
  --color-coin: #FFB02E;
  --color-on-coin: #0D0B0A;
  --color-severity-low: #4CAF50;
  --color-severity-medium: #F2A900;
  --color-severity-high: #D62828;
  --font-sans: "Inter", "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif;
  --font-display: "Russo One", "Inter", system-ui, sans-serif;"""),
    ("""  --shadow-float: 0 8px 28px rgb(10 10 10 / .12);
  --surface-frost: rgb(255 255 255 / .82);
  --surface-frost-strong: rgb(255 255 255 / .92);""",
     """  --shadow-float: 0 8px 28px rgb(0 0 0 / .45);
  --surface-frost: rgb(26 22 20 / .82);
  --surface-frost-strong: rgb(26 22 20 / .94);"""),
    ("""  --radius-control: 14px;""", """  --radius-control: 12px;"""),
    ("""  .points-total { @apply text-display font-bold text-accent; overflow-wrap: anywhere; }""",
     """  .points-total { @apply font-display text-display text-coin; overflow-wrap: anywhere; }"""),
    ("""    background: color-mix(in srgb, var(--color-accent) 10%, white);""",
     """    background: color-mix(in srgb, var(--color-accent) 14%, var(--color-surface));"""),
    ("""  filter: grayscale(0.55) contrast(1.05) brightness(0.96);""",
     """  /* A dark map from the light OpenStreetMap tiles, so the pins and the chrome stand out. */
  filter: invert(1) hue-rotate(180deg) grayscale(0.55) brightness(0.85) contrast(0.95);"""),
    ("""  /* Leaderboard: frost rows that read as a live board, not a dense table. */""",
     """  /* ---- The game design (Night / Card / Raised, Russo One titles, flat bars) ---- */
  .app-header-wrap { @apply static px-4; padding-top: max(1rem, env(safe-area-inset-top)); }
  .app-header {
    @apply rounded-none border-0 bg-transparent px-0 py-0 shadow-none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  .coin-pill {
    @apply inline-flex min-h-10 items-center gap-2 rounded-control border border-ink/10 bg-surface px-3 font-display text-lg tabular-nums text-ink;
  }
  .app-nav { @apply bottom-0 px-0; }
  .app-nav-inner {
    @apply max-w-[480px] gap-0 rounded-none border-0 border-t border-ink/10 bg-page p-0 shadow-none;
    padding-bottom: env(safe-area-inset-bottom);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  .app-nav-link {
    @apply min-h-16 rounded-none border-t-2 border-transparent font-display text-[11px] uppercase tracking-[0.1em];
  }
  .app-nav-link[aria-current="page"] { @apply border-accent bg-transparent text-ink; }
  .app-main { @apply pb-24 pt-4; }
  .app-main-quest { @apply pb-8; padding-top: max(1rem, env(safe-area-inset-top)); }
  .rank-card {
    @apply flex min-h-11 items-center gap-4 rounded-card border border-accent bg-raised p-4 focus-visible:outline-2 focus-visible:outline-offset-4 outline-ink motion-safe:transition-transform motion-safe:active:scale-[0.99];
  }
  .rank-tile {
    @apply flex size-11 shrink-0 items-center justify-center rounded-control bg-coin font-display text-xl text-on-coin;
  }
  .quest-row {
    @apply flex min-h-11 items-center gap-4 rounded-card border border-ink/10 bg-surface p-4 text-ink hover:border-ink/25 focus-visible:outline-2 focus-visible:outline-offset-4 outline-ink motion-safe:transition-transform motion-safe:active:scale-[0.99];
  }
  .quest-row.is-locked { @apply opacity-70 hover:border-ink/10 active:scale-100; }
  .quest-icon { @apply flex size-12 shrink-0 items-center justify-center rounded-control; }
  .quest-points { @apply flex shrink-0 items-center gap-1.5 font-display text-lg tabular-nums text-coin; }
  .team-tile {
    @apply flex min-h-12 items-center justify-center rounded-control border border-ink/10 bg-raised px-3 text-center text-sm font-bold text-ink;
  }

  /* Leaderboard: frost rows that read as a live board, not a dense table. */"""),
])

# Light hairlines on a dark page: every "solid rgb(10 10 10 / x)" border becomes a warm white one.
s = p.read_text()
n = s.count('solid rgb(10 10 10 /') + s.count('border-bottom-color: rgb(10 10 10 /')
s = s.replace('solid rgb(10 10 10 /', 'solid rgb(255 244 236 /').replace(
    'border-bottom-color: rgb(10 10 10 /', 'border-bottom-color: rgb(255 244 236 /')
p.write_text(s)
print(f'index.css: {n} hairlines switched to light')

# ---------------------------------------------------------------- credits
edit('README.md', [
    ("""Outfit by Rodrigo Fuenzalida""",
     """The dark game design (palette, Mayor Patch, Home, Join and quest screens, chips and quest buttons) was designed by Sarah with Claude (Anthropic) and implemented with Claude (Anthropic).

Russo One by Jovanny Lemonad and Inter by Rasmus Andersson, both under the SIL Open Font License, self-hosted in web/public/fonts/.

Outfit by Rodrigo Fuenzalida"""),
])
print('done')
