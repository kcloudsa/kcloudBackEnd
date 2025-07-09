import { z } from 'zod';

export const createUintGroupsSchema = z.object({
  userID: z.string().min(1, { message: 'User ID is required' }),
  name: z.string().min(1, { message: 'Unit group name is required' }),
  description: z.string().optional(),
  unitGroupStatus: z.enum(['active', 'inactive']).default('active'),
});
export type CreateUnitType = z.infer<typeof createUintGroupsSchema>;
