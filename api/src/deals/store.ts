import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { DealRedemption, DealUnlock } from '../../../shared/types';
import { db, TABLES } from '../lib/db';
import { isConditionalCheckFailed } from '../players/store';

export function unlockId(playerId: string, partnerId: string): string {
  return `unlock:${playerId}:${partnerId}`;
}

export async function getUnlock(playerId: string, partnerId: string): Promise<DealUnlock | null> {
  const result = await db.send(
    new GetCommand({ TableName: TABLES.dealUnlocks, Key: { id: unlockId(playerId, partnerId) } }),
  );
  return (result.Item as DealUnlock | undefined) ?? null;
}

/** Writes an active unlock only if no row exists yet for this player+partner. Returns null if one already exists. */
export async function putUnlockIfNew(unlock: DealUnlock): Promise<DealUnlock | null> {
  try {
    await db.send(
      new PutCommand({
        TableName: TABLES.dealUnlocks,
        Item: unlock,
        ConditionExpression: 'attribute_not_exists(#id)',
        ExpressionAttributeNames: { '#id': 'id' },
      }),
    );
    return unlock;
  } catch (error) {
    if (isConditionalCheckFailed(error)) return null;
    throw error;
  }
}

/** Replaces a redeemed unlock with a fresh active one after another nearby report. */
export async function putUnlockReplaceRedeemed(unlock: DealUnlock): Promise<DealUnlock | null> {
  try {
    await db.send(
      new PutCommand({
        TableName: TABLES.dealUnlocks,
        Item: unlock,
        ConditionExpression: 'attribute_not_exists(#id) OR #status = :redeemed',
        ExpressionAttributeNames: { '#id': 'id', '#status': 'status' },
        ExpressionAttributeValues: { ':redeemed': 'redeemed' },
      }),
    );
    return unlock;
  } catch (error) {
    if (isConditionalCheckFailed(error)) return null;
    throw error;
  }
}

/** Marks an active unlock as redeemed. No-op if missing or already redeemed. */
export async function markUnlockRedeemed(playerId: string, partnerId: string): Promise<void> {
  try {
    await db.send(
      new UpdateCommand({
        TableName: TABLES.dealUnlocks,
        Key: { id: unlockId(playerId, partnerId) },
        UpdateExpression: 'SET #status = :redeemed',
        ConditionExpression: 'attribute_exists(#id) AND #status = :active',
        ExpressionAttributeNames: { '#id': 'id', '#status': 'status' },
        ExpressionAttributeValues: { ':redeemed': 'redeemed', ':active': 'active' },
      }),
    );
  } catch (error) {
    if (isConditionalCheckFailed(error)) return;
    throw error;
  }
}

export async function putRedemption(redemption: DealRedemption): Promise<void> {
  await db.send(
    new PutCommand({
      TableName: TABLES.dealRedemptions,
      Item: redemption,
      ConditionExpression: 'attribute_not_exists(#id)',
      ExpressionAttributeNames: { '#id': 'id' },
    }),
  );
}
