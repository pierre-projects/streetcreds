// Builds web/public/data/city-records.json: the City of Tempe accessibility records the map shows.
// Run from api/:   npm run city-records
//                  npm run city-records -- --from some/other/folder
//
// It reads nine pages of public City data (the list is PAGES in lib/cityRecords.ts). For each one
// it first looks in the folder of saved pages (api/city-raw by default, which git ignores), and
// otherwise asks the City's server.
//
// The City's map server refuses requests that do not come from a web browser. When that happens
// this prints the address of each missing page. Open each address in your browser, save what it
// shows into the folder (any file name ending in .json), and run this again. Files are recognized
// by their contents, so the names do not matter.
//
// This only reads public data and writes one file in the repo. It creates nothing in the cloud.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  ADA_URL,
  buildRecords,
  type CityRecordsFile,
  countByKind,
  FOOD_URL,
  FOUNTAIN_URL,
  HEAT_URL,
  identifyPage,
  type PageKey,
  PAGES,
  parsePage,
  queryUrl,
  RESTROOM_URL,
  type Row,
} from './lib/cityRecords';

const API_DIR = path.resolve(__dirname, '..');
const OUT_FILE = path.resolve(API_DIR, '..', 'web', 'public', 'data', 'city-records.json');
const FETCH_LIMIT_MS = 30_000;

const fromFlag = process.argv.indexOf('--from');
const fromArg = fromFlag === -1 ? undefined : process.argv[fromFlag + 1];
const rawDir = path.resolve(fromArg ?? path.join(API_DIR, 'city-raw'));

function fail(message: string): never {
  console.error(`\n${message}`);
  process.exit(1);
}

/** The saved pages in the folder, by which page each one is. */
function readSaved(): Map<PageKey, { json: unknown; file: string; savedAt: Date }> {
  const saved = new Map<PageKey, { json: unknown; file: string; savedAt: Date }>();
  if (!existsSync(rawDir)) return saved;
  for (const name of readdirSync(rawDir).filter((entry) => entry.toLowerCase().endsWith('.json'))) {
    const file = path.join(rawDir, name);
    let json: unknown;
    try {
      json = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
      fail(`${file} is not valid JSON. Save the page again, as the browser shows it.`);
    }
    const key = identifyPage(json);
    if (key === null) {
      console.warn(`Skipping ${name}: it is not one of the City pages this script uses.`);
      continue;
    }
    const other = saved.get(key);
    if (other) fail(`${name} and ${path.basename(other.file)} are the same page. Delete the older one.`);
    saved.set(key, { json, file, savedAt: statSync(file).mtime });
  }
  return saved;
}

/** One page from the City's server, or null when the server will not give it to a script. */
async function download(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_LIMIT_MS) });
    if (!response.ok) return null;
    return JSON.parse(await response.text());
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const saved = readSaved();
  const rows: Partial<Record<PageKey, Row[]>> = {};
  const missing: typeof PAGES = [];
  let copiedAt = new Date(0);

  for (const spec of PAGES) {
    let page = saved.get(spec.key);
    if (!page) {
      const json = await download(queryUrl(spec));
      if (json !== null && identifyPage(json) === spec.key) {
        mkdirSync(rawDir, { recursive: true });
        const file = path.join(rawDir, spec.fileName);
        writeFileSync(file, JSON.stringify(json));
        page = { json, file, savedAt: new Date() };
        console.log(`Downloaded ${spec.title}.`);
      }
    }
    if (!page) {
      missing.push(spec);
      continue;
    }
    try {
      rows[spec.key] = parsePage(spec, page.json);
    } catch (error) {
      fail(`${path.basename(page.file)} was refused. ${error instanceof Error ? error.message : String(error)}`);
    }
    if (page.savedAt > copiedAt) copiedAt = page.savedAt;
  }

  if (missing.length > 0) {
    const which = missing.length === 1 ? 'this page' : `these ${missing.length} pages`;
    console.log(`\nThe City's server would not give ${which} to a script.`);
    console.log(`Open each address below in your web browser and save what it shows into\n  ${rawDir}\nunder any name ending in .json. Then run this again.\n`);
    for (const spec of missing) console.log(`${spec.title} (suggested name ${spec.fileName}):\n${queryUrl(spec)}\n`);
    process.exit(1);
  }

  const records = buildRecords(rows);
  const file: CityRecordsFile = {
    copiedAt: copiedAt.toISOString().slice(0, 10),
    sources: [
      { title: 'City of Tempe, ADA Transition Plan survey', url: ADA_URL },
      { title: 'City of Tempe, bus stops without a shelter and their surface temperature', url: HEAT_URL },
      { title: 'City of Tempe, drinking fountains in parks', url: FOUNTAIN_URL },
      { title: 'City of Tempe, restrooms in parks', url: RESTROOM_URL },
      { title: 'City of Tempe, community food sites', url: FOOD_URL },
    ],
    records,
  };
  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(file)}\n`);

  const counts = countByKind(records);
  console.log(`\nWrote ${records.length} records to ${path.relative(path.resolve(API_DIR, '..'), OUT_FILE)}`);
  for (const [kind, count] of Object.entries(counts)) console.log(`  ${kind}: ${count}`);
  console.log(`  bus stops with a surface temperature: ${records.filter((record) => record.surfaceTempF !== undefined).length}`);
}

void main();
