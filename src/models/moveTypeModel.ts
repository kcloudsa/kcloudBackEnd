import { Schema, model } from 'mongoose';
import { ImoveType } from '../interfaces/ImoveType';
const moveTypeSchema = new Schema<ImoveType>(
  {
    name: {
      type: String,
      required: [true, 'Move type name is required'],
      enum: ['debit', 'credit'],
      // This ensures that the name can only be 'debit' or 'credit'
      // and is not case-sensitive.
      lowercase: true,
      trim: true,
      // unique: true,
    },
  },
  {
    timestamps: true,
  },
);
export const MoveTypeModel = model<ImoveType>('MoveType', moveTypeSchema);
