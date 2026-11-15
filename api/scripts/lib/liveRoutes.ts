// Helpers for scripts/check-live.ts: which routes the API code has, and what a live answer means.

export interface Route {
  method: string;
  path: string;
}

/** One answer from the API. `body` is the parsed JSON, or null when the body was not JSON. */
export interface Answer {
  status: number;
  body: unknown;
}

/** ok: the route is there. missing: the live API does not have it. error: it has it, but it failed. */
export type RouteResult = 'ok' | 'missing' | 'error';

const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Every route the app answers, from Hono's own list (`app.routes`), sorted and without repeats.
 * Middleware (`app.use('*')`) and the catch-all preflight (`app.options('*')`) are left out.
 */
export function listRoutes(routes: readonly Route[]): Route[] {
  const unique = new Map<string, Route>();
  for (const { method, path } of routes) {
    const upper = method.toUpperCase();
    if (!METHODS.has(upper) || path.includes('*')) continue;
    unique.set(`${upper} ${path}`, { method: upper, path });
  }
  return [...unique.values()].sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

/** The path with every `:param` filled in, so it can be requested: `/reports/:id/submit` → `/reports/route-check/submit`. */
export function samplePath(path: string, placeholder = 'route-check'): string {
  return path.replace(/:\w+\??/g, placeholder);
}

function errorOf(body: unknown): { code?: unknown; message?: unknown } | null {
  if (typeof body !== 'object' || body === null || !('error' in body)) return null;
  const { error } = body as { error: unknown };
  return typeof error === 'object' && error !== null ? (error as { code?: unknown; message?: unknown }) : null;
}

/**
 * `unknownRoute` is what this code answers for an address it does not have, asked in-process so its
 * message never has to be copied here. A live answer that matches it, or one with the same status
 * but without the standard error shape (API Gateway's own "Not Found"), means the route is missing.
 * Any other answer, a 404 for an unknown player included, means the route is there.
 */
export function classify(answer: Answer, unknownRoute: Answer): RouteResult {
  if (answer.status >= 500) return 'error';
  if (answer.status !== unknownRoute.status) return 'ok';
  const live = errorOf(answer.body);
  if (!live) return 'missing';
  const expected = errorOf(unknownRoute.body);
  return live.code === expected?.code && live.message === expected?.message ? 'missing' : 'ok';
}
