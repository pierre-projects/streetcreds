// Writes shared/tempeBoundary.ts: a checked copy of the City of Tempe's boundary. The location
// check (shared/playArea.ts) uses it when the City's live service cannot be reached, so an
// outage there does not stop players joining or reporting.
// Run from api/:   npm run city-boundary
//
// It reads one page of public City data, the same page the API reads while it runs, and checks
// it the same way. It sends nothing about any player, writes one file in the repo and creates
// nothing in the cloud. Run it again if Tempe's limits change: the copy says what day it was made.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { readBoundary, TEMPE_BOUNDARY_URL } from '../../shared/playArea';

const OUT_FILE = path.resolve(__dirname, '..', '..', 'shared', 'tempeBoundary.ts');
const FETCH_LIMIT_MS = 30_000;
/** Six decimals of a degree is about 10 cm, far finer than any phone's reading. */
const DECIMALS = 6;
const POINTS_PER_LINE = 6;

function fail(message: string): never {
  console.error(`\n${message}`);
  process.exit(1);
}

async function main(): Promise<void> {
  let json: unknown;
  try {
    const response = await fetch(TEMPE_BOUNDARY_URL, { signal: AbortSignal.timeout(FETCH_LIMIT_MS) });
    if (!response.ok) fail(`The City's server answered ${response.status}. Nothing was written.`);
    json = await response.json();
  } catch (error) {
    fail(`The City's boundary could not be read (${error instanceof Error ? error.message : String(error)}). Nothing was written.`);
  }

  // The same checks the API makes before it trusts a boundary: the right city, the right
  // coordinate system, every ring closed, nothing cut off.
  let polygons;
  try {
    polygons = readBoundary(json);
  } catch (error) {
    fail(`The City's answer is not a usable boundary (${error instanceof Error ? error.message : String(error)}). Nothing was written.`);
  }

  const round = (value: number) => Number(value.toFixed(DECIMALS));
  const lines: string[] = [];
  let points = 0;
  polygons.forEach((rings, polygonIndex) => {
    lines.push(`  // Polygon ${polygonIndex + 1} of ${polygons.length}`, '  [');
    rings.forEach((ring, ringIndex) => {
      points += ring.length;
      lines.push(`    // Ring ${ringIndex + 1} of ${rings.length}: ${ring.length} points`, '    [');
      for (let start = 0; start < ring.length; start += POINTS_PER_LINE) {
        const row = ring.slice(start, start + POINTS_PER_LINE).map(([lng, lat]) => `[${round(lng)}, ${round(lat)}]`);
        lines.push(`      ${row.join(', ')},`);
      }
      lines.push('    ],');
    });
    lines.push('  ],');
  });

  const day = new Date().toISOString().slice(0, 10);
  const file = [
    `// The City of Tempe's boundary, copied from the City's own City Boundary layer on ${day}.`,
    '// Made by `npm run city-boundary` in api/. Do not edit it by hand: run that again.',
    '//',
    '// shared/playArea.ts checks a position against the live layer, and against this copy when the',
    '// live one cannot be loaded. Each point is longitude, then latitude, as the City publishes them.',
    '// A polygon is a list of rings: its outer edges, and holes where land inside is not the City\'s.',
    "import type { Boundary } from './playArea';",
    '',
    `export const TEMPE_BOUNDARY_COPIED_AT = '${day}';`,
    '',
    'export const TEMPE_BOUNDARY: Boundary = [',
    ...lines,
    '];',
    '',
  ].join('\n');

  writeFileSync(OUT_FILE, file);
  const rings = polygons.reduce((count, polygon) => count + polygon.length, 0);
  console.log(`Wrote ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`  ${polygons.length} polygon(s), ${rings} ring(s), ${points} points, ${Math.round(file.length / 1024)} KB`);
}

void main();
