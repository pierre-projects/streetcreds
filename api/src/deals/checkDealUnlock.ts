import type { DealUnlock, DealUnlockView } from '../../../shared/types';
import { getPlayer } from '../players/store';
import { distanceMeters } from './distance';
import { PARTNERS } from './partners';
import { getUnlock, putUnlockReplaceRedeemed, unlockId } from './store';

function toView(partner: (typeof PARTNERS)[number]): DealUnlockView {
  return {
    partnerId: partner.id,
    partnerName: partner.name,
    baseCost: partner.baseCost,
    unlockedCost: partner.unlockedCost,
  };
}

/**
 * After a report is published near a curated partner, create at most one active unlock
 * for that player+partner. Returns the client-facing unlock view, or null.
 */
export async function checkDealUnlock(
  playerId: string,
  lat: number,
  lng: number,
  reportId: string,
): Promise<DealUnlockView | null> {
  const here = { lat, lng };
  let nearest: (typeof PARTNERS)[number] | null = null;
  let nearestDistance = Infinity;

  for (const partner of PARTNERS) {
    const d = distanceMeters(here, { lat: partner.lat, lng: partner.lng });
    if (d <= partner.radiusMeters && d < nearestDistance) {
      nearest = partner;
      nearestDistance = d;
    }
  }
  if (!nearest) return null;

  const existing = await getUnlock(playerId, nearest.id);
  if (existing?.status === 'active') {
    return toView(nearest);
  }

  // A new unlock records the account the player is saved to, if any. Read only on this path.
  const player = await getPlayer(playerId);
  const unlock: DealUnlock = {
    id: unlockId(playerId, nearest.id),
    playerId,
    partnerId: nearest.id,
    reportId,
    createdAt: new Date().toISOString(),
    status: 'active',
    accountId: player?.accountId ?? null,
  };
  const saved = await putUnlockReplaceRedeemed(unlock);
  if (!saved) return null;
  return toView(nearest);
}
