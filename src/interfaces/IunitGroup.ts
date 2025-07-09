import { Document, Schema } from 'mongoose';
export interface IunitGroup extends Document {
  userID: Schema.Types.ObjectId;
  name: string;
  description?: string;
  unitGroupStatus: string;
}
