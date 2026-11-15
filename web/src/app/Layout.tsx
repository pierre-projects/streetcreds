// The frame around every screen a joined player sees: floating frost header with points,
// the screen itself, and the floating pill navigation. Screens render where <Outlet /> is.
import type { ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { NEIGHBORHOODS } from '../../../shared/constants'
import type { NeighborhoodId } from '../../../shared/types'
import { BoardLink } from './BoardLink'
import { HomeIcon, LeaderboardIcon, MapIcon } from './icons'
import { getStoredPlayerId, usePlayer } from './player'
import { strings } from './strings'
import { LogoMark } from './ui'

const NAV_ITEMS: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/home', label: strings.nav.home, icon: <HomeIcon /> },
  { to: '/leaderboard', label: strings.nav.leaderboard, icon: <LeaderboardIcon /> },
  { to: '/map', label: strings.nav.map, icon: <MapIcon /> },
]

function neighborhoodName(id: NeighborhoodId): string {
  return NEIGHBORHOODS.find((n) => n.id === id)?.name ?? id
}

export function Layout() {
  // Nobody reaches a game screen without joining first.
  if (getStoredPlayerId() === null) {
    return <Navigate to="/join" replace />
  }
  return <Frame />
}

function Frame() {
  const { data: player, isError } = usePlayer()
  const location = useLocation()
  const radar = location.pathname === '/home'

  return (
    <div className="app-column flex flex-col">
      <BoardLink />
      <div className="app-header-wrap">
        <header className="app-header">
          <span className="app-brand"><LogoMark />{strings.appName}</span>
          <div className="app-hud-meta" aria-live="polite">
            {player ? (
              <>
                <div className="app-hud-points">
                  <span className="app-hud-points-label">{strings.header.pointsLabel}</span>
                  <span className="app-hud-points-value">{strings.header.points(player.points)}</span>
                </div>
                <span className="app-hud-divider" aria-hidden="true" />
                <span className="app-hud-place">{neighborhoodName(player.neighborhood)}</span>
              </>
            ) : (
              <span className="text-muted">{isError ? strings.errors.playerLoad : strings.header.loading}</span>
            )}
          </div>
        </header>
      </div>

      <main className={radar ? 'app-main-radar' : 'app-main'}>
        <Outlet />
      </main>

      <nav aria-label={strings.nav.label} className="app-nav">
        <ul className="app-nav-inner">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="flex flex-1">
              <NavLink to={item.to} className="app-nav-link">
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
