// The frame around every screen a joined player sees: the wordmark and the CIVIC coin pill at
// the top, the screen itself, and the flat navigation bar at the bottom.
// Quest screens (/report, /council/...) are full-screen flows with their own Cancel, so the
// header and the navigation step aside there.
import type { ReactNode } from 'react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router'
import { BoardLink } from './BoardLink'
import { CoinIcon, HomeIcon, LeaderboardIcon, MapIcon } from './icons'
import { getStoredPlayerId, usePlayer } from './player'
import { strings } from './strings'
import { Wordmark } from './ui'

const NAV_ITEMS: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/home', label: strings.nav.home, icon: <HomeIcon /> },
  { to: '/leaderboard', label: strings.nav.leaderboard, icon: <LeaderboardIcon /> },
  { to: '/map', label: strings.nav.map, icon: <MapIcon /> },
]

/** Screens that are one quest from start to finish. */
function isQuestFlow(pathname: string): boolean {
  return pathname === '/report' || pathname === '/council' || pathname.startsWith('/council/')
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
  const quest = isQuestFlow(location.pathname)

  return (
    <div className="app-column flex flex-col">
      <BoardLink />
      {quest ? null : (
        <div className="app-header-wrap">
          <header className="app-header">
            <Wordmark className="text-2xl" />
            <div aria-live="polite">
              {player ? (
                <span className="coin-pill" aria-label={strings.header.coinLabel(player.points)}>
                  <CoinIcon />
                  <span aria-hidden="true">{strings.header.points(player.points)}</span>
                </span>
              ) : (
                <span className="text-sm text-muted">{isError ? strings.errors.playerLoad : strings.header.loading}</span>
              )}
            </div>
          </header>
        </div>
      )}

      {/* The key makes each screen a new element, so `screen-enter` fades it in on arrival. */}
      <main key={location.pathname} className={`${quest ? 'app-main app-main-quest' : 'app-main'} screen-enter`}>
        <Outlet />
      </main>

      {quest ? null : (
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
      )}
    </div>
  )
}
