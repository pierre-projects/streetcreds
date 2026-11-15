import { locationFixError, locationMessages } from '../../../shared/location'
import type { LocationFix } from '../../../shared/types'

/** One foreground reading per action. Never watch, persist, or reuse a saved position. */
export function readCurrentLocation(): Promise<LocationFix> {
  return new Promise((resolve, reject) => {
    if (!globalThis.navigator?.geolocation) {
      reject(new Error(locationMessages.unavailable))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!Number.isFinite(position.timestamp)) {
          reject(new Error(locationMessages.invalid))
          return
        }
        const location: LocationFix = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
        }
        const error = locationFixError(location)
        if (error) reject(new Error(error))
        else resolve(location)
      },
      (error) => reject(new Error(error.code === 1 ? locationMessages.denied
        : error.code === 3 ? locationMessages.timeout : locationMessages.unavailable)),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 },
    )
  })
}
