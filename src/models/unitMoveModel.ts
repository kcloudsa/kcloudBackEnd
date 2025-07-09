import { Schema, model } from 'mongoose';
import { IunitMove } from '../interfaces/IunitMove';

const unitMoveSchema = new Schema<IunitMove>(
  {
    unitID: {
      type: Schema.Types.ObjectId,
      required: [true, 'unit id is required'],
      ref: 'Unit',
    },
    moveTypeID: {
      type: Schema.Types.ObjectId,
      required: [true, 'moveType is required'],
      ref: 'MoveType',
    },
    maintenanceID: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'Maintenance',
    },
    rentalID: { type: Schema.Types.ObjectId, required: false, ref: 'Rental' },
    userID: {
      type: Schema.Types.ObjectId,
      required: [true, 'userID is required'],
      ref: 'User',
    },
    moveDate: { type: Date, required: true },
    writeDate: { type: Date, default: Date.now },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    description: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

export const UnitMoveModel = model<IunitMove>('UnitMove', unitMoveSchema);
