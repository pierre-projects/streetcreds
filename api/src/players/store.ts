// The database calls for players. Every call the app may make is listed in docs/TECHNICAL.md section 4.
import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { Player } from '../../../shared/types';
import { db, TABLES } from '../lib/db';

/** True when a write was refused because its ConditionExpression did not hold. */
export function isConditionalCheckFailed(error: unknown): boolean {
  return error instanceof Error && error.name === 'ConditionalCheckFailedException';
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
  return (result.Item as Player | undefined) ?? null;
}

/** Every player. A scan returns at most 1 MB at a time, so follow LastEvaluatedKey to the end. */
export async function scanPlayers(): Promise<Player[]> {
  const players: Player[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await db.send(new ScanCommand({ TableName: TABLES.players, ExclusiveStartKey: startKey }));
    players.push(...((page.Items ?? []) as Player[]));
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return players;
}
