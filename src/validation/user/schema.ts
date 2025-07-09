// eslint-disable-next-line import/no-extraneous-dependencies
import { z } from 'zod';

export const createUserSchema = z.object({
  userName: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    displayName: z.string().min(1, 'Display name is required'),
  }),

  contactInfo: z.object({
    email: z.object({
      email: z.string().email(),
      verified: z.boolean(),
      verifiedAt: z.union([z.date(), z.string(), z.null()]),
      verificationCode: z.string(),
    }),
    phone: z.object({
      countryCode: z.string(),
      phoneNumber: z.string(),
      verified: z.boolean(),
      verifiedAt: z.union([z.date(), z.string(), z.null()]),
      verificationCode: z.string(),
    }),
  }),

  password: z.object({
    hashed: z.string(),
    expirationDate: z.union([z.date(), z.string()]),
  }),

  historyID: z.string().nullable().optional(),

  userInfo: z.object({
    gender: z.string(),
    nationality: z.string(),
    address: z.object({
      city: z.string(),
      country: z.string(),
    }),
    profilePicture: z.string().optional(),
  }),

  active: z.boolean().optional(),
  role: z.enum(['user', 'owner', 'admin', 'demo', 'tenant']),
  subUsersIDs: z.array(z.string()).optional(),
  subscriptionID: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
