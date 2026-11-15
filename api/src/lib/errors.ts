// Throw `new ApiError(code)` anywhere. The handlers below turn it into the standard error shape
// from docs/TECHNICAL.md section 5: { "error": { "code", "message" } } with the matching status.
import type { Context } from 'hono';
import { z } from 'zod';
import { ERROR_CODES, type ApiErrorBody, type ErrorCode } from '../../../shared/api';

type ErrorStatus = (typeof ERROR_CODES)[ErrorCode];

// Written for the player. Pass your own message when you can say something more specific.
const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  validation_failed: 'Something in that request is not right. Check it and try again.',
  unauthorized: 'Sign in again to keep playing.',
  not_found: 'We could not find that.',
  already_linked: 'That Google account already has a saved player. Sign in instead.',
  already_submitted: 'This report was already submitted.',
  already_awarded: 'You already earned these points.',
  insufficient_points: 'You do not have enough CIVIC for this deal yet.',
  not_street_problem: 'That photo does not look like a street problem. Try another photo.',
  rate_limited: 'You have sent 5 reports in the last hour. Try again later.',
  label_failed: 'We could not read that photo. Try again.',
  internal: 'Something went wrong on our side. Try again.',
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: ErrorStatus;

  constructor(code: ErrorCode, message: string = DEFAULT_MESSAGES[code]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = ERROR_CODES[code];
  }
}

function respond(c: Context, error: ApiError): Response {
  const body: ApiErrorBody = { error: { code: error.code, message: error.message } };
  return c.json(body, error.status);
}

/** Hono `onError` handler. Unknown errors are logged and returned as `internal`. */
export function handleError(err: unknown, c: Context): Response {
  if (err instanceof ApiError) {
    return respond(c, err);
  }
  if (err instanceof z.ZodError) {
    return respond(c, new ApiError('validation_failed', err.issues[0]?.message));
  }
  if (err instanceof SyntaxError) {
    return respond(c, new ApiError('validation_failed', 'The request body is not valid JSON.'));
  }
  const detail = err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : { message: String(err) };
  console.error(JSON.stringify({ level: 'error', method: c.req.method, path: c.req.path, ...detail }));
  return respond(c, new ApiError('internal'));
}

/** Hono `notFound` handler: an unknown route gets the same error shape. */
export function handleNotFound(c: Context): Response {
  return respond(c, new ApiError('not_found', 'That address does not exist.'));
}
