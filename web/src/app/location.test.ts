import { afterEach, describe, expect, it, vi } from 'vitest'
import { locationMessages } from '../../../shared/location'
import { readCurrentLocation } from './location'

afterEach(() => { vi.unstubAllGlobals() })

function geolocationWith(position: Partial<GeolocationPosition> = {}, errorCode?: number) {
  const getCurrentPosition = vi.fn((success: PositionCallback, error?: PositionErrorCallback | null, _options?: PositionOptions) => {
    if (errorCode) error?.({ code: errorCode } as GeolocationPositionError)
    else success({
      coords: { latitude: 33.418, longitude: -111.934, accuracy: 20 },
      timestamp: Date.now(),
      ...position,
    } as GeolocationPosition)
  })
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } })
  return getCurrentPosition
}

describe('one-time device location', () => {
  it('requests a fresh accurate reading without watching or persisting it', async () => {
    const get = geolocationWith()
    const location = await readCurrentLocation()
    expect(location).toMatchObject({ lat: 33.418, lng: -111.934, accuracyMeters: 20 })
    expect(get.mock.calls[0][2]).toEqual({ enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 })
    await readCurrentLocation()
    expect(get).toHaveBeenCalledTimes(2)
  })
  it.each([
    [1, locationMessages.denied],
    [2, locationMessages.unavailable],
    [3, locationMessages.timeout],
  ])('provides a usable error for geolocation code %i', async (code, message) => {
    geolocationWith({}, code)
    await expect(readCurrentLocation()).rejects.toThrow(message)
  })
  it('rejects unsupported geolocation', async () => {
    vi.stubGlobal('navigator', {})
    await expect(readCurrentLocation()).rejects.toThrow(locationMessages.unavailable)
  })
  it('rejects cached or malformed timestamps', async () => {
    geolocationWith({ timestamp: Date.now() - 61_000 })
    await expect(readCurrentLocation()).rejects.toThrow(locationMessages.stale)
    geolocationWith({ timestamp: NaN })
    await expect(readCurrentLocation()).rejects.toThrow(locationMessages.invalid)
  })
  it('rejects inaccurate readings instead of offering an arbitrary pin', async () => {
    geolocationWith({ coords: { latitude: 33.418, longitude: -111.934, accuracy: 300 } as GeolocationCoordinates })
    await expect(readCurrentLocation()).rejects.toThrow(locationMessages.inaccurate)
  })
})
