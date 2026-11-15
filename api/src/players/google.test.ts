// These tests never call Google. They sign tokens with a key made here and hand its public half
// to verifyGoogleCredential through `keys`.
import { createSign, generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyGoogleCredential } from './google';

const CLIENT_ID = 'test-client.apps.googleusercontent.com';
const KID = 'test-key';

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const keys = [{ ...publicKey.export({ format: 'jwk' }), kid: KID, alg: 'RS256', use: 'sig' }];
const other = generateKeyPairSync('rsa', { modulusLength: 2048 });

const nowSeconds = () => Math.floor(Date.now() / 1000);
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

function token(claims: Record<string, unknown>, options: { key?: typeof privateKey; alg?: string } = {}): string {
  const body = `${encode({ alg: options.alg ?? 'RS256', typ: 'JWT', kid: KID })}.${encode(claims)}`;
  const signature = createSign('RSA-SHA256').update(body).sign(options.key ?? privateKey).toString('base64url');
  return `${body}.${signature}`;
}

const goodClaims = () => ({
  iss: 'https://accounts.google.com',
  aud: CLIENT_ID,
  sub: '110169484474386276334',
  email: 'someone@example.com',
  iat: nowSeconds() - 10,
  exp: nowSeconds() + 3600,
});

const verify = (credential: string) => verifyGoogleCredential(credential, { clientId: CLIENT_ID, keys });
const refused = { code: 'unauthorized', status: 401 };

describe('verifyGoogleCredential', () => {
  it('accepts a current token for this app and returns only the account id', async () => {
    expect(await verify(token(goodClaims()))).toEqual({ sub: '110169484474386276334' });
  });

  it('accepts the issuer without https://', async () => {
    expect(await verify(token({ ...goodClaims(), iss: 'accounts.google.com' }))).toEqual({ sub: '110169484474386276334' });
  });

  it('refuses a token issued for another app', async () => {
    await expect(verify(token({ ...goodClaims(), aud: 'someone-else.apps.googleusercontent.com' }))).rejects.toMatchObject(refused);
  });

  it('refuses an expired token', async () => {
    await expect(verify(token({ ...goodClaims(), iat: nowSeconds() - 7200, exp: nowSeconds() - 3600 }))).rejects.toMatchObject(refused);
  });

  it('refuses a token with no expiry', async () => {
    const { exp: _exp, ...claims } = goodClaims();
    await expect(verify(token(claims))).rejects.toMatchObject(refused);
  });

  it('refuses a token from another issuer', async () => {
    await expect(verify(token({ ...goodClaims(), iss: 'https://accounts.example.com' }))).rejects.toMatchObject(refused);
  });

  it('refuses a token signed with a different key', async () => {
    await expect(verify(token(goodClaims(), { key: other.privateKey }))).rejects.toMatchObject(refused);
  });

  it('refuses a token with no account id', async () => {
    const { sub: _sub, ...claims } = goodClaims();
    await expect(verify(token(claims))).rejects.toMatchObject(refused);
  });

  it('refuses text that is not a token', async () => {
    await expect(verify('not-a-token')).rejects.toMatchObject(refused);
  });
});
