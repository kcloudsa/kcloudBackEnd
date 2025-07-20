import { Document } from 'mongoose';
export interface ImoveType extends Document {
  type: string; //["debit", "credit"]
}
