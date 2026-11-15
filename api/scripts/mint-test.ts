// Sends test mints to Solana DEVNET and prints a link to each one.
// Run by a human from api/:   npm run mint-test          (one mint)
//                             npm run mint-test -- 10    (ten in a row)
//
// It calls the same mintPoints the game uses, for a throwaway player, so it proves the treasury,
// the mint and the RPC connection work before awardPoints depends on them.
// It sends devnet transactions and never touches the database.
import { Keypair } from '@solana/web3.js';
import { env } from '../src/lib/env';
import { redactRpcUrl } from '../src/points/redact';
import { explorerTxUrl, mintPoints } from '../src/points/solana';
import { withLimit } from '../src/points/withLimit';

/** One line of an error, with the Solana address taken out: that address can hold an access key. */
function describe(error: unknown): string {
  const text = error instanceof Error ? (error.message.split('\n')[0] ?? '') : String(error);
  return redactRpcUrl(text, env.SOLANA_RPC_URL);
}

const WAIT_LIMIT_MS = 30_000;
// awardPoints waits this long before leaving an award "pending".
const AWARD_LIMIT_MS = 10_000;

async function main(): Promise<void> {
  const count = Number(process.argv[2] ?? '1');
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    throw new Error('The count must be a whole number from 1 to 50.');
  }
  if (env.SOLANA_MODE === 'off') {
    throw new Error('SOLANA_MODE is off. Set SOLANA_MODE=per-player (or shared) in api/.env first.');
  }

  // A throwaway player. In per-player mode it gets a fresh address, as a real player would on joining.
  const player = {
    id: `mint-test-${Date.now()}`,
    walletAddress: env.SOLANA_MODE === 'per-player' ? Keypair.generate().publicKey.toBase58() : null,
  };
  // Only the host is printed, never the full address.
  console.log(`Solana address: ${new URL(env.SOLANA_RPC_URL).host}`);
  console.log(`Mode: ${env.SOLANA_MODE}. Sending ${count} test mint${count === 1 ? '' : 's'} of 1 CIVIC each.\n`);

  let succeeded = 0;
  let withinAwardLimit = 0;
  for (let i = 1; i <= count; i++) {
    const start = Date.now();
    try {
      const signature = await withLimit(mintPoints(player, 1), WAIT_LIMIT_MS);
      const ms = Date.now() - start;
      succeeded++;
      if (ms <= AWARD_LIMIT_MS) withinAwardLimit++;
      console.log(`${i}. sent in ${(ms / 1000).toFixed(1)} s  ${explorerTxUrl(signature)}`);
    } catch (error) {
      console.log(`${i}. FAILED after ${((Date.now() - start) / 1000).toFixed(1)} s: ${describe(error)}`);
    }
  }

  console.log(`\n${succeeded} of ${count} reached devnet. ${withinAwardLimit} of ${count} confirmed within ${AWARD_LIMIT_MS / 1000} s, the limit awardPoints will use.`);
  if (succeeded < count) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(`Mint test failed: ${describe(error)}`);
  process.exitCode = 1;
});
