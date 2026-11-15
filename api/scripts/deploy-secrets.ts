// Deploys the API with the secrets and Solana settings from api/.env.
// Run by a human from api/:   npm run deploy-secrets
//                             npm run deploy-secrets -- --dry-run   (shows what it would send)
//
// Use it when one of these changes in api/.env and the live API should get it:
//   GEMINI_API_KEY, SOLANA_MODE, CIVIC_MINT, SOLANA_TREASURY_SECRET
// Every other deploy is plain  npm run deploy,  which keeps whatever this command last set.
//
// The values go straight from api/.env to AWS. They are never printed, and any that appear in
// SAM's output are replaced with (hidden). You never have to copy or paste a secret.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const API_DIR = path.resolve(__dirname, '..');
const SAMCONFIG = path.join(API_DIR, 'samconfig.toml');
const MODES = ['off', 'per-player', 'shared'];

const mode = process.env.SOLANA_MODE || 'off';
const mint = process.env.CIVIC_MINT || '';
const treasurySecret = process.env.SOLANA_TREASURY_SECRET || '';
const geminiKey = process.env.GEMINI_API_KEY || '';

function fail(message: string): never {
  console.error(`\n${message}`);
  process.exit(1);
}

/** The non-secret settings saved by the first guided deploy, such as WebOrigins. */
function savedOverrides(): Map<string, string> {
  const saved = new Map<string, string>();
  const line = /^parameter_overrides\s*=\s*"(.*)"\s*$/m.exec(readFileSync(SAMCONFIG, 'utf8'))?.[1] ?? '';
  for (const match of line.matchAll(/(\w+)=\\"([^"\\]*)\\"/g)) {
    if (match[1] !== undefined && match[2] !== undefined) saved.set(match[1], match[2]);
  }
  return saved;
}

/** Writes the non-secret settings back, so a later `npm run deploy` does not undo them. */
function saveOverrides(overrides: Map<string, string>): void {
  const text = readFileSync(SAMCONFIG, 'utf8');
  const value = [...overrides].map(([key, v]) => `${key}=\\"${v}\\"`).join(' ');
  writeFileSync(SAMCONFIG, text.replace(/^parameter_overrides\s*=.*$/m, () => `parameter_overrides = "${value}"`));
}

function run(command: string, args: string[], secrets: string[]): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: API_DIR, shell: true, stdio: ['inherit', 'pipe', 'pipe'] });
    const relay = (stream: NodeJS.ReadableStream, out: NodeJS.WriteStream) => {
      let rest = '';
      const redact = (text: string) => secrets.reduce((t, secret) => t.split(secret).join('(hidden)'), text);
      stream.setEncoding('utf8');
      stream.on('data', (chunk: string) => {
        const lines = (rest + chunk).split('\n');
        rest = lines.pop() ?? '';
        for (const line of lines) out.write(`${redact(line)}\n`);
      });
      stream.on('end', () => {
        if (rest !== '') out.write(redact(rest));
      });
    };
    relay(child.stdout, process.stdout);
    relay(child.stderr, process.stderr);
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function main(): Promise<void> {
  if (!existsSync(SAMCONFIG)) {
    fail('api/samconfig.toml does not exist yet. Run the first deploy with  sam deploy --guided --template-file template.yaml');
  }
  if (!MODES.includes(mode)) {
    fail(`SOLANA_MODE in api/.env is "${mode}". It must be off, per-player or shared.`);
  }
  if (mode !== 'off' && (mint === '' || mint === 'none' || treasurySecret === '')) {
    fail(`SOLANA_MODE is ${mode}, but CIVIC_MINT or SOLANA_TREASURY_SECRET is missing from api/.env. Run  npm run solana-setup  first.`);
  }

  // Non-secret settings: keep what is saved, and set the two Solana ones from api/.env.
  const plain = savedOverrides();
  plain.set('SolanaMode', mode);
  plain.set('CivicMint', mode === 'off' ? 'none' : mint);

  // Secrets: sent only when api/.env has them. Left out, the live API keeps the one it has.
  const secret = new Map<string, string>();
  if (mode !== 'off') secret.set('SolanaTreasurySecret', treasurySecret);
  if (geminiKey !== '') secret.set('GeminiApiKey', geminiKey);

  console.log('Deploying the API with these settings from api/.env:');
  console.log(`  SolanaMode            ${mode}`);
  console.log(`  CivicMint             ${plain.get('CivicMint')}`);
  console.log(`  SolanaTreasurySecret  ${secret.has('SolanaTreasurySecret') ? '(hidden)' : 'not sent'}`);
  console.log(`  GeminiApiKey          ${secret.has('GeminiApiKey') ? '(hidden)' : 'not in api/.env; the live API keeps the one it has'}`);
  console.log(`  Kept as they are      ${[...plain.keys()].filter((key) => key !== 'SolanaMode' && key !== 'CivicMint').join(', ')}`);
  console.log('');

  if (process.argv.includes('--dry-run')) {
    console.log('Dry run: nothing was built or deployed.');
    return;
  }

  const build = spawnSync('npm', ['run', 'build'], { cwd: API_DIR, shell: true, stdio: 'inherit' });
  if (build.status !== 0) fail('The build failed, so nothing was deployed.');

  const overrides = [...plain, ...secret].map(([key, value]) => `"${key}=${value}"`);
  const code = await run('sam', ['deploy', '--template-file', 'template.yaml', '--parameter-overrides', ...overrides], [...secret.values()]);
  if (code !== 0) fail('The deploy did not finish. Nothing in samconfig.toml was changed.');

  saveOverrides(plain);
  console.log('\nDone. samconfig.toml now has the Solana mode and mint, so  npm run deploy  keeps them.');
}

main().catch((error: unknown) => {
  console.error(`Deploy failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
