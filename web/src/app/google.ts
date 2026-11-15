// Google's sign-in button. Google's script is loaded only when a sign-in button is about to be
// shown, never on page load, so a guest who never signs in never contacts Google.
// The client id is public: it is in every page that shows a Google button.
import { USE_MOCKS } from './api'

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()
const SCRIPT_URL = 'https://accounts.google.com/gsi/client'

/** Google's own button is a fixed 40 px tall. It is drawn this much larger, so the tap target is 44 px. */
export const GOOGLE_BUTTON_SCALE = 1.1
const GOOGLE_BUTTON_MIN = 200
const GOOGLE_BUTTON_MAX = 400

/**
 * False until a client id is set (or mock mode is on). Screens hide every sign-in control
 * while it is false, so the game works as guest-only until sign-in is set up.
 */
export const GOOGLE_SIGN_IN_ON = CLIENT_ID !== '' || USE_MOCKS

/** The part of Google Identity Services this app uses. */
interface GoogleIdApi {
  initialize(config: { client_id: string; callback: (response: { credential?: string }) => void }): void
  renderButton(
    parent: HTMLElement,
    options: {
      type: 'standard'
      theme: 'outline'
      size: 'large'
      shape: 'pill'
      text: 'continue_with' | 'signin_with'
      logo_alignment: 'center'
      width: number
    },
  ): void
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdApi } }
  }
}

let loading: Promise<GoogleIdApi> | null = null

function loadGoogle(): Promise<GoogleIdApi> {
  loading ??= new Promise<GoogleIdApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => {
      const id = window.google?.accounts?.id
      if (id) resolve(id)
      else reject(new Error('Google sign-in did not load.'))
    }
    script.onerror = () => reject(new Error('Google sign-in did not load.'))
    document.head.append(script)
  }).catch((error: unknown) => {
    // Let the next button try again (a blocked or offline first attempt should not stick).
    loading = null
    throw error
  })
  return loading
}

/** The width to ask Google for, so the scaled button fills a container this wide. */
export function googleButtonWidth(containerWidth: number): number {
  const width = Math.floor(containerWidth / GOOGLE_BUTTON_SCALE)
  return Math.min(GOOGLE_BUTTON_MAX, Math.max(GOOGLE_BUTTON_MIN, width))
}

/**
 * Draws Google's button inside `parent`. `onCredential` gets Google's ID token when the
 * person finishes signing in. Rejects when Google's script cannot be loaded.
 */
export async function renderGoogleButton(
  parent: HTMLElement,
  onCredential: (credential: string) => void,
  text: 'continue_with' | 'signin_with' = 'continue_with',
): Promise<void> {
  const id = await loadGoogle()
  id.initialize({
    client_id: CLIENT_ID,
    callback: (response) => {
      if (response.credential) onCredential(response.credential)
    },
  })
  parent.replaceChildren()
  id.renderButton(parent, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text,
    logo_alignment: 'center',
    width: googleButtonWidth(parent.clientWidth),
  })
}
