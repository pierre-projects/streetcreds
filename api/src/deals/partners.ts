import type { Partner } from '../../../shared/types';
import partnersJson from './partners.json';

export const PARTNERS: Partner[] = partnersJson as Partner[];

export function getPartner(partnerId: string): Partner | undefined {
  return PARTNERS.find((p) => p.id === partnerId);
}
