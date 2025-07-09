import { Schema, model } from 'mongoose';
import { IunitType } from '../interfaces/IunitType';
const unitTypeSchema = new Schema<IunitType>(
  {
    type: {
      type: 'String',
      required: true,
      enum: ['room', 'apartment', 'studio', 'Restroom', 'Villa', 'farm'],
    },
  },
  {
    timestamps: true,
  },
);
export const UnitTypeModel = model<IunitType>('UnitType', unitTypeSchema);
