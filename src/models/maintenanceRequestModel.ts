import { Schema, model, models } from 'mongoose';
import { ImaintenanceRequest } from '../interfaces/ImaintenanceRequest';

const maintenanceRequestSchema = new Schema<ImaintenanceRequest>(
  {
    unitID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Unit',
    },
    reportedBy: {
      type: Schema.Types.ObjectId || String,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    resolvedAt: {
      type: Date,
      default: null, // Optional date when the request was resolved
    },
    credit: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  },
);
export const MaintenanceRequestModel =
  models.MaintenanceRequest ||
  model<ImaintenanceRequest>('MaintenanceRequest', maintenanceRequestSchema);
