// The session token of a signed-in player: what keeps them signed in on this device.
// POST /auth/google (or POST /players with a Google credential) hands it out, and api.ts sends
// it with every request. A guest has none. Losing it loses nothing: the player signs in again.

const STORAGE_KEY = 'streetcreds.session'

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage can be blocked (private mode on some phones). Treat it as "not signed in".
    return null
  }
}

export function storeSessionToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // Nothing useful to do. The player stays signed in until the tab closes.
  }
}

export function clearSessionToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Same as above.
  }
}
