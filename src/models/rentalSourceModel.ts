// filepath: c:\Coding\KCloud\kcloudBackEnd\src\models\rentalSourceModel.ts
import { Schema, model, Types } from 'mongoose';
import { IrentalSource } from '../interfaces/IrentalSource';
const rentalSourceSchema = new Schema<IrentalSource & { userId?: Types.ObjectId }>(
  {
    SourceName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    // Accept either ObjectId or string-based user ids
    userId: {
      type: Schema.Types.Mixed,
      required: [true, 'UserId is Required'],
    },
  },
  {
    timestamps: true,
  },
);

// ensure uniqueness per user
rentalSourceSchema.index({ SourceName: 1, userId: 1 }, { unique: true });

export const RentalSourceModel = model<IrentalSource & { userId?: any }>('RentalSource', rentalSourceSchema);

