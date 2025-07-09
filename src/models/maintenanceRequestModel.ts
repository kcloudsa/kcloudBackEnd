import { Schema, model, models } from 'mongoose';
import { ImaintenanceRequest } from '../interfaces/ImaintenanceRequest';

const maintenanceRequestSchema = new Schema<ImaintenanceRequest>(
  {
    unitID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Unit', // Assuming you have a Unit model
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Assuming you have a User model
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
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  },
);
export const MaintenanceRequestModel =
  models.MaintenanceRequest ||
  model<ImaintenanceRequest>('MaintenanceRequest', maintenanceRequestSchema);
