// The only way points are spent. Local Deals redeem calls this; nothing else subtracts points.
// Mirrors awardPoints: one atomic ADD of a negative amount with a balance condition.
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Player } from '../../../shared/types';
import { db, TABLES } from '../lib/db';
import { ApiError } from '../lib/errors';
import { isConditionalCheckFailed } from '../players/store';

/**
 * Subtracts `points` from the player's balance in one atomic step.
 * @throws ApiError('insufficient_points') when the balance is too low or the player is missing.
 */
export async function spendPoints(playerId: string, points: number): Promise<Player> {
  if (!Number.isInteger(points) || points <= 0) {
    throw new ApiError('validation_failed', 'Spend amount must be a positive whole number.');
  }

  try {
    const result = await db.send(
      new UpdateCommand({
        TableName: TABLES.players,
        Key: { id: playerId },
        UpdateExpression: 'ADD #points :delta',
        ConditionExpression: 'attribute_exists(#id) AND #points >= :cost',
        ExpressionAttributeNames: { '#points': 'points', '#id': 'id' },
        ExpressionAttributeValues: { ':delta': -points, ':cost': points },
        ReturnValues: 'ALL_NEW',
      }),
    );
    return result.Attributes as Player;
  } catch (error) {
    if (isConditionalCheckFailed(error)) {
      throw new ApiError('insufficient_points', `You need ${points} CIVIC for this deal.`);
    }
    throw error;
  }
}
