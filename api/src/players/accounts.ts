// The database calls for accounts: the link from a Google account to the one player it owns.
// The row holds Google's opaque id for the account and nothing else about the person:
// no email, no name, no picture.
import { DeleteCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { Account } from '../../../shared/types';
import { db, TABLES } from '../lib/db';
import { isConditionalCheckFailed } from './store';

/** The table key for a Google account. `sub` is the id Google gives the account. */
export function googleAccountKey(sub: string): string {
  return `google:${sub}`;
}

export async function getAccount(id: string): Promise<Account | null> {
  const result = await db.send(new GetCommand({ TableName: TABLES.accounts, Key: { id } }));
  return (result.Item as Account | undefined) ?? null;
}

/** Writes a new account. Returns false when that Google account already has one. */
export async function putNewAccount(account: Account): Promise<boolean> {
  try {
    await db.send(
      new PutCommand({
        TableName: TABLES.accounts,
        Item: account,
        ConditionExpression: 'attribute_not_exists(#id)',
        ExpressionAttributeNames: { '#id': 'id' },
      }),
    );
    return true;
  } catch (error) {
    if (isConditionalCheckFailed(error)) return false;
    throw error;
  }
}

/** Undoes a link whose player could not be written or saved. */
export async function deleteAccount(id: string): Promise<void> {
  await db.send(new DeleteCommand({ TableName: TABLES.accounts, Key: { id } }));
}
