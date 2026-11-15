// Reads and validates every environment variable once. Nothing else reads process.env.
// The list and its meaning are in docs/TECHNICAL.md section 3.
import { z } from 'zod';

const EnvSchema = z
  .object({
    AWS_REGION: z.string().default('us-east-2'),
    TABLE_PLAYERS: z.string().default('streetcreds-players'),
    TABLE_REPORTS: z.string().default('streetcreds-reports'),
    TABLE_AWARDS: z.string().default('streetcreds-awards'),
    TABLE_DEAL_UNLOCKS: z.string().default('streetcreds-deal-unlocks'),
    TABLE_DEAL_REDEMPTIONS: z.string().default('streetcreds-deal-redemptions'),
    PHOTO_BUCKET: z.string().default(''),
    WEB_ORIGINS: z.string().default('http://localhost:5173'),
    GEMINI_API_KEY: z.string().default(''),
    GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
    SOLANA_MODE: z.enum(['off', 'per-player', 'shared']).default('off'),
    SOLANA_RPC_URL: z.url().default('https://api.devnet.solana.com'),
    SOLANA_TREASURY_SECRET: z.string().default(''),
    CIVIC_MINT: z.string().default(''),
  })
  .superRefine((value, ctx) => {
    // Hard rule: devnet only.
    if (value.SOLANA_RPC_URL.includes('mainnet')) {
      ctx.addIssue({ code: 'custom', path: ['SOLANA_RPC_URL'], message: 'StreetCreds runs on Solana devnet only.' });
    }
    if (value.SOLANA_MODE !== 'off') {
      for (const name of ['SOLANA_TREASURY_SECRET', 'CIVIC_MINT'] as const) {
        if (value[name] === '') {
          ctx.addIssue({ code: 'custom', path: [name], message: `Required when SOLANA_MODE is ${value.SOLANA_MODE}.` });
        }
      }
    }
  });

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  // An empty value (`PHOTO_BUCKET=` in .env, or an empty deploy parameter) counts as not set.
  const raw = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== undefined && value !== ''));
  const result = EnvSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const env: Env = loadEnv();

/**
 * For values the server can start without but a feature needs: the photo bucket and the Gemini key.
 * Throws a plain Error, which the error handler turns into `internal` and logs.
 */
export function requireEnv(name: 'PHOTO_BUCKET' | 'GEMINI_API_KEY'): string {
  const value = env[name];
  if (value === '') {
    throw new Error(`Environment variable ${name} is not set. See api/.env.example.`);
  }
  return value;
}
