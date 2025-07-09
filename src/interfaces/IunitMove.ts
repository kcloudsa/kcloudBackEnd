import { Document, Schema } from 'mongoose';

export interface IunitMove extends Document {
  unitID: Schema.Types.ObjectId;
  moveTypeID: Schema.Types.ObjectId;
  maintenanceID: Schema.Types.ObjectId;
  rentalID: Schema.Types.ObjectId;
  userID: Schema.Types.ObjectId;
  moveDate: Date;
  writeDate: Date;
  debit: number;
  credit: number;
  description: string;
}
