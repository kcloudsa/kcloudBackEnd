import { Document, Schema } from 'mongoose';
export interface ImaintenanceRequest extends Document {
  unitID: Schema.Types.ObjectId;
  reportedBy: Schema.Types.ObjectId;
  title: string;
  description: string;
  status: string; // 'open' | 'in-progress' | 'closed';
  priority: string; // 'low' | 'medium' | 'high';
  resolvedAt?: Date; // Optional date when the request was resolved
  dueDate?: Date; // Optional due date for the maintenance request
}
