// The frame around every screen a joined player sees: header with points, the screen itself,
// and the bottom navigation. Screens render where <Outlet /> is.
import type { ReactNode } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router'
import { HomeIcon, LeaderboardIcon, MapIcon } from './icons'
import { getStoredPlayerId, usePlayer } from './player'
import { strings } from './strings'

const NAV_ITEMS: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/home', label: strings.nav.home, icon: <HomeIcon /> },
  { to: '/leaderboard', label: strings.nav.leaderboard, icon: <LeaderboardIcon /> },
  { to: '/map', label: strings.nav.map, icon: <MapIcon /> },
]

export function Layout() {
  // Nobody reaches a game screen without joining first.
  if (getStoredPlayerId() === null) {
    return <Navigate to="/join" replace />
  }
  return <Frame />
}

function Frame() {
  const { data: player, isError } = usePlayer()

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
      <header className="sticky top-0 z-10 flex min-h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4">
        <span className="text-lg font-bold tracking-tight text-ink">{strings.appName}</span>
        <div className="flex min-w-0 items-center gap-2 text-sm" aria-live="polite">
          {player ? (
            <>
              <span className="truncate text-muted">{player.nickname}</span>
              <span className="shrink-0 rounded-full bg-accent px-3 py-1 font-semibold tabular-nums text-on-accent">
                {strings.header.points(player.points)}
              </span>
            </>
          ) : (
            <span className="text-muted">{isError ? strings.errors.playerLoad : strings.header.loading}</span>
          )}
        </div>
      </header>

      {/* Bottom padding keeps the last line of a screen clear of the fixed navigation. */}
      <main className="flex-1 px-4 pb-24 pt-5">
        <Outlet />
      </main>

      <nav
        aria-label={strings.nav.label}
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex max-w-[480px]">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                    isActive ? 'text-accent' : 'text-muted'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
