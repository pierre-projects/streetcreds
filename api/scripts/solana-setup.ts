// Creates what the points wallet needs on Solana DEVNET: a treasury keypair and the CIVIC mint.
// Run by a human from api/:   npm run solana-setup
//
// Safe to run again. Each run picks up where the last one stopped:
//   1. Loads api/treasury-keypair.json, or creates it. The file is git-ignored. Never commit it.
//   2. Tops the treasury up from the devnet faucet if it is low.
//   3. Creates the CIVIC mint, unless api/.env already names one this treasury controls.
//   4. Writes CIVIC_MINT and SOLANA_TREASURY_SECRET into api/.env.
//
// The secret key is never printed. It goes into api/.env and nowhere else.
// This script reads process.env itself instead of src/lib/env.ts, because that module refuses to
// load when SOLANA_MODE is on and the two values this script creates are still missing.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createMint, getMint } from '@solana/spl-token';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

const API_DIR = path.resolve(__dirname, '..');
const KEYPAIR_FILE = path.join(API_DIR, 'treasury-keypair.json');
const ENV_FILE = path.join(API_DIR, '.env');
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const MIN_BALANCE_SOL = 0.5;
const FAUCET_URL = 'https://faucet.solana.com';

function sol(lamports: number): string {
  return (lamports / LAMPORTS_PER_SOL).toFixed(3);
}

function addressUrl(address: PublicKey): string {
  return `https://explorer.solana.com/address/${address.toBase58()}?cluster=devnet`;
}

function loadOrCreateTreasury(): Keypair {
  if (existsSync(KEYPAIR_FILE)) {
    const bytes = JSON.parse(readFileSync(KEYPAIR_FILE, 'utf8')) as number[];
    console.log('Treasury: using the keypair in treasury-keypair.json');
    return Keypair.fromSecretKey(Uint8Array.from(bytes));
  }
  const treasury = Keypair.generate();
  writeFileSync(KEYPAIR_FILE, JSON.stringify(Array.from(treasury.secretKey)));
  console.log('Treasury: created a new keypair in treasury-keypair.json (git-ignored)');
  return treasury;
}

async function topUp(connection: Connection, treasury: Keypair): Promise<boolean> {
  const balance = await connection.getBalance(treasury.publicKey);
  console.log(`Treasury balance: ${sol(balance)} SOL`);
  if (balance >= MIN_BALANCE_SOL * LAMPORTS_PER_SOL) {
    return true;
  }
  for (const amount of [2, 1]) {
    try {
      console.log(`Asking the devnet faucet for ${amount} SOL...`);
      const signature = await connection.requestAirdrop(treasury.publicKey, amount * LAMPORTS_PER_SOL);
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature, ...latest }, 'confirmed');
      console.log(`Treasury balance: ${sol(await connection.getBalance(treasury.publicKey))} SOL`);
      return true;
    } catch (error) {
      console.log(`  The faucet said no: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
    }
  }
  return false;
}

/** Returns the mint named in api/.env if it exists on devnet and this treasury controls it. */
async function existingMint(connection: Connection, treasury: Keypair): Promise<PublicKey | null> {
  const address = process.env.CIVIC_MINT;
  if (!address || address === 'none') {
    return null;
  }
  try {
    const mint = await getMint(connection, new PublicKey(address));
    if (mint.mintAuthority?.equals(treasury.publicKey)) {
      return mint.address;
    }
    console.log('CIVIC_MINT in api/.env belongs to a different treasury. Creating a new mint.');
  } catch {
    console.log('CIVIC_MINT in api/.env was not found on devnet. Creating a new mint.');
  }
  return null;
}

function writeEnv(values: Record<string, string>): void {
  let text = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8') : '';
  for (const [name, value] of Object.entries(values)) {
    const line = `${name}=${value}`;
    const pattern = new RegExp(`^${name}=.*$`, 'm');
    text = pattern.test(text) ? text.replace(pattern, () => line) : `${text.replace(/\n*$/, '\n')}${line}\n`;
  }
  writeFileSync(ENV_FILE, text);
}

async function main(): Promise<void> {
  if (RPC_URL.includes('mainnet')) {
    throw new Error('SOLANA_RPC_URL points at mainnet. StreetCreds runs on devnet only.');
  }
  console.log(`Solana RPC: ${RPC_URL}\n`);
  const connection = new Connection(RPC_URL, 'confirmed');
  const treasury = loadOrCreateTreasury();
  console.log(`Treasury address: ${treasury.publicKey.toBase58()}`);

  // Written before anything else can fail, so api/.env always matches the keypair file.
  writeEnv({ SOLANA_TREASURY_SECRET: Buffer.from(treasury.secretKey).toString('base64') });

  if (!(await topUp(connection, treasury))) {
    console.log('\nThe treasury needs devnet SOL before the mint can be created.');
    console.log(`  1. Open ${FAUCET_URL}`);
    console.log(`  2. Paste this address and request 1 or 2 SOL on devnet:  ${treasury.publicKey.toBase58()}`);
    console.log('  3. Run  npm run solana-setup  again.');
    process.exitCode = 1;
    return;
  }

  let mint = await existingMint(connection, treasury);
  if (mint) {
    console.log(`CIVIC mint: already exists at ${mint.toBase58()}`);
  } else {
    console.log('Creating the CIVIC mint (0 decimals, treasury is the mint authority)...');
    mint = await createMint(connection, treasury, treasury.publicKey, null, 0);
    console.log(`CIVIC mint: created at ${mint.toBase58()}`);
  }
  writeEnv({ CIVIC_MINT: mint.toBase58() });

  console.log('\nDone. api/.env now has CIVIC_MINT and SOLANA_TREASURY_SECRET.');
  console.log(`  Mint:     ${addressUrl(mint)}`);
  console.log(`  Treasury: ${addressUrl(treasury.publicKey)}`);
  console.log('\nNext:');
  console.log('  1. In api/.env, set  SOLANA_MODE=per-player');
  console.log('  2. Run  npm run mint-test  and open the link it prints.');
  console.log('\nThe treasury secret is in api/.env and treasury-keypair.json. Do not commit or share either.');
}

main().catch((error: unknown) => {
  console.error(`\nSetup failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
