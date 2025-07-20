import { z } from 'zod';

export const createRentalSourceSchema = z.object({
  SourceName: z.string().min(1, { message: 'Rental SourceName is required' }),
  description: z.string().optional(),
});
export type CreateRentalSource = z.infer<typeof createRentalSourceSchema>;
