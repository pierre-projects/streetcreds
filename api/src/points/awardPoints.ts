// The only way points are created. Sarah's quest routes call this; nothing else adds points.
//
//   const { award, player } = await awardPoints(playerId, POINTS['report-new'], 'report-new', report.id);
//
// Points in DynamoDB are the source of truth. The Solana mint mirrors them: if devnet is slow or
// down, the points still count and the award is left "pending". The steps are in
// docs/TECHNICAL.md section 6.
import { PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { Award, Player, QuestType } from '../../../shared/types';
import { db, TABLES } from '../lib/db';
import { env } from '../lib/env';
import { ApiError } from '../lib/errors';
import { isConditionalCheckFailed } from '../players/store';
import { redactRpcUrl } from './redact';
import { withLimit } from './withLimit';

/** How long to wait for devnet before giving up on the mint. The whole request must fit in 29 s. */
const MINT_LIMIT_MS = 10_000;

/**
 * The award's id. It is built from what the award is for, so the same award can never be paid twice:
 * a second attempt produces the same id and the conditional write refuses it.
 */
export function awardId(questType: QuestType, refId: string, playerId: string): string {
  return `${questType}#${refId}#${playerId}`;
}

/**
 * @param refId The thing the award is for: a report id or a council item id.
 * @returns The award and the player with their new total. `award.chainStatus` is `off` when Solana
 *   is off, `sent` (with `txSignature`) when the mint confirmed, and `pending` when it did not.
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

  // 4. Mirror the points on devnet. From here on nothing may throw: the points already count.
  if (env.SOLANA_MODE === 'off') {
    return { award, player };
  }
  return { award: await mintAndRecord(award, player), player };
}

/** Mints the award's points and saves the transaction. On any failure the award stays "pending". */
async function mintAndRecord(award: Award, player: Player): Promise<Award> {
  try {
    // Loaded only when an award needs it, so routes that never mint start quickly.
    const { mintPoints } = await import('./solana');
    const txSignature = await withLimit(mintPoints(player, award.points), MINT_LIMIT_MS);
    await db.send(
      new UpdateCommand({
        TableName: TABLES.awards,
        Key: { id: award.id },
        UpdateExpression: 'SET #txSignature = :signature, #chainStatus = :sent',
        ExpressionAttributeNames: { '#txSignature': 'txSignature', '#chainStatus': 'chainStatus' },
        ExpressionAttributeValues: { ':signature': txSignature, ':sent': 'sent' },
      }),
    );
    return { ...award, txSignature, chainStatus: 'sent' };
  } catch (error) {
    const firstLine = error instanceof Error ? (error.message.split('\n')[0] ?? '') : String(error);
    console.error(
      JSON.stringify({
        level: 'error',
        msg: 'Mint failed. The points count and the award stays pending.',
        awardId: award.id,
        // The Solana address can hold an access key, so it never goes into the log.
        cause: redactRpcUrl(firstLine, env.SOLANA_RPC_URL),
      }),
    );
    return award;
  }
}
