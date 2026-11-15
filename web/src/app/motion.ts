// Whether the player has asked their phone or computer for less motion ("Reduce motion").
//
// CSS handles most of it: see the `prefers-reduced-motion` block at the end of index.css. This
// file is for motion that CSS cannot reach, such as the map's own zoom animation and scrolling
// started from code.
//
//   const calm = useReducedMotion()          // in a component; follows the setting live
//   if (prefersReducedMotion()) { ... }      // anywhere else, at the moment it is asked
import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** True when the device is set to reduce motion. False where that cannot be known. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(QUERY).matches
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/** The same answer for a component. It changes as soon as the setting does, without a reload. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}
