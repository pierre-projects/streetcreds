// The database calls for players. Every call the app may make is listed in docs/TECHNICAL.md section 4.
import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Player } from '../../../shared/types';
import { db, TABLES } from '../lib/db';

/** True when a write was refused because its ConditionExpression did not hold. */
export function isConditionalCheckFailed(error: unknown): boolean {
  return error instanceof Error && error.name === 'ConditionalCheckFailedException';
}

/**
 * A row from the players table as a Player. Rows written before accounts existed have no
 * `accountId` attribute; they are guests, so it reads as null.
 */
export function toPlayer(item: Record<string, unknown>): Player {
  const player = item as unknown as Player;
  return { ...player, accountId: player.accountId ?? null };
}

/** Writes a new player. The condition stops an existing player from ever being overwritten. */
export async function putNewPlayer(player: Player): Promise<void> {
  await db.send(
    new PutCommand({
      TableName: TABLES.players,
      Item: player,
      ConditionExpression: 'attribute_not_exists(#id)',
      ExpressionAttributeNames: { '#id': 'id' },
    }),
  );
}

export async function getPlayer(playerId: string): Promise<Player | null> {
  const result = await db.send(new GetCommand({ TableName: TABLES.players, Key: { id: playerId } }));
  return result.Item ? toPlayer(result.Item) : null;
}

/** Every player. A scan returns at most 1 MB at a time, so follow LastEvaluatedKey to the end. */
export async function scanPlayers(): Promise<Player[]> {
  const players: Player[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await db.send(new ScanCommand({ TableName: TABLES.players, ExclusiveStartKey: startKey }));
    players.push(...(page.Items ?? []).map(toPlayer));
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return players;
}

/**
 * Saves a guest player to an account. Returns the updated player, or null when the player does
 * not exist or already belongs to an account: a player is linked once and never moved.
 */
export async function linkAccount(playerId: string, accountId: string): Promise<Player | null> {
  try {
    const result = await db.send(
      new UpdateCommand({
        TableName: TABLES.players,
        Key: { id: playerId },
        UpdateExpression: 'SET #accountId = :accountId',
        // Guest rows either lack the attribute (made before accounts) or hold a DynamoDB NULL.
        ConditionExpression: 'attribute_exists(#id) AND (attribute_not_exists(#accountId) OR attribute_type(#accountId, :null))',
        ExpressionAttributeNames: { '#id': 'id', '#accountId': 'accountId' },
        ExpressionAttributeValues: { ':accountId': accountId, ':null': 'NULL' },
        ReturnValues: 'ALL_NEW',
      }),
    );
    return result.Attributes ? toPlayer(result.Attributes) : null;
  } catch (error) {
    if (isConditionalCheckFailed(error)) return null;
    throw error;
  }
}
