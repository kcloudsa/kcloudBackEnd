import { Document } from 'mongoose';

export interface IunitType extends Document {
  type: string; // ["room", "apartment", "studio", "Restroom", "Villa", "farm"]
}
