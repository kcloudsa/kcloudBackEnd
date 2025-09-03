import { model, Schema } from 'mongoose';
import { IUnit } from '../interfaces/Iunit';

const locationSchema = new Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    geo: {
      latitude: { type: Number, required: false },
      longitude: { type: Number, required: false },
    },
  },
  { _id: false },
);
export const unitSchema = new Schema<IUnit>(
  {
    uniteGroupID: {
      type: Schema.Types.ObjectId,
      ref: 'UnitGroup',
    },
    userID: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    unitTypeID: {
      type: Schema.Types.ObjectId,
      ref: 'UnitType',
      required: true,
    },
    number: { type: String, required: true },
    description: { type: String, default: '' },
    notes: { type: String, default: '' },
    processingCost: { type: Number, required: true, default: 0 },
    location: locationSchema,
    baseUnit: { type: String, required: true, default: 'meter' }, // e.g., 'meter' for length
    unitMedia: [{ type: String }], // Array of media URLs or identifiers
    favorite: { type: Boolean, default: false },
    unitStatus: {
      type: String,
      enum: ['available', 'reserved', 'under_maintenance'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  },
);

export const UnitModel = model<IUnit>('Unit', unitSchema);
