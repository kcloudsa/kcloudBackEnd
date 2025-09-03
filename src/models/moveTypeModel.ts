import { Schema, model, Types } from 'mongoose';
import { ImoveType } from '../interfaces/ImoveType';

const moveTypeSchema = new Schema<ImoveType & { userId?: Types.ObjectId }>(
  {
    type: {
      type: String,
      required: [true, 'Move type name is required'],
      lowercase: true,
      trim: true,
    },
    // Accept either ObjectId or string-based user ids (some auth systems use custom ids)
    userId: {
      type: Schema.Types.Mixed,
      // keep the same validation message
      required: [true, 'UserID is Required'],
    },
  },
  {
    timestamps: true,
  },
);

export const MoveTypeModel = model<ImoveType & { userId?: any }>(
  'MoveType',
  moveTypeSchema,
);
