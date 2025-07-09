import { z } from 'zod';

export const createUintTypeSchema = z.object({
  type: z.string().min(1, { message: 'Unit type is required' }),
});
export type CreateUnitType = z.infer<typeof createUintTypeSchema>;
