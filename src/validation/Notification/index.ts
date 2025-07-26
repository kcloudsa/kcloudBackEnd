import { z } from 'zod';

export const createNotificationSchema = z.object({
  userID: z.string().min(1, { message: 'User ID is required' }),
  type: z.enum(['message', 'alert', 'danger'], {
    message: 'Invalid notification type',
  }),
  title: z.string().min(1, { message: 'Title is required' }),
  message: z.string().min(1, { message: 'Message is required' }),
  read: z.boolean().optional(),
});

export type createNotification = z.infer<typeof createNotificationSchema>;
