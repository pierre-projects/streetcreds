import type { ErrorCode } from '../../../shared/api'

/**
 * Thrown by every function in api.ts when a request fails.
 * `message` is written for the player and is safe to show on screen.
 * `status` is 0 when the request never reached the API (offline, or the API address is missing).
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: ErrorCode

  constructor(status: number, code: ErrorCode, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}
