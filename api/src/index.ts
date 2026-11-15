// The whole API: one Hono app on one Lambda. Routes are listed in docs/TECHNICAL.md section 5.
// Shared file: after Phase 0, each person only adds the line that mounts their own routes file.
import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import type { HealthResponse } from '../../shared/api';
import { dealRoutes } from './deals/routes';
import { handleError, handleNotFound } from './lib/errors';
import { authRoutes } from './players/authRoutes';
import { playerRoutes } from './players/routes';
import { councilRoutes } from './quests/councilRoutes';
import { reportRoutes } from './quests/reportRoutes';

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

// Preflight. Deployed, the HTTP API passes OPTIONS requests through the $default route to this app
// and adds the CORS headers itself, so the app only has to answer with an empty 204. Without this,
// the browser gets a 404 and blocks every POST. (Locally, cors() in local.ts answers first.)
app.options('*', (c) => c.body(null, 204));

app.get('/health', (c) => {
  const body: HealthResponse = { ok: true };
  return c.json(body);
});

// Route files. Add one line here to mount your own.
app.route('/', playerRoutes);
app.route('/', authRoutes);
app.route('/', reportRoutes);
app.route('/', councilRoutes);
app.route('/', dealRoutes);

app.notFound(handleNotFound);
app.onError(handleError);

// CORS for deployed requests is handled by the HTTP API in template.yaml, not here.
export const handler = handle(app);
