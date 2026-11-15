import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimeLimitError, withLimit } from './withLimit';

const after = <T>(ms: number, value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

describe('withLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the result when it arrives in time', async () => {
    const result = withLimit(after(1_000, 'signature'), 10_000);
    await vi.advanceTimersByTimeAsync(1_000);
    await expect(result).resolves.toBe('signature');
  });

  it('rejects with TimeLimitError when time runs out', async () => {
    const result = withLimit(after(30_000, 'too late'), 10_000);
    const outcome = expect(result).rejects.toBeInstanceOf(TimeLimitError);
    await vi.advanceTimersByTimeAsync(10_000);
    await outcome;
  });

  it('passes on the error when the work itself fails first', async () => {
    const failing = new Promise<string>((_, reject) => setTimeout(() => reject(new Error('devnet said no')), 500));
    const result = withLimit(failing, 10_000);
    const outcome = expect(result).rejects.toThrow('devnet said no');
    await vi.advanceTimersByTimeAsync(500);
    await outcome;
  });

  it('does not leave a timer running after the result arrives', async () => {
    const result = withLimit(after(100, 1), 10_000);
    await vi.advanceTimersByTimeAsync(100);
    await result;
    expect(vi.getTimerCount()).toBe(0);
  });
});
