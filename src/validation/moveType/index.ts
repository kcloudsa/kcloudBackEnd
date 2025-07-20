import { z } from 'zod';

export const createMoveTypeSchema = z.object({
  type: z.string().min(1, { message: 'move type is required' }),
});
export type CreateMoveType = z.infer<typeof createMoveTypeSchema>;
