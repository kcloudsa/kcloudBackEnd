import { Schema, model } from 'mongoose';
import { IrentalSource } from '../interfaces/IrentalSource';
const rentalSourceSchema = new Schema<IrentalSource>(
  {
    SourceName: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'Booking',
        'Gather Inn',
        'Overnight stay',
        'Real estate',
        'Auction',
        'Airbnb',
        'Rent',
        'WhatsApp',
      ],
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);
export const RentalSourceModel = model<IrentalSource>(
  'RentalSource',
  rentalSourceSchema,
);
