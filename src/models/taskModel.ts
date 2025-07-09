import { Schema, model } from 'mongoose';
import { Itask } from '../interfaces/Itask';

const taskSchema = new Schema<Itask>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue', 'todo'],
    default: 'todo',
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  maintenanceID: {
    type: Schema.Types.ObjectId,
    ref: 'Maintenance',
    default: null,
  },
  unitID: { type: Schema.Types.ObjectId, ref: 'Unit', default: null },
  tanentID: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  contactID: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
  property: {
    id: { type: Schema.Types.ObjectId, required: true },
    address: { type: String, required: true },
    type: { type: String, required: true },
  },
  dueDate: { type: String, required: true },
  createdAt: { type: String, default: new Date().toISOString() },
  category: {
    type: String,
    enum: [
      'maintenance',
      'inspection',
      'cleaning',
      'marketing',
      'administrative',
    ],
    required: true,
  },
  isStarred: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
});

export const TaskModel = model<Itask>('Task', taskSchema);
