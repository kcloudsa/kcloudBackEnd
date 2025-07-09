import { Document } from 'mongoose';
export interface ImoveType extends Document {
  name: string; //["debit", "credit"]
}
