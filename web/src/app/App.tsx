// Every path in the app. The list matches docs/TECHNICAL.md section 7.
//
// Screens that are not built yet show <ComingSoon />. To put a real screen in, import it and
// replace the `element` on its line. Sarah: the three lines marked "Sarah" are yours to change.
import { createBrowserRouter, Navigate } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { ComingSoon } from './ComingSoon'
import { Layout } from './Layout'
import { getStoredPlayerId } from './player'
import { strings } from './strings'

/** `/` sends a joined player home and everyone else to the join screen. */
function Start() {
  return <Navigate to={getStoredPlayerId() === null ? '/join' : '/home'} replace />
}

/** Until the join screen exists. It has no navigation, because nobody has joined yet. */
function JoinPlaceholder() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-2 px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-ink">{strings.appName}</h1>
      <p className="text-base text-muted">{strings.tagline}</p>
      <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-lg font-semibold text-ink">{strings.comingSoon.join}</h2>
        <p className="mt-2 text-muted">{strings.comingSoon.joinBody}</p>
      </section>
    </main>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <Start /> },
  { path: '/join', element: <JoinPlaceholder /> },
  {
    element: <Layout />,
    children: [
      { path: '/home', element: <ComingSoon title={strings.comingSoon.home} /> },
      { path: '/report', element: <ComingSoon title={strings.comingSoon.report} /> }, // Sarah
      { path: '/council', element: <ComingSoon title={strings.comingSoon.council} /> }, // Sarah
      { path: '/council/:itemId', element: <ComingSoon title={strings.comingSoon.council} /> }, // Sarah
      { path: '/leaderboard', element: <ComingSoon title={strings.comingSoon.leaderboard} /> },
      { path: '/map', element: <ComingSoon title={strings.comingSoon.map} /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function App() {
  return <RouterProvider router={router} />
}
