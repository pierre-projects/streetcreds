// Mints CIVIC points on Solana devnet. Devnet only: the token has no value.
// Called by awardPoints (Phase 2) and by scripts/mint-test.ts. See docs/TECHNICAL.md section 6.
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { env } from '../lib/env';

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/**
 * A fresh devnet address for a new player. Only the address is returned and kept: the secret key
 * is dropped here, because minting to an address never needs it. Nothing sensitive is stored.
 */
export function newWalletAddress(): string {
  return Keypair.generate().publicKey.toBase58();
}

/** The page where anyone can look at a devnet transaction. */
export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

// Built on first use and kept, so a warm Lambda does not rebuild them for every award.
let cached: { connection: Connection; treasury: Keypair; mint: PublicKey } | undefined;

function solana() {
  if (env.SOLANA_MODE === 'off') {
    throw new Error('mintPoints was called while SOLANA_MODE is off.');
  }
  cached ??= {
    connection: new Connection(env.SOLANA_RPC_URL, 'confirmed'),
    treasury: Keypair.fromSecretKey(Buffer.from(env.SOLANA_TREASURY_SECRET, 'base64')),
    mint: new PublicKey(env.CIVIC_MINT),
  };
  return cached;
}

/**
 * Mints `points` CIVIC and returns the transaction signature.
 *
 * - per-player: the tokens go to the player's own token account.
 * - shared: the tokens go to the treasury's token account, and a memo names the player.
 *
 * The treasury pays every fee. The token has 0 decimals, so 50 points is the amount 50.
 * This function has no time limit of its own; the caller decides how long to wait.
 */
export async function mintPoints(player: { id: string; walletAddress: string | null }, points: number): Promise<string> {
  const { connection, treasury, mint } = solana();

  const playerWallet = env.SOLANA_MODE === 'per-player' ? player.walletAddress : null;
  const owner = playerWallet !== null ? new PublicKey(playerWallet) : treasury.publicKey;
  const tokenAccount = getAssociatedTokenAddressSync(mint, owner);

  const tx = new Transaction().add(
    // Creates the token account the first time; does nothing after that.
    createAssociatedTokenAccountIdempotentInstruction(treasury.publicKey, tokenAccount, owner, mint),
    createMintToInstruction(mint, tokenAccount, treasury.publicKey, points),
  );

  if (playerWallet === null) {
    // The memo holds the player id only. Never put a nickname on chain.
    tx.add(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_PROGRAM_ID,
        data: Buffer.from(`streetcreds:${player.id}:${points}`, 'utf8'),
      }),
    );
  }

  return sendAndConfirmTransaction(connection, tx, [treasury], { commitment: 'confirmed' });
}
