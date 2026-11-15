// The only way points are created. Sarah's quest routes call this; nothing else adds points.
//
//   const { award, player } = await awardPoints(playerId, POINTS['report-new'], 'report-new', report.id);
//
// THIS IS THE PHASE 1 STUB: it does the database half and never mints. Phase 2 adds the devnet
// mint after step 3 without changing the signature or the return shape, so callers stay as they are.
// The full steps are in docs/TECHNICAL.md section 6.
import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Award, Player, QuestType } from '../../../shared/types';
import { db, TABLES } from '../lib/db';
import { env } from '../lib/env';
import { ApiError } from '../lib/errors';
import { isConditionalCheckFailed } from '../players/store';

/**
 * The award's id. It is built from what the award is for, so the same award can never be paid twice:
 * a second attempt produces the same id and the conditional write refuses it.
 */
export function awardId(questType: QuestType, refId: string, playerId: string): string {
  return `${questType}#${refId}#${playerId}`;
}

/**
 * @param refId The thing the award is for: a report id or a council item id.
 * @throws ApiError('already_awarded') if this player already has this award.
 * @throws ApiError('not_found') if the player does not exist. Callers should check first.
 */
export async function awardPoints(
  playerId: string,
  points: number,
  questType: QuestType,
  refId: string,
): Promise<{ award: Award; player: Player }> {
  // 1 and 2. Write the award once.
  const award: Award = {
    id: awardId(questType, refId, playerId),
    playerId,
    questType,
    points,
    txSignature: null,
    chainStatus: env.SOLANA_MODE === 'off' ? 'off' : 'pending',
    createdAt: new Date().toISOString(),
  };
  try {
    await db.send(
      new PutCommand({
        TableName: TABLES.awards,
        Item: award,
        ConditionExpression: 'attribute_not_exists(#id)',
        ExpressionAttributeNames: { '#id': 'id' },
      }),
    );
  } catch (error) {
    if (isConditionalCheckFailed(error)) throw new ApiError('already_awarded');
    throw error;
  }

  // 3. Add the points in one atomic step. The condition stops DynamoDB from creating a player
  //    out of nothing when the id does not exist.
  let player: Player;
  try {
    const result = await db.send(
      new UpdateCommand({
        TableName: TABLES.players,
        Key: { id: playerId },
        UpdateExpression: 'ADD #points :points',
        ConditionExpression: 'attribute_exists(#id)',
        ExpressionAttributeNames: { '#points': 'points', '#id': 'id' },
        ExpressionAttributeValues: { ':points': points },
        ReturnValues: 'ALL_NEW',
      }),
    );
    player = result.Attributes as Player;
  } catch (error) {
    if (isConditionalCheckFailed(error)) throw new ApiError('not_found', 'We could not find that player.');
    throw error;
  }

  // 4. Phase 2: mint on devnet here, with a 10 second limit, and save the signature.

  // 5.
  return { award, player };
}
