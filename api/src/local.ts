// Local server for development: http://localhost:3001. Run it with `npm run dev`.
// CORS lives here only. Deployed, the HTTP API adds the CORS headers; doing both breaks browsers.
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { app } from './index';
import { env } from './lib/env';

const PORT = 3001;

const local = new Hono();

local.use(
  '*',
  cors({
    origin: env.WEB_ORIGINS.split(',').map((origin) => origin.trim()),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['content-type', 'authorization'],
  }),
);

// Hand every request to the real app, so its routes, 404s and errors behave exactly as deployed.
local.all('*', (c) => app.fetch(c.req.raw));

serve({ fetch: local.fetch, port: PORT }, (info) => {
  console.log(`StreetCreds API running at http://localhost:${info.port}`);
  const missing = (['PHOTO_BUCKET', 'GEMINI_API_KEY'] as const).filter((name) => env[name] === '');
  if (missing.length > 0) {
    console.warn(`Not set in api/.env: ${missing.join(', ')}. Routes that need them will fail until they are.`);
  }
});
