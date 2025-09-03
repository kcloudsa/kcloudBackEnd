import { Document, Schema } from 'mongoose';

export interface Inotification extends Document {
  userID: Schema.Types.ObjectId; // Reference to the user
  type: string; // e.g., 'message', 'alert','danger'  etc.
  title: string; // e.g., 'New Message', 'System Alert'
  message: string;
  read: boolean;
}
