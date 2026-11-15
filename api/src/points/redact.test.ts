import { describe, expect, it } from 'vitest';
import { redactRpcUrl } from './redact';

const KEYED = 'https://devnet.example-rpc.com/?api-key=abc123def456ghi789';
const KEY = 'abc123def456ghi789';

describe('redactRpcUrl', () => {
  it('removes the whole address from a message', () => {
    const message = `request to ${KEYED} failed, reason: socket hang up`;
    expect(redactRpcUrl(message, KEYED)).toBe('request to [solana address] failed, reason: socket hang up');
  });

  it('removes a key that appears without the rest of the address', () => {
    expect(redactRpcUrl(`401 Unauthorized: invalid api key ${KEY}`, KEYED)).not.toContain(KEY);
  });

  it('removes a key that is part of the path', () => {
    const inPath = 'https://example.solana-devnet.provider.pro/0123456789abcdef0123456789abcdef/';
    const out = redactRpcUrl('failed: https://example.solana-devnet.provider.pro/0123456789abcdef0123456789abcdef', inPath);
    expect(out).not.toContain('0123456789abcdef0123456789abcdef');
  });

  it('leaves a message alone when it does not mention the address', () => {
    expect(redactRpcUrl('Transaction was not confirmed in 30.00 seconds', KEYED)).toBe(
      'Transaction was not confirmed in 30.00 seconds',
    );
  });

  it('does not garble a message over short path pieces', () => {
    expect(redactRpcUrl('rate limit v2 exceeded', 'https://devnet.example-rpc.com/v2/')).toBe('rate limit v2 exceeded');
  });

  it('handles the public address, which has no key', () => {
    const publicUrl = 'https://api.devnet.solana.com';
    expect(redactRpcUrl(`429 Too Many Requests from ${publicUrl}`, publicUrl)).toBe(
      '429 Too Many Requests from [solana address]',
    );
  });

  it('returns the text unchanged for an empty or invalid address', () => {
    expect(redactRpcUrl('some error', '')).toBe('some error');
    expect(redactRpcUrl('some error', 'not a url')).toBe('some error');
  });
});
