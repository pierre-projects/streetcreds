// Who the player is. A guest is only the id made by POST /players, kept on the phone.
// A player saved with Google also has a session token (session.ts), and can get the same
// player back on any device by signing in again.
import { useQuery } from '@tanstack/react-query'
import { useEffect, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router'
import type { Player } from '../../../shared/types'
import { api, ApiError } from './api'
import { playerKey, POLL_MS, queryClient } from './queryClient'
import { clearSessionToken, getSessionToken, storeSessionToken } from './session'

const STORAGE_KEY = 'streetcreds.playerId'

// Screens that are already on show need to hear when the player on this device changes
// (signing in to a saved player from the profile, signing out). localStorage does not tell
// its own tab, so storePlayerId and clearPlayerId do.
const listeners = new Set<() => void>()
function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
function announce(): void {
  for (const listener of listeners) listener()
}

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
  announce()
}

export function clearPlayerId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Same as above.
  }
  announce()
}

/** The stored player id, kept current: a component using it redraws when the player changes. */
export function useStoredPlayerId(): string | null {
  return useSyncExternalStore(subscribe, getStoredPlayerId)
}

/** True when this device holds a session, so the player on it is saved to an account. */
export function isSignedIn(): boolean {
  return getSessionToken() !== null
}

/**
 * Makes this device play as `player`. With a session token the player is signed in;
 * without one it is a guest who just joined.
 */
export function completeSignIn(player: Player, sessionToken?: string): void {
  if (sessionToken !== undefined) storeSessionToken(sessionToken)
  // The cache first, so screens that redraw for the new id have the player at once.
  queryClient.setQueryData(playerKey(player.id), player)
  storePlayerId(player.id)
}

/** Forgets the player on this device. The player itself stays on the server. */
function forgetPlayer(): void {
  clearPlayerId()
  clearSessionToken()
  queryClient.removeQueries({ queryKey: ['player'] })
  queryClient.removeQueries({ queryKey: ['player-reports'] })
}

/**
 * Signs out on this device. The saved player keeps its points and reports, and signing in
 * again brings it back. Ending the session on the server is best effort: the device forgets
 * the token either way.
 */
export async function signOutHere(): Promise<void> {
  try {
    if (isSignedIn()) await api.signOut()
  } catch {
    // Offline, or the session was already gone.
  }
  forgetPlayer()
}

/** 404: the API no longer knows the id. 401: the player is saved to an account and this device is not signed in to it. */
function isGone(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 401)
}

/**
 * The current player, refreshed every few seconds so points stay current.
 * If the API no longer knows the stored id, or wants a sign-in this device does not have,
 * the id is cleared and the player is sent to /join.
 */
export function usePlayer() {
  const navigate = useNavigate()
  const playerId = useStoredPlayerId()

  const query = useQuery<Player>({
    queryKey: playerKey(playerId ?? 'none'),
    queryFn: async () => {
      if (playerId === null) throw new Error('No player id is stored.')
      return (await api.getPlayer(playerId)).player
    },
    enabled: playerId !== null,
    refetchInterval: POLL_MS,
    retry: (failures, error) => !isGone(error) && failures < 2,
  })

  const gone = isGone(query.error)
  useEffect(() => {
    if (!gone) return
    forgetPlayer()
    void navigate('/join', { replace: true })
  }, [gone, navigate])

  return query
}
