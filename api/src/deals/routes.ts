// Local Deals routes (Pierre): list partners and redeem.
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { z } from 'zod';
import type { ListDealsResponse, RedeemDealResponse } from '../../../shared/api';
import type { DealPartnerView, DealRedemption } from '../../../shared/types';
import { env } from '../lib/env';
import { ApiError } from '../lib/errors';
import { requirePlayer } from '../players/auth';
import { spendPoints } from '../points/spendPoints';
import { PARTNERS, getPartner } from './partners';
import { getUnlock, markUnlockRedeemed, putRedemption } from './store';

export const dealRoutes = new Hono();

const RedeemSchema = z.object({
  playerId: z.string().min(1),
});

function demoCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return out;
}

dealRoutes.get('/deals', async (c) => {
  const playerId = c.req.query('playerId');
  if (!playerId) throw new ApiError('validation_failed', 'playerId is required.');
  await requirePlayer(c, playerId);

  const partners: DealPartnerView[] = [];
  for (const partner of PARTNERS) {
    const unlock = await getUnlock(playerId, partner.id);
    const unlocked = unlock?.status === 'active';
    partners.push({
      id: partner.id,
      name: partner.name,
      neighborhood: partner.neighborhood,
      category: partner.category,
      lat: partner.lat,
      lng: partner.lng,
      baseCost: partner.baseCost,
      unlockedCost: partner.unlockedCost,
      offer: partner.offer,
      unlocked,
      currentCost: unlocked ? partner.unlockedCost : partner.baseCost,
    });
  }
  const body: ListDealsResponse = { partners };
  return c.json(body);
});

dealRoutes.post('/deals/:partnerId/redeem', async (c) => {
  const partnerId = c.req.param('partnerId');
  const partner = getPartner(partnerId);
  if (!partner) throw new ApiError('not_found', 'We could not find that deal.');

  const input = RedeemSchema.parse(await c.req.json());
  const player = await requirePlayer(c, input.playerId);

  const unlock = await getUnlock(input.playerId, partnerId);
  const usedUnlock = unlock?.status === 'active';
  const cost = usedUnlock ? partner.unlockedCost : partner.baseCost;

  const updated = await spendPoints(input.playerId, cost);
  if (usedUnlock) await markUnlockRedeemed(input.playerId, partnerId);

  const redemption: DealRedemption = {
    id: randomUUID(),
    playerId: input.playerId,
    partnerId,
    pointsSpent: cost,
    usedUnlock,
    code: demoCode(),
    txSignature: null,
    chainStatus: env.SOLANA_MODE === 'off' ? 'off' : 'pending',
    createdAt: new Date().toISOString(),
    accountId: player.accountId,
  };
  await putRedemption(redemption);

  const body: RedeemDealResponse = { redemption, player: updated };
  return c.json(body);
});
