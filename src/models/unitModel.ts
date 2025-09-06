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
const specialPriceSchema = new Schema(
  {
    type: { type: String, enum: ['weekly', 'once', 'monthly'], required: true },
    dayOfWeek: {
      type: String,
      enum: [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ],
    },
    date: { type: Date },
    price: { type: Number, min: 0, required: true },
  },
  { _id: true, timestamps: false },
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
  specialPrices: { type: [specialPriceSchema], default: [] },
  },
  {
    timestamps: true,
  },
);

export const UnitModel = model<IUnit>('Unit', unitSchema);
