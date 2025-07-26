import { z } from 'zod';

export const createRentalSchema = z
  .object({
    unitID: z.string().min(1, 'Unit ID is required'),
    contractNumber: z.string().min(1, 'Contract Number is required'),
    moveTypeID: z.string().min(1, 'moveTypeID  is required'),
    rentalSourceID: z.string().min(1, 'rentalSourceID  is required'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    startPrice: z.number().min(0),
    currentPrice: z.number().min(0).optional(),
    rentalAmount: z.number().min(0),
    securityDeposit: z.number().min(0),
    isMonthly: z.boolean().optional(),
    monthsCount: z.number().min(0).optional(),
    roommates: z.number().min(0).optional(),
    notes: z.string().optional(),
    periodicIncrease: z
      .object({
        increaseValue: z.number(),
        periodicDuration: z.number(),
        isPercentage: z.boolean(),
      })
      .optional(),
    specialPrices: z
      .array(
        z.object({
          type: z.enum(['weekly', 'once', 'monthly']),
          dayOfWeek: z
            .enum([
              'Sunday',
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
            ])
            .optional(),
          date: z.coerce.date().optional(),
          price: z.number().min(0),
        }),
      )
      .optional(),
    participats: z.object({
      owner: z.object({
        userID: z.string(),
        role: z.literal('owner').optional(),
      }),
      tentant: z.object({
        userID: z.string(),
        role: z.literal('tentant').optional(),
      }),
    }),
    createdAt: z.date().default(new Date()),
    updatedAt: z.date().default(new Date()),
  })
  .refine(
    (data) => {
      // Case 1: If endDate exists, it must be after startDate
      if (data.endDate && data.endDate <= data.startDate) {
        return false;
      }

      // Case 2: If endDate is not given, must provide valid monthly info
      if (
        !data.endDate &&
        (!data.isMonthly || data.monthsCount === undefined)
      ) {
        return false;
      }

      return true;
    },
    {
      message:
        'Either provide a valid endDate after startDate, or set isMonthly with monthsCount > 0',
      path: ['endDate'], // Optional: could also use 'monthsCount' or general
    },
  );
export type createRental = z.infer<typeof createRentalSchema>;
