// Council quest routes (Sarah): list items without answers; award once on a correct answer.
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { Hono } from 'hono';
import { z } from 'zod';
import type { CouncilAnswerResponse, CouncilListResponse } from '../../../shared/api';
import { POINTS } from '../../../shared/constants';
import { db, TABLES } from '../lib/db';
import { ApiError } from '../lib/errors';
import { requirePlayer } from '../players/auth';
import { awardId, awardPoints } from '../points/awardPoints';
import { COUNCIL_ITEMS, getCouncilItem, isCorrectCouncilAnswer, toCouncilItemView } from './councilItems';

export const councilRoutes = new Hono();

const AnswerSchema = z.object({
  playerId: z.string({ error: 'A player id is required.' }).min(1, 'A player id is required.'),
  itemId: z.string({ error: 'An item id is required.' }).min(1, 'An item id is required.'),
  answerIndex: z
    .number({ error: 'Pick one of the answers.' })
    .int('Pick one of the answers.')
    .min(0, 'Pick one of the answers.'),
});

async function hasCouncilAward(itemId: string, playerId: string): Promise<boolean> {
  const result = await db.send(
    new GetCommand({
      TableName: TABLES.awards,
      Key: { id: awardId('council', itemId, playerId) },
    }),
  );
  return Boolean(result.Item);
}

councilRoutes.get('/quests/council', async (c) => {
  const playerId = c.req.query('playerId');
  if (!playerId) throw new ApiError('validation_failed', 'playerId is required.');
  await requirePlayer(c, playerId);

  const items = await Promise.all(
    COUNCIL_ITEMS.map(async (item) => {
      const answered = await hasCouncilAward(item.id, playerId);
      return toCouncilItemView(item, answered);
    }),
  );
  const body: CouncilListResponse = { items };
  return c.json(body);
});

councilRoutes.post('/quests/council/answer', async (c) => {
  const input = AnswerSchema.parse(await c.req.json());
  const player = await requirePlayer(c, input.playerId);

  const item = getCouncilItem(input.itemId);
  if (!item) throw new ApiError('not_found', 'We could not find that council item.');

  if (!isCorrectCouncilAnswer(item, input.answerIndex)) {
    const body: CouncilAnswerResponse = { correct: false, award: null, player };
    return c.json(body);
  }

  const { award, player: awardedPlayer } = await awardPoints(
    input.playerId,
    POINTS.council,
    'council',
    item.id,
  );
  const body: CouncilAnswerResponse = { correct: true, award, player: awardedPlayer };
  return c.json(body);
});
