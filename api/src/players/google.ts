// Checks the ID token that Google's sign-in button hands the web app.
// Google signs it; this verifies the signature against Google's published keys, that it was
// issued for this app (the audience is our client id) and that it has not expired.
// Only `sub`, Google's opaque id for the account, is read. The email, name and picture that
// may be in the token are never read, stored or logged.
import { verifyWithJwks } from 'hono/jwt';
import { requireEnv } from '../lib/env';
import { ApiError } from '../lib/errors';

const GOOGLE_KEYS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
// Google documents both forms of its issuer.
const GOOGLE_ISSUER = /^(https:\/\/)?accounts\.google\.com$/;

export const SIGN_IN_FAILED_MESSAGE = 'Google sign-in did not work. Try again.';

type JwksOptions = Parameters<typeof verifyWithJwks>[1];

export interface VerifyGoogleOptions {
  /** Defaults to GOOGLE_CLIENT_ID. */
  clientId?: string;
  /** Public keys to check against instead of fetching Google's. For tests. */
  keys?: JwksOptions['keys'];
}

/** @throws ApiError('unauthorized') for any token that is not a current Google token for this app. */
export async function verifyGoogleCredential(credential: string, options: VerifyGoogleOptions = {}): Promise<{ sub: string }> {
  // Not set means sign-in is switched off: a plain Error, logged and returned as `internal`.
  const clientId = options.clientId ?? requireEnv('GOOGLE_CLIENT_ID');

  let sub: unknown;
  try {
    const payload = await verifyWithJwks(credential, {
      ...(options.keys ? { keys: options.keys } : { jwks_uri: GOOGLE_KEYS_URL }),
      allowedAlgorithms: ['RS256'],
      verification: { iss: GOOGLE_ISSUER, aud: clientId },
    });
    // An ID token always has an expiry. One without it is not Google's.
    if (typeof payload.exp !== 'number') throw new Error('The token has no expiry.');
    sub = payload.sub;
  } catch (error) {
    // The reason is for the log only, and it never includes the token.
    console.warn(JSON.stringify({ level: 'warn', where: 'verifyGoogleCredential', reason: error instanceof Error ? error.name : 'unknown' }));
    throw new ApiError('unauthorized', SIGN_IN_FAILED_MESSAGE);
  }

  if (typeof sub !== 'string' || sub === '') {
    throw new ApiError('unauthorized', SIGN_IN_FAILED_MESSAGE);
  }
  return { sub };
}
