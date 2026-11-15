// The whole API: one Hono app on one Lambda. Routes are listed in docs/TECHNICAL.md section 5.
// Shared file: after Phase 0, each person only adds the line that mounts their own routes file.
import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import type { HealthResponse } from '../../shared/api';
import { handleError, handleNotFound } from './lib/errors';
import { playerRoutes } from './players/routes';

export const app = new Hono();

// One JSON log line per request. Never log bodies, photo data or secrets.
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  console.log(
    JSON.stringify({
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      playerId: c.req.query('playerId'),
      ms: Date.now() - start,
    }),
  );
});

app.get('/health', (c) => {
  const body: HealthResponse = { ok: true };
  return c.json(body);
});

// Route files. Add one line here to mount your own.
app.route('/', playerRoutes);

app.notFound(handleNotFound);
app.onError(handleError);

// CORS for deployed requests is handled by the HTTP API in template.yaml, not here.
export const handler = handle(app);
