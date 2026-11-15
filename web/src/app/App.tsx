// Paths match docs/TECHNICAL.md section 7; /design is a temporary route outside that list.
//
// Sarah: the three lines marked "Sarah" are yours to change (report + council routes).
import { createBrowserRouter, Navigate } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { BoardScreen } from '../features/players/BoardScreen'
import { DealDetailScreen } from '../features/players/DealDetailScreen'
import { DealsScreen } from '../features/players/DealsScreen'
import { HomeScreen } from '../features/players/HomeScreen'
import { LeaderboardScreen } from '../features/players/LeaderboardScreen'
import { MapScreen } from '../features/players/MapScreen'
import { JoinScreen } from '../features/players/JoinScreen'
import { ProfileScreen } from '../features/players/ProfileScreen'
import { CouncilItemScreen } from '../features/quests/CouncilItemScreen'
import { CouncilListScreen } from '../features/quests/CouncilListScreen'
import { ReportScreen } from '../features/quests/ReportScreen'
import { Layout } from './Layout'
import { AboutPage } from './legal/AboutPage'
import { PrivacyPage } from './legal/PrivacyPage'
import { TermsPage } from './legal/TermsPage'
import { getStoredPlayerId } from './player'

/** Wide enough for the board to fill the window. The same width as Tailwind's `lg`, which its layout uses. */
const WIDE_SCREEN = '(min-width: 1024px)'

/**
 * `/` opens the live board on a wide screen, where there is room for it and no camera to play with.
 * On a phone it sends a joined player home and everyone else to the join screen.
 */
function Start() {
  if (window.matchMedia(WIDE_SCREEN).matches) {
    return <Navigate to="/board" replace />
  }
  return <Navigate to={getStoredPlayerId() === null ? '/join' : '/home'} replace />
}

const router = createBrowserRouter([
  { path: '/', element: <Start /> },
  // No navigation around this one: nobody has joined yet.
  { path: '/join', element: <JoinScreen /> },
  // The big-screen view. Open to everyone: nobody has to join to watch.
  { path: '/board', element: <BoardScreen /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/terms', element: <TermsPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/design', lazy: () => import('./design/DesignScreen') },
  {
    element: <Layout />,
    children: [
      { path: '/home', element: <HomeScreen /> },
      { path: '/report', element: <ReportScreen /> }, // Sarah
      { path: '/council', element: <CouncilListScreen /> }, // Sarah
      { path: '/council/:itemId', element: <CouncilItemScreen /> }, // Sarah
      { path: '/deals', element: <DealsScreen /> },
      { path: '/deals/:partnerId', element: <DealDetailScreen /> },
      { path: '/leaderboard', element: <LeaderboardScreen /> },
      { path: '/map', element: <MapScreen /> },
      { path: '/profile', element: <ProfileScreen /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function App() {
  return <RouterProvider router={router} />
}
