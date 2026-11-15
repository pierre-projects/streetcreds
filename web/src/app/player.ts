// Who the player is. There is no login: the id made by POST /players is kept on the phone,
// and that id is the only identity.
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import type { Player } from '../../../shared/types'
import { api, ApiError } from './api'
import { playerKey, POLL_MS, queryClient } from './queryClient'

const STORAGE_KEY = 'streetcreds.playerId'

export function getStoredPlayerId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage can be blocked (private mode on some phones). Treat it as "not joined".
    return null
  }
}

export function storePlayerId(playerId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, playerId)
  } catch {
    // Nothing useful to do. The player stays joined until the tab closes.
  }
}

export function clearPlayerId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Same as above.
  }
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}

/**
 * The current player, refreshed every few seconds so points stay current.
 * If the API no longer knows the stored id, the id is cleared and the player is sent to /join.
 */
export function usePlayer() {
  const navigate = useNavigate()
  const playerId = getStoredPlayerId()

  const query = useQuery<Player>({
    queryKey: playerKey(playerId ?? 'none'),
    queryFn: async () => {
      if (playerId === null) throw new Error('No player id is stored.')
      return (await api.getPlayer(playerId)).player
    },
    enabled: playerId !== null,
    refetchInterval: POLL_MS,
    retry: (failures, error) => !isNotFound(error) && failures < 2,
  })

  const gone = isNotFound(query.error)
  useEffect(() => {
    if (!gone) return
    clearPlayerId()
    queryClient.removeQueries({ queryKey: ['player'] })
    void navigate('/join', { replace: true })
  }, [gone, navigate])

  return query
}
