// Runs labelJpegBase64 on every .jpg in a folder and prints a table.
// Usage (from api/): npx tsx --env-file-if-exists=.env scripts/label-photos.ts <folder>
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { labelJpegBase64 } from '../src/quests/labelPhoto';

async function main(): Promise<void> {
  const folder = process.argv[2];
  if (!folder) {
    console.error('Usage: npx tsx --env-file-if-exists=.env scripts/label-photos.ts <folder>');
    process.exit(1);
  }

  const names = (await readdir(folder))
    .filter((name) => extname(name).toLowerCase() === '.jpg')
    .sort();
  if (names.length === 0) {
    console.error(`No .jpg files in ${folder}`);
    process.exit(1);
  }

  console.log(
    ['file', 'isStreetProblem', 'category', 'severity', 'description', 'seconds'].join('\t'),
  );

  for (const name of names) {
    const started = Date.now();
    try {
      const bytes = await readFile(join(folder, name));
      const label = await labelJpegBase64(bytes.toString('base64'));
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      console.log(
        [name, String(label.isStreetProblem), label.category, label.severity, label.description, seconds].join(
          '\t',
        ),
      );
    } catch (error) {
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      const message = error instanceof Error ? error.message : String(error);
      console.log([name, 'ERROR', '', '', message, seconds].join('\t'));
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
