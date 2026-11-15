// Checks that the live API has every route this code has. `npm run deploy` and `npm run deploy-secrets`
// run it right after `sam deploy`. To run it on its own, from api/:
//   npm run check-live                  finds the live address from the deployed stack
//   npm run check-live -- https://...   checks that address instead
//
// It catches a live API that is still running an older build. That is how the council quest came to
// answer "That address does not exist." after its pull request had merged: main had the routes, the
// live API did not, and nothing said so.
//
// Every request is one that cannot change anything: GETs without a player id, and POSTs whose body is
// not JSON, which every route rejects before it reads or writes data. Keep it that way: a new POST
// route must read its body before it does anything else.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { app } from '../src/index';
import { type Answer, classify, listRoutes, type Route, type RouteResult, samplePath } from './lib/liveRoutes';

const API_DIR = path.resolve(__dirname, '..');
const SAMCONFIG = path.join(API_DIR, 'samconfig.toml');
// template.yaml names the stack streetcreds in us-east-2. samconfig.toml wins if it says otherwise.
const DEFAULT_STACK = 'streetcreds';
const DEFAULT_REGION = 'us-east-2';
const NOT_JSON = 'route-check';
const TIMEOUT_MS = 20_000;
const RETRY_AFTER_MS = 10_000;

type Outcome = { route: Route; result: RouteResult | 'unreachable'; detail: string };

function fail(message: string): never {
  console.error(`\n${message}`);
  process.exit(1);
}

function samSetting(name: string, fallback: string): string {
  if (!existsSync(SAMCONFIG)) return fallback;
  const match = new RegExp(`^${name}\\s*=\\s*"([^"]+)"`, 'm').exec(readFileSync(SAMCONFIG, 'utf8'));
  return match?.[1] ?? fallback;
}

/** The ApiUrl output of the deployed stack, read with the same SAM CLI that deploys it. */
function liveUrl(): string {
  const stack = samSetting('stack_name', DEFAULT_STACK);
  const region = samSetting('region', DEFAULT_REGION);
  const passIt = 'Pass the address yourself:  npm run check-live -- https://...';
  // Both go into a shell command (sam is sam.cmd on Windows), so they may only hold safe characters.
  if (!/^[A-Za-z0-9-]+$/.test(stack) || !/^[a-z0-9-]+$/.test(region)) {
    fail(`samconfig.toml has an unexpected stack name or region. ${passIt}`);
  }
  const sam = spawnSync(`sam list stack-outputs --stack-name ${stack} --region ${region} --output json`, {
    cwd: API_DIR,
    shell: true,
    encoding: 'utf8',
  });
  if (sam.status !== 0) {
    fail(`Could not read the live address from the ${stack} stack.\n${(sam.stderr || sam.stdout || '').trim()}\n${passIt}`);
  }
  let outputs: { OutputKey?: string; OutputValue?: string }[] = [];
  try {
    outputs = JSON.parse(sam.stdout);
  } catch {
    // Handled below.
  }
  const url = outputs.find((output) => output.OutputKey === 'ApiUrl')?.OutputValue;
  if (!url) fail(`The ${stack} stack has no ApiUrl output. ${passIt}`);
  return url;
}

/** What this code answers for an address it does not have. */
async function unknownRouteAnswer(): Promise<Answer> {
  // The request log middleware prints a line per request. This one is not worth a line.
  const log = console.log;
  console.log = () => {};
  try {
    const response = await app.request('/route-check/no-such-address');
    return { status: response.status, body: await response.json() };
  } finally {
    console.log = log;
  }
}

async function ask(base: string, route: Route, unknownRoute: Answer): Promise<Outcome> {
  const hasBody = route.method !== 'GET';
  let answer: Answer;
  try {
    const response = await fetch(`${base}${samplePath(route.path)}`, {
      method: route.method,
      headers: hasBody ? { 'content-type': 'application/json' } : undefined,
      body: hasBody ? NOT_JSON : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await response.text();
    let body: unknown = null;
    try {
      body = JSON.parse(text);
    } catch {
      // Not JSON. classify() treats that as not the app's own answer.
    }
    answer = { status: response.status, body };
  } catch (error) {
    return { route, result: 'unreachable', detail: error instanceof Error ? error.message : String(error) };
  }
  const code = (answer.body as { error?: { code?: unknown } } | null)?.error?.code;
  const detail = typeof code === 'string' ? `${answer.status} ${code}` : String(answer.status);
  return { route, result: classify(answer, unknownRoute), detail };
}

function print(outcomes: Outcome[]): void {
  const width = Math.max(...outcomes.map(({ route }) => route.method.length));
  for (const { route, result, detail } of outcomes) {
    const label = result === 'ok' ? 'ok' : result.toUpperCase();
    console.log(`  ${label.padEnd(12)}${route.method.padEnd(width + 1)}${route.path}  (${detail})`);
  }
}

async function main(): Promise<void> {
  const given = process.argv[2];
  const base = (given ?? liveUrl()).replace(/\/+$/, '');
  if (!/^https?:\/\//.test(base)) fail(`"${base}" is not an http(s) address.`);

  const routes = listRoutes(app.routes);
  const unknownRoute = await unknownRouteAnswer();
  console.log(`\nChecking that the live API at ${base} has all ${routes.length} routes in this code.`);

  let outcomes = await Promise.all(routes.map((route) => ask(base, route, unknownRoute)));
  if (outcomes.some(({ result }) => result !== 'ok')) {
    // Right after a deploy, give the new build a moment before calling anything missing.
    console.log(`Some routes did not answer as expected. Trying them again in ${RETRY_AFTER_MS / 1000} seconds.`);
    await new Promise((resolve) => setTimeout(resolve, RETRY_AFTER_MS));
    outcomes = await Promise.all(
      outcomes.map((outcome) => (outcome.result === 'ok' ? outcome : ask(base, outcome.route, unknownRoute))),
    );
  }
  print(outcomes);

  const count = (result: Outcome['result']) => outcomes.filter((outcome) => outcome.result === result).length;
  const missing = count('missing');
  const errors = count('error');
  const unreachable = count('unreachable');
  if (missing + errors + unreachable === 0) {
    console.log(`\nThe live API has all ${routes.length} routes.`);
    return;
  }
  if (missing > 0) {
    console.error(
      `\nThe live API is missing ${missing} of these routes, so it is running an older build than this code.` +
        '\nDeploy again from an up-to-date main:  npm run deploy',
    );
  }
  if (errors > 0) {
    console.error(`\n${errors} route(s) answered with a server error. The Lambda's logs in CloudWatch say why.`);
  }
  if (unreachable > 0) {
    console.error(`\n${unreachable} route(s) could not be reached. Check the address and your connection.`);
  }
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(`Route check failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
