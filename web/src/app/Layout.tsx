// The frame around every screen a joined player sees: header with points, the screen itself,
// and the bottom navigation. Screens render where <Outlet /> is.
import type { ReactNode } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router'
import { BoardLink } from './BoardLink'
import { HomeIcon, LeaderboardIcon, MapIcon } from './icons'
import { getStoredPlayerId, usePlayer } from './player'
import { strings } from './strings'
import { Badge, LogoMark } from './ui'

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
    <div className="app-column flex flex-col">
      <BoardLink />
      <header className="app-header">
        <span className="app-brand"><LogoMark />{strings.appName}</span>
        <div className="flex min-w-0 items-center gap-2 text-sm" aria-live="polite">
          {player ? (
            <>
              <span className="truncate text-muted">{player.nickname}</span>
              <Badge>
                {strings.header.points(player.points)}
              </Badge>
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
        className="app-nav"
      >
        <ul className="mx-auto flex max-w-[480px]">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className="app-nav-link"
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
