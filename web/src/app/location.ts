import { locationFixError, locationMessages, MAX_ACCURACY_METERS, type LocationPurpose } from '../../../shared/location'
import type { LocationFix } from '../../../shared/types'
import { strings } from './strings'

/**
 * What to tell a player whose browser refused the request. The page sees one error for three
 * different causes, and each needs a different fix:
 *
 * - the page was not loaded over https, where no browser gives a position;
 * - on an iPhone or iPad, the browser app itself has no location permission. iOS then refuses
 *   without ever asking, even with Location Services on, and the switch is in the Settings app,
 *   not in the browser;
 * - the player said no to this site.
 */
export function blockedMessage(): string {
  if (globalThis.isSecureContext === false) return strings.location.notSecure
  const nav = globalThis.navigator
  const userAgent = nav?.userAgent ?? ''
  // An iPad reports itself as a Mac, so it is told apart by its touch screen.
  const appleMobile = /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && (nav?.maxTouchPoints ?? 0) > 1)
  return appleMobile ? strings.location.blockedOnIphone : locationMessages.denied
}

/**
 * How long one action waits for a reading that is precise enough. A phone's first reading is
 * often a rough one from cell towers or Wi-Fi, hundreds of meters wide, and the satellite fix
 * that follows takes a few seconds, longer indoors.
 */
export const LOCATION_WAIT_MS = 12_000

/**
 * The device's position, for one action: joining or submitting a report.
 *
 * It listens until the first reading that is fresh and precise enough for `purpose`, then stops.
 * A rough reading is not an error while there is time left: a better one usually follows. When
 * the time is up it fails with the reason the last reading was refused, or says none arrived.
 *
 * Nothing here runs in the background. The listening ends with the action, at most
 * LOCATION_WAIT_MS after it starts, and no position is kept, saved or reused: the next action
 * asks again.
 */
export function readCurrentLocation(purpose: LocationPurpose = 'report'): Promise<LocationFix> {
  return new Promise((resolve, reject) => {
    const geolocation = globalThis.navigator?.geolocation
    if (!geolocation) {
      reject(new Error(locationMessages.unavailable))
      return
    }

    // Why the latest reading was refused. Null until a reading arrives.
    let refused: string | null = null
    let done = false
    let watch: number | undefined
    let timer: ReturnType<typeof setTimeout> | undefined

    function finish(outcome: LocationFix | string) {
      if (done) return
      done = true
      clearTimeout(timer)
      if (watch !== undefined) geolocation.clearWatch(watch)
      if (typeof outcome === 'string') reject(new Error(outcome))
      else resolve(outcome)
    }

    // Our own time limit. The browser's `timeout` only covers the wait for a first reading, so
    // it would never end a wait in which rough readings keep arriving.
    timer = setTimeout(() => finish(refused ?? locationMessages.timeout), LOCATION_WAIT_MS)

    watch = geolocation.watchPosition(
      (position) => {
        if (!Number.isFinite(position.timestamp)) {
          refused = locationMessages.invalid
          return
        }
        const location: LocationFix = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
        }
        const error = locationFixError(location, Date.now(), { maxAccuracyMeters: MAX_ACCURACY_METERS[purpose] })
        if (error) refused = error
        else finish(location)
      },
      (error) => {
        // Blocked: waiting will not change that.
        if (error.code === 1) finish(blockedMessage())
        // The browser's own limit for a first reading. Ours matches it, so this is the end.
        else if (error.code === 3) finish(refused ?? locationMessages.timeout)
        // No position right now. With nothing received yet, say so at once. After a rough
        // reading it is usually a passing gap, so keep waiting for the time that is left.
        else if (refused === null) finish(locationMessages.unavailable)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: LOCATION_WAIT_MS },
    )
    // A browser may answer before watchPosition returns its id. Stop that watch too.
    if (done) geolocation.clearWatch(watch)
  })
}
