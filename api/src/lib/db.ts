// The one DynamoDB client. Items are plain objects whose attribute names are the field names
// in shared/types.ts, so an item read from a table is already a Player, Report or Award.
// Rules for expressions (aliases, atomic adds, "only once" writes) are in docs/TECHNICAL.md section 4.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from './env';

export const db = DynamoDBDocumentClient.from(new DynamoDBClient({ region: env.AWS_REGION }), {
  // null is stored as DynamoDB NULL. undefined is a bug in the caller, so let it throw.
  marshallOptions: { removeUndefinedValues: false },
});

export const TABLES = {
  players: env.TABLE_PLAYERS,
  reports: env.TABLE_REPORTS,
  awards: env.TABLE_AWARDS,
  dealUnlocks: env.TABLE_DEAL_UNLOCKS,
  dealRedemptions: env.TABLE_DEAL_REDEMPTIONS,
  accounts: env.TABLE_ACCOUNTS,
  sessions: env.TABLE_SESSIONS,
} as const;
