// Every path in the app. The list matches docs/TECHNICAL.md section 7.
//
// Screens that are not built yet show <ComingSoon />. To put a real screen in, import it and
// replace the `element` on its line. Sarah: the three lines marked "Sarah" are yours to change.
import { createBrowserRouter, Navigate } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { HomeScreen } from '../features/players/HomeScreen'
import { LeaderboardScreen } from '../features/players/LeaderboardScreen'
import { MapScreen } from '../features/players/MapScreen'
import { JoinScreen } from '../features/players/JoinScreen'
import { ComingSoon } from './ComingSoon'
import { Layout } from './Layout'
import { getStoredPlayerId } from './player'
import { strings } from './strings'

/** `/` sends a joined player home and everyone else to the join screen. */
function Start() {
  return <Navigate to={getStoredPlayerId() === null ? '/join' : '/home'} replace />
}

const router = createBrowserRouter([
  { path: '/', element: <Start /> },
  // No navigation around this one: nobody has joined yet.
  { path: '/join', element: <JoinScreen /> },
  {
    element: <Layout />,
    children: [
      { path: '/home', element: <HomeScreen /> },
      { path: '/report', element: <ComingSoon title={strings.comingSoon.report} /> }, // Sarah
      { path: '/council', element: <ComingSoon title={strings.comingSoon.council} /> }, // Sarah
      { path: '/council/:itemId', element: <ComingSoon title={strings.comingSoon.council} /> }, // Sarah
      { path: '/leaderboard', element: <LeaderboardScreen /> },
      { path: '/map', element: <MapScreen /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function App() {
  return <RouterProvider router={router} />
}
