import { Schema, model } from 'mongoose';
import { IunitGroup } from '../interfaces/IunitGroup';
const unitGroupSchema = new Schema<IunitGroup>(
  {
    userID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: [true, 'Unit group name is required'],
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    unitGroupStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  },
);
export const UnitGroupModel = model<IunitGroup>('UnitGroup', unitGroupSchema);
