import { Schema, model } from 'mongoose';
import { Inotification } from '../interfaces/Inotification';

const notificationSchema = new Schema<Inotification>(
  {
    userID: { type: String, required: true },
    type: {
      type: String,
      required: [true, 'type is required'],
      enum: ['message', 'alert', 'danger'],
      default: 'message',
    }, // e.g., 'message', 'alert', 'danger'
    title: { type: String, required: [true, 'title is required'] }, // e.g., 'New Message', 'System Alert'
    message: { type: String, required: [true, 'message is required'] },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  },
);
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1209600 });
export const NotificationModel = model<Inotification>(
  'Notification',
  notificationSchema,
);
