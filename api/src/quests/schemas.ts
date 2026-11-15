import { z } from 'zod';
import { CATEGORIES } from '../../../shared/constants';
import type { Category } from '../../../shared/types';

const CATEGORY_IDS = CATEGORIES as unknown as [Category, ...Category[]];

export const CreateReportSchema = z.object({
  playerId: z.string().min(1),
  photoKey: z.string().min(1),
});

export const SubmitReportSchema = z.object({
  playerId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  category: z.enum(CATEGORY_IDS).optional(),
});
