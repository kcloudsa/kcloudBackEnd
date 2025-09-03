import { Schema, model, Types } from 'mongoose';
import { IunitType } from '../interfaces/IunitType';

const unitTypeSchema = new Schema<IunitType & { userId?: Types.ObjectId }>(
  {
    type: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'UserId is required'],
    },
  },
  {
    timestamps: true,
  },
);

export const UnitTypeModel = model<IunitType & { userId?: Types.ObjectId }>(
  'UnitType',
  unitTypeSchema,
);
