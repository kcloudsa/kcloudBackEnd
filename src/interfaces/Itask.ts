import { Document, Schema } from 'mongoose';

interface Property {
  id: string;
  address: string;
  type: string;
}

export interface Itask extends Document {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue' | 'todo';
  assignedTo: Schema.Types.ObjectId | null;
  maintenanceID: Schema.Types.ObjectId | null;
  unitID: Schema.Types.ObjectId | null;
  tanentID: Schema.Types.ObjectId | null;
  contactID: Schema.Types.ObjectId | null;
  property: Property;
  dueDate: string;
  createdAt: string;
  category:
    | 'maintenance'
    | 'inspection'
    | 'cleaning'
    | 'marketing'
    | 'administrative';
  isStarred?: boolean;
  isArchived?: boolean;
}
