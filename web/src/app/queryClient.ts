// The one TanStack Query client, and the keys the shell uses.
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2_000,
      refetchOnWindowFocus: true,
    },
  },
})

export const playerKey = (playerId: string) => ['player', playerId] as const
export const leaderboardKey = ['leaderboard'] as const
export const reportsKey = ['reports'] as const

/** How often the header points and the leaderboard refresh. */
export const POLL_MS = 4_000

/** How often the map looks for new reports. Slower than points, because nobody is waiting on it. */
export const MAP_POLL_MS = 10_000
