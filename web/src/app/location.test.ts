import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { locationMessages } from '../../../shared/location'
import { LOCATION_WAIT_MS, readCurrentLocation } from './location'
import { strings } from './strings'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const WATCH_ID = 7

/** A stand-in for the browser's geolocation. The test decides what it reports, and when. */
function fakeDevice() {
  let onPosition: PositionCallback = () => {}
  let onError: PositionErrorCallback = () => {}
  const watchPosition = vi.fn((success: PositionCallback, error?: PositionErrorCallback | null, _options?: PositionOptions) => {
    onPosition = success
    onError = error ?? (() => {})
    return WATCH_ID
  })
  const clearWatch = vi.fn()
  vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch } })
  return {
    watchPosition,
    clearWatch,
    /** A reading with this accuracy radius in meters, taken `ageMs` ago. */
    reads: (accuracy: number, ageMs = 0) =>
      onPosition({ coords: { latitude: 33.418, longitude: -111.934, accuracy }, timestamp: Date.now() - ageMs } as GeolocationPosition),
    fails: (code: number) => onError({ code } as GeolocationPositionError),
  }
}

describe('reading the device location for one action', () => {
  it('takes the first precise reading and stops listening', async () => {
    const device = fakeDevice()
    const location = readCurrentLocation()
    device.reads(20)
    await expect(location).resolves.toMatchObject({ lat: 33.418, lng: -111.934, accuracyMeters: 20 })
    expect(device.watchPosition.mock.calls[0][2]).toEqual({ enableHighAccuracy: true, maximumAge: 0, timeout: LOCATION_WAIT_MS })
    expect(device.clearWatch).toHaveBeenCalledExactlyOnceWith(WATCH_ID)
  })

  it('waits through rough first readings for a precise one', async () => {
    const device = fakeDevice()
    const location = readCurrentLocation()
    device.reads(1400)
    device.reads(250)
    expect(device.clearWatch).not.toHaveBeenCalled()
    device.reads(35)
    await expect(location).resolves.toMatchObject({ accuracyMeters: 35 })
    expect(device.clearWatch).toHaveBeenCalledExactlyOnceWith(WATCH_ID)
  })

  it('asks the device again for every action and keeps nothing', async () => {
    const device = fakeDevice()
    const first = readCurrentLocation()
    device.reads(20)
    await first
    const second = readCurrentLocation()
    device.reads(20)
    await second
    expect(device.watchPosition).toHaveBeenCalledTimes(2)
  })

  it('accepts a rougher reading for joining than for a report', async () => {
    const device = fakeDevice()
    const joining = readCurrentLocation('join')
    device.reads(300)
    await expect(joining).resolves.toMatchObject({ accuracyMeters: 300 })

    const reporting = expect(readCurrentLocation('report')).rejects.toThrow(locationMessages.inaccurate)
    device.reads(300)
    vi.advanceTimersByTime(LOCATION_WAIT_MS)
    await reporting
  })

  it('says the reading is not precise enough when the time runs out on rough ones', async () => {
    const device = fakeDevice()
    const outcome = expect(readCurrentLocation()).rejects.toThrow(locationMessages.inaccurate)
    device.reads(900)
    vi.advanceTimersByTime(LOCATION_WAIT_MS - 1)
    expect(device.clearWatch).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    await outcome
    expect(device.clearWatch).toHaveBeenCalledExactlyOnceWith(WATCH_ID)
  })

  it('says it took too long when no reading arrives', async () => {
    const device = fakeDevice()
    const outcome = expect(readCurrentLocation()).rejects.toThrow(locationMessages.timeout)
    vi.advanceTimersByTime(LOCATION_WAIT_MS)
    await outcome
    expect(device.clearWatch).toHaveBeenCalledExactlyOnceWith(WATCH_ID)
  })

  it('stops at once when location is blocked', async () => {
    const device = fakeDevice()
    const outcome = expect(readCurrentLocation()).rejects.toThrow(locationMessages.denied)
    device.fails(1)
    await outcome
    expect(device.clearWatch).toHaveBeenCalledExactlyOnceWith(WATCH_ID)
  })

  it('gives an iPhone the steps for the Settings app when location is blocked', async () => {
    const device = fakeDevice()
    vi.stubGlobal('navigator', {
      ...globalThis.navigator,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    })
    const outcome = expect(readCurrentLocation()).rejects.toThrow(strings.location.blockedOnIphone)
    device.fails(1)
    await outcome
  })

  it('says the address is the problem when the page is not on https', async () => {
    const device = fakeDevice()
    vi.stubGlobal('isSecureContext', false)
    const outcome = expect(readCurrentLocation()).rejects.toThrow(strings.location.notSecure)
    device.fails(1)
    await outcome
  })

  it('stops at once when the device has no position and none has arrived', async () => {
    const device = fakeDevice()
    const outcome = expect(readCurrentLocation()).rejects.toThrow(locationMessages.unavailable)
    device.fails(2)
    await outcome
  })

  it('keeps waiting through a passing gap once a reading has arrived', async () => {
    const device = fakeDevice()
    const location = readCurrentLocation()
    device.reads(900)
    device.fails(2)
    device.reads(30)
    await expect(location).resolves.toMatchObject({ accuracyMeters: 30 })
  })

  it('ends on the browser’s own time limit', async () => {
    const device = fakeDevice()
    const outcome = expect(readCurrentLocation()).rejects.toThrow(locationMessages.timeout)
    device.fails(3)
    await outcome
  })

  it('passes over a reading with an old time and takes the next fresh one', async () => {
    const device = fakeDevice()
    const location = readCurrentLocation()
    device.reads(20, 61_000)
    device.reads(20)
    await expect(location).resolves.toMatchObject({ accuracyMeters: 20 })
  })

  it('reports old or unreadable times if nothing better arrives', async () => {
    const device = fakeDevice()
    const old = expect(readCurrentLocation()).rejects.toThrow(locationMessages.stale)
    device.reads(20, 61_000)
    vi.advanceTimersByTime(LOCATION_WAIT_MS)
    await old

    const unreadable = expect(readCurrentLocation()).rejects.toThrow(locationMessages.invalid)
    device.reads(20, NaN)
    vi.advanceTimersByTime(LOCATION_WAIT_MS)
    await unreadable
  })

  it('stops a watch that answers before the browser has handed back its id', async () => {
    const clearWatch = vi.fn()
    const watchPosition = vi.fn((success: PositionCallback) => {
      success({ coords: { latitude: 33.418, longitude: -111.934, accuracy: 20 }, timestamp: Date.now() } as GeolocationPosition)
      return WATCH_ID
    })
    vi.stubGlobal('navigator', { geolocation: { watchPosition, clearWatch } })
    await expect(readCurrentLocation()).resolves.toMatchObject({ accuracyMeters: 20 })
    expect(clearWatch).toHaveBeenCalledWith(WATCH_ID)
  })

  it('rejects a browser with no geolocation', async () => {
    vi.stubGlobal('navigator', {})
    await expect(readCurrentLocation()).rejects.toThrow(locationMessages.unavailable)
  })
})
