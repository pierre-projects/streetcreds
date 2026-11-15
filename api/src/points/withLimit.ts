/** Thrown by withLimit when the time runs out. */
export class TimeLimitError extends Error {
  constructor(ms: number) {
    super(`no result after ${ms / 1000} s`);
    this.name = 'TimeLimitError';
  }
}

/**
 * Waits for `promise`, but for no longer than `ms`. If time runs out it rejects with TimeLimitError.
 * The work behind the promise is not cancelled; this only stops waiting for it.
 */
export function withLimit<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeLimitError(ms)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}
