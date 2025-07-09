import { Document, Types } from 'mongoose';

export interface IHistory extends Document {
  table: string;
  documentId: Types.ObjectId;
  action: 'create' | 'update' | 'delete' | 'restore' | 'login';
  timestamp: Date;
  performedBy: {
    userId: Types.ObjectId;
    name?: string;
    role?: string;
  };
  diff?: Record<string, any>; // or `any` if you want more flexibility
  reason?: string;
}
